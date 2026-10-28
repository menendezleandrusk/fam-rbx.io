# ==============================================================================
# main.py — Servidor Web FastAPI con Blindaje DevSecOps (OWASP Top 10)
# Fuerza Aérea Mexicana (FAM) - Roblox Ro-Army
# Autenticación Obligatoria, Sanitización Pydantic y Manejo Seguro de Errores
# ==============================================================================

import os
import re
import html
import time
from typing import Optional, List, Dict, Any
from collections import defaultdict
import httpx
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from auth import (
    generate_csrf_state,
    build_discord_auth_url,
    exchange_code_for_token,
    verify_fam_discord_user,
    create_access_token,
    require_auth,
    require_instructor,
    REDIRECT_URI,
    FAM_GUILD_ID
)
import database

# ==============================================================================
# INICIALIZACIÓN DE LA APLICACIÓN FASTAPI
# ==============================================================================

app = FastAPI(
    title="Fuerza Aérea Mexicana — Sistema Oficial de Diplomas y Bot",
    description="Portal Militar DevSecOps para Expedición y Verificación de Diplomas de Ro-Army.",
    version="2.0.0",
    docs_url=None,       # Ocultar docs en producción por seguridad
    redoc_url=None
)

# Headers de Seguridad Militar (OWASP Security Headers)
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# ==============================================================================
# RATE LIMITING EN MEMORIA (DEFENSA ANTI BRUTE-FORCE / DOS)
# ==============================================================================

rate_limits = defaultdict(list)

def check_rate_limit(client_ip: str, max_requests: int = 15, window_seconds: int = 60) -> bool:
    """Verifica si una IP ha excedido el límite permitido en la ventana de tiempo."""
    now = time.time()
    requests = [t for t in rate_limits[client_ip] if now - t < window_seconds]
    rate_limits[client_ip] = requests

    if len(requests) >= max_requests:
        return False
    rate_limits[client_ip].append(now)
    return True

# ==============================================================================
# ESQUEMAS PYDANTIC CON VALIDACIÓN ESTRICTA Y SANITIZACIÓN
# ==============================================================================

def sanitize_text(val: str) -> str:
    """Elimina etiquetas HTML y caracteres de inyección."""
    if not val:
        return ""
    clean = re.sub(r'<[^>]*>', '', str(val))
    return html.escape(clean).strip()

class DiplomaExpediteSchema(BaseModel):
    cadet_roblox: str = Field(..., min_length=3, max_length=20, description="Nombre de usuario oficial en Roblox")
    course: str = Field(..., min_length=3, max_length=150, description="Curso militar cursado")
    rank: str = Field(default="Subteniente C.P.A.", max_length=100)
    notes: Optional[str] = Field(default="Aprobación satisfactoria de adiestramiento aéreo militar.", max_length=500)
    cadet_discord_id: Optional[str] = Field(default="000000000000000000", max_length=32)
    cadet_discord_tag: Optional[str] = Field(default="Cadete#0000", max_length=64)
    base_location: Optional[str] = Field(default="Base Aérea Militar No. 1 Santa Lucía", max_length=120)
    guild_id: Optional[str] = Field(default=None, max_length=32)

    @field_validator("cadet_roblox")
    def validate_roblox_username(cls, v: str) -> str:
        v = sanitize_text(v)
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', v):
            raise ValueError("El nombre de Roblox debe contener entre 3 y 20 caracteres alfanuméricos.")
        return v

    @field_validator("course", "rank", "notes", "base_location")
    def sanitize_strings(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_text(v) if v else v

class GuildConfigUpdateSchema(BaseModel):
    guild_id: str = Field(..., min_length=15, max_length=32)
    guild_name: str = Field(..., min_length=2, max_length=100)
    official_log_channel_id: Optional[str] = Field(default=None, max_length=32)
    instructor_role_id: Optional[str] = Field(default=None, max_length=32)
    embed_color_hex: Optional[str] = Field(default="#1E3A1E", max_length=10)
    prefix: Optional[str] = Field(default="!", max_length=5)

    @field_validator("guild_name", "embed_color_hex", "prefix")
    def sanitize_config(cls, v: Optional[str]) -> Optional[str]:
        return sanitize_text(v) if v else v

# ==============================================================================
# MANEJO SEGURO DE ERRORES (OWASP ERROR HANDLING)
# ==============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Evita exponer trazas de código o variables de entorno al cliente."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Se produjo un error interno procesando la solicitud militar. Contacte a la Comandancia de la FAM."
        }
    )

# ==============================================================================
# RUTAS DE AUTENTICACIÓN DISCORD OAUTH2
# ==============================================================================

@app.get("/auth/url")
async def get_oauth_url(request: Request, response: Response):
    """Genera la URL oficial de Discord OAuth2 con token Anti-CSRF criptográfico."""
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"auth:{client_ip}", max_requests=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Control de Tasa: Demasiadas solicitudes de autenticación.")

    state = generate_csrf_state()
    auth_url = build_discord_auth_url(state)

    # Cookie temporal HttpOnly para validar el parámetro state al regresar
    response.set_cookie(
        key="fam_csrf_state",
        value=state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600  # 10 minutos
    )

    return {"success": True, "url": auth_url, "redirect_uri": REDIRECT_URI}

@app.get("/auth/callback")
async def oauth_callback(code: Optional[str] = None, state: Optional[str] = None, request: Request = None):
    """
    Procesa el callback de Discord:
    1. Verifica coincidencia estricta del CSRF state.
    2. Intercambia código por access_token.
    3. Doble validación: pertenencia al servidor FAM y rol de Instructor.
    4. Firma JWT y almacena en Cookie HttpOnly segura.
    """
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorización ausente en la petición.")

    stored_state = request.cookies.get("fam_csrf_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=403, detail="Violación de Seguridad CSRF: El parámetro 'state' no coincide.")

    # Intercambio de código por token
    access_token = await exchange_code_for_token(code)
    if not access_token:
        raise HTTPException(status_code=401, detail="No se pudo obtener el token de acceso de Discord.")

    # Doble validación en Discord
    user_data = await verify_fam_discord_user(access_token)

    # Firmar JWT de sesión
    session_token = create_access_token(user_data)

    # Respuesta visual militar segura
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Autenticación Militar — FAM</title>
        <style>
            body {{ background: #020617; color: #f8fafc; font-family: system-ui, sans-serif; text-align: center; padding: 40px; }}
            .card {{ max-width: 480px; margin: 40px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .badge {{ display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }}
            .badge-instructor {{ background: #064e3b; color: #34d399; border: 1px solid #059669; }}
            .badge-cadete {{ background: #1e293b; color: #94a3b8; border: 1px solid #334155; }}
            .btn {{ display: inline-block; margin-top: 24px; padding: 12px 24px; background: #10b981; color: #022c22; font-weight: bold; border-radius: 8px; text-decoration: none; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h2>✈️ Fuerza Aérea Mexicana</h2>
            <p>Efectivo Validado: <strong>{user_data['username']}</strong></p>
            <div class="badge {'badge-instructor' if user_data['is_instructor'] else 'badge-cadete'}">
                {'🎖️ Oficial Instructor Autorizado' if user_data['is_instructor'] else '📋 Cadete / Efectivo General'}
            </div>
            <br>
            <a href="/" class="btn">Ingresar al Portal →</a>
        </div>
        <script>
            try {{
                if (window.opener) {{
                    window.opener.postMessage({{ type: 'OAUTH_AUTH_SUCCESS', user: {html.escape(str(user_data).replace("'", '"'))} }}, '*');
                    setTimeout(() => window.close(), 1500);
                }}
            }} catch(e) {{}}
            setTimeout(() => {{ if (!window.opener) window.location.href = '/'; }}, 2500);
        </script>
    </body>
    </html>
    """
    response = HTMLResponse(content=html_content)

    # Inyección de Cookie de Sesión Blindada
    response.set_cookie(
        key="fam_session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 3600
    )
    # Limpiar cookie CSRF temporal
    response.delete_cookie("fam_csrf_state")
    return response

@app.get("/auth/me")
async def get_current_user_profile(user: Dict[str, Any] = Depends(require_auth)):
    """Devuelve los datos del efectivo conectado."""
    return {"authenticated": True, "user": user}

@app.post("/auth/logout")
async def logout(response: Response):
    """Cierra la sesión destruyendo las cookies HttpOnly."""
    response.delete_cookie("fam_session")
    response.delete_cookie("fam_csrf_state")
    return {"success": True, "message": "Sesión militar cerrada exitosamente."}

# ==============================================================================
# RUTAS DE DIPLOMAS (CONSULTA GENERAL Y EXPEDICIÓN PRIVADA)
# ==============================================================================

@app.get("/diplomas/verify/{code}")
async def verify_diploma(code: str, request: Request):
    """
    Módulo de Consulta: Verifica la autenticidad militar de cualquier folio.
    Accesible tanto para usuarios autenticados como para validadores externos.
    """
    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(f"verify:{client_ip}", max_requests=30, window_seconds=60):
        raise HTTPException(status_code=429, detail="Demasiadas consultas de verificación. Espera un momento.")

    clean_code = sanitize_text(code).upper()
    diploma = database.get_diploma_by_id(clean_code)

    if not diploma:
        return JSONResponse(
            status_code=404,
            content={"success": False, "found": False, "message": "Folio militar no registrado o inválido."}
        )

    return {"success": True, "found": True, "diploma": diploma}

@app.get("/diplomas/list")
async def list_diplomas(limit: int = 50, user: Dict[str, Any] = Depends(require_auth)):
    """Lista los diplomas registrados. Exige autenticación obligatoria."""
    diplomas = database.list_all_diplomas(limit=min(limit, 100))
    return {"success": True, "count": len(diplomas), "diplomas": diplomas}

@app.post("/diplomas/expedite")
async def expedite_diploma(
    payload: DiplomaExpediteSchema,
    user: Dict[str, Any] = Depends(require_instructor)
):
    """
    Módulo Privado: Expedición Oficial de Diplomas.
    Estrictamente protegido por el middleware require_instructor (Retorna HTTP 403 si no es instructor).
    """
    # 1. Registrar en la base de datos unificada
    diploma = database.create_diploma(
        cadet_roblox=payload.cadet_roblox,
        course=payload.course,
        instructor_name=user.get("username", "Oficial Instructor").split("#")[0],
        instructor_discord_id=user["id"],
        rank=payload.rank,
        notes=payload.notes,
        cadet_discord_id=payload.cadet_discord_id or "000000000000000000",
        cadet_discord_tag=payload.cadet_discord_tag or f"{payload.cadet_roblox}#0000",
        instructor_discord_tag=user.get("username", "Instructor#0000"),
        base_location=payload.base_location,
        guild_id=payload.guild_id or FAM_GUILD_ID
    )

    # 2. Notificación vía Webhook (si el servidor tiene canal configurado)
    guild_conf = database.get_guild_config(payload.guild_id or FAM_GUILD_ID)
    webhook_url = guild_conf.get("native_webhook_url") or os.getenv("DISCORD_WEBHOOK_URL")

    if webhook_url:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(webhook_url, json={
                    "embeds": [{
                        "title": "📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA",
                        "description": f"Se ha otorgado el certificado oficial con folio **`{diploma['id']}`**.",
                        "color": int(guild_conf.get("embed_color_hex", "#1E3A1E").replace("#", ""), 16),
                        "fields": [
                            {"name": "Cadete Roblox", "value": diploma["cadet_roblox"], "inline": True},
                            {"name": "Rango Militar", "value": diploma["rank"], "inline": True},
                            {"name": "Curso Acreditado", "value": diploma["course"], "inline": False},
                            {"name": "Instructor", "value": user["username"], "inline": False},
                            {"name": "Verificación", "value": f"`/diploma verificar {diploma['id']}`", "inline": False}
                        ],
                        "footer": {"text": "Fuerza Aérea Mexicana • Certificación Criptográfica OAuth2"}
                    }]
                })
        except Exception:
            pass

    return {
        "success": True,
        "status": "SUCCESS",
        "message": f"Diploma {diploma['id']} expedido y firmado digitalmente.",
        "diploma": diploma
    }

# ==============================================================================
# RUTAS DE ADMINISTRACIÓN MULTI-SERVIDOR
# ==============================================================================

@app.get("/api/guilds")
async def list_guilds(user: Dict[str, Any] = Depends(require_instructor)):
    """Devuelve la lista de servidores y sus configuraciones."""
    configs = database.list_all_guild_configs()
    return {"success": True, "count": len(configs), "guilds": configs}

@app.post("/api/guilds/config")
async def update_guild_config(
    payload: GuildConfigUpdateSchema,
    user: Dict[str, Any] = Depends(require_instructor)
):
    """Actualiza la configuración específica de un servidor (canal de registros, roles)."""
    updated = database.save_guild_config(
        guild_id=payload.guild_id,
        guild_name=payload.guild_name,
        official_log_channel_id=payload.official_log_channel_id,
        instructor_role_id=payload.instructor_role_id,
        embed_color_hex=payload.embed_color_hex or "#1E3A1E",
        prefix=payload.prefix or "!"
    )
    return {"success": True, "message": "Configuración del servidor guardada exitosamente.", "config": updated}

# ==============================================================================
# RUTAS LEGALES PÚBLICAS (DISCORD DEVELOPER PORTAL: TERMS & PRIVACY)
# ==============================================================================

def get_legal_html_template(title: str, subtitle: str, badge: str, content_html: str, other_page_url: str, other_page_label: str) -> str:
    """Genera una página HTML militar profesional, responsive y compatible con Discord Developer Portal."""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} — Fuerza Aérea Mexicana (FAM)</title>
    <meta name="description" content="{subtitle}">
    <link rel="icon" href="https://raw.githubusercontent.com/FAM-Roblox/assets/main/fam_emblem.png" type="image/png">
    <style>
        :root {{
            --bg-main: #050811;
            --bg-card: #0c1322;
            --bg-subtle: #111a2e;
            --border: #1e293b;
            --border-accent: #059669;
            --text-main: #f1f5f9;
            --text-muted: #94a3b8;
            --emerald: #10b981;
            --emerald-light: #34d399;
            --emerald-glow: rgba(16, 185, 129, 0.15);
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            background-color: var(--bg-main);
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.65;
            padding: 32px 16px;
            display: flex;
            justify-content: center;
        }}
        .container {{
            width: 100%;
            max-width: 820px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 18px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(16, 185, 129, 0.1);
            overflow: hidden;
        }}
        .header {{
            background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(12, 19, 34, 0.95) 100%);
            border-bottom: 1px solid var(--border);
            padding: 32px 28px 24px;
            position: relative;
        }}
        .header-top {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
        }}
        .brand {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}
        .brand-icon {{
            width: 44px;
            height: 44px;
            border-radius: 10px;
            background: #022c22;
            border: 1px solid var(--emerald);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 12px var(--emerald-glow);
        }}
        .brand-text h1 {{
            font-size: 1.15rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            color: #ffffff;
            text-transform: uppercase;
        }}
        .brand-text span {{
            font-size: 0.72rem;
            color: var(--emerald-light);
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }}
        .badge {{
            display: inline-block;
            background: rgba(16, 185, 129, 0.15);
            color: var(--emerald-light);
            border: 1px solid rgba(16, 185, 129, 0.35);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }}
        .title-block {{
            margin-top: 10px;
        }}
        .title-block h2 {{
            font-size: 1.7rem;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 6px;
        }}
        .title-block p {{
            font-size: 0.92rem;
            color: var(--text-muted);
        }}
        .meta-strip {{
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            display: flex;
            gap: 20px;
            font-size: 0.78rem;
            color: #64748b;
            flex-wrap: wrap;
        }}
        .meta-strip span strong {{
            color: #cbd5e1;
        }}
        .content {{
            padding: 32px 28px;
        }}
        .section {{
            margin-bottom: 28px;
        }}
        .section-title {{
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.12rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 10px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }}
        .section p, .section li {{
            color: #cbd5e1;
            font-size: 0.92rem;
            margin-bottom: 10px;
        }}
        .section ul {{
            padding-left: 20px;
            margin-bottom: 12px;
        }}
        .section li {{
            margin-bottom: 6px;
        }}
        .callout {{
            background: var(--bg-subtle);
            border-left: 4px solid var(--emerald);
            padding: 14px 18px;
            border-radius: 0 8px 8px 0;
            margin: 16px 0;
            font-size: 0.88rem;
            color: #e2e8f0;
        }}
        .callout-alert {{
            border-left-color: #38bdf8;
            background: rgba(56, 189, 248, 0.08);
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin: 14px 0;
            font-size: 0.85rem;
        }}
        .table th, .table td {{
            padding: 10px 14px;
            text-align: left;
            border: 1px solid var(--border);
        }}
        .table th {{
            background: var(--bg-subtle);
            color: #f8fafc;
            font-weight: 600;
        }}
        .table td {{
            color: #cbd5e1;
        }}
        .actions {{
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 30px;
            padding-top: 24px;
            border-top: 1px solid var(--border);
        }}
        .btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s ease;
        }}
        .btn-primary {{
            background: var(--emerald);
            color: #022c22;
        }}
        .btn-primary:hover {{
            background: var(--emerald-light);
        }}
        .btn-secondary {{
            background: var(--bg-subtle);
            color: #e2e8f0;
            border: 1px solid var(--border);
        }}
        .btn-secondary:hover {{
            border-color: #475569;
            background: #17223b;
        }}
        .footer {{
            background: #080d18;
            border-top: 1px solid var(--border);
            padding: 20px 28px;
            text-align: center;
            font-size: 0.78rem;
            color: #64748b;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="header-top">
                <div class="brand">
                    <div class="brand-icon">✈️</div>
                    <div class="brand-text">
                        <h1>Fuerza Aérea Mexicana</h1>
                        <span>Sistema Militar Roblox Ro-Army</span>
                    </div>
                </div>
                <div class="badge">{badge}</div>
            </div>
            <div class="title-block">
                <h2>{title}</h2>
                <p>{subtitle}</p>
            </div>
            <div class="meta-strip">
                <span>Última Actualización: <strong>28 de Octubre, 2026</strong></span>
                <span>Versión: <strong>2.0.0 DevSecOps</strong></span>
                <span>Jurisdicción: <strong>Discord Platform & Roblox Community</strong></span>
            </div>
        </header>

        <main class="content">
            {content_html}

            <div class="actions">
                <a href="/" class="btn btn-primary">← Volver al Portal FAM</a>
                <a href="{other_page_url}" class="btn btn-secondary">{other_page_label}</a>
                <a href="?format=json" class="btn btn-secondary">⚡ Formato JSON (API)</a>
            </div>
        </main>

        <footer class="footer">
            <p><strong>Aviso de Roleplay Militar:</strong> Este bot y portal son herramientas comunitarias privadas creadas exclusivamente para la simulación militar en Roblox (Fuerza Aérea Mexicana Ro-Army). No existe vínculo oficial o político con la Secretaría de la Defensa Nacional real.</p>
        </footer>
    </div>
</body>
</html>"""

@app.get("/terms", response_class=HTMLResponse)
async def terms_of_service(request: Request, format: Optional[str] = None):
    """
    Ruta Pública: Términos de Servicio requeridos por Discord Developer Portal.
    Soporta HTML responsive y formato estructurado JSON.
    """
    accept_header = request.headers.get("accept", "")
    if format == "json" or "application/json" in accept_header:
        return JSONResponse(content={
            "app_name": "Fuerza Aérea Mexicana — Bot de Discord y Portal Militar",
            "document": "Terms of Service / Términos de Uso",
            "last_updated": "2026-10-28",
            "version": "2.0.0",
            "platform": "Roblox Ro-Army & Discord",
            "sections": [
                {
                    "title": "1. Naturaleza del Sistema y Ámbito de Aplicación",
                    "content": "Este bot de Discord y el sistema web asociado son herramientas recreativas y administrativas privadas desarrolladas para la comunidad de simulación y roleplay militar de la Fuerza Aérea Mexicana (FAM) en la plataforma Roblox. El servicio no guarda ninguna relación institucional, política ni jurídica con la Secretaría de la Defensa Nacional (SEDENA) o el Gobierno de México."
                },
                {
                    "title": "2. Normas de Uso Responsable y Seguridad",
                    "content": "Los usuarios deben emplear el bot de manera ética. Queda prohibido el abuso o spam de comandos, la generación deliberada de errores mediante payloads maliciosos, la alteración o falsificación de folios de diplomas, y el intento de vulnerar los mecanismos de autenticación OAuth2 y cookies de sesión."
                },
                {
                    "title": "3. Privilegios de Instructores y Oficiales",
                    "content": "Las funciones avanzadas de expedición de certificados, gestión de servidores y envíos de anuncios institucionales (/embed enviar) están reservadas para usuarios que acrediten el rol militar correspondiente mediante la integración con Discord OAuth2."
                },
                {
                    "title": "4. Validez y Revocación de Diplomas",
                    "content": "Los diplomas emitidos generan un identificador criptográfico único (ej. FAM-XXXX). La Comandancia de la FAM se reserva el derecho de anular o revocar cualquier folio en caso de expulsión militar comunitaria o conducta antideportiva."
                },
                {
                    "title": "5. Disponibilidad y Limitación de Responsabilidad",
                    "content": "El sistema se proporciona 'tal cual' bajo estándares DevSecOps. La administración no se responsabiliza por interrupciones ocasionadas por fallas en la API de Discord o los servidores de Roblox."
                }
            ],
            "contact": "Comandancia General FAM Roblox Ro-Army (Discord Server Oficial)"
        })

    terms_content = """
    <article>
        <section class="section">
            <h3 class="section-title">1. Naturaleza Recreativa y Simulación Militar</h3>
            <p>Bienvenido al sistema automatizado de la <strong>Fuerza Aérea Mexicana (FAM) en Roblox</strong>. El presente servicio comprende tanto el bot oficial de Discord (<code>FAM Bot</code>) como la plataforma web de gestión y consulta militar.</p>
            <div class="callout">
                <strong>Cláusula de Deslinde Oficial:</strong> Esta aplicación es una iniciativa comunitaria de Roleplay Militar (Ro-Army) dentro de la plataforma virtual Roblox. No representa, reemplaza ni está afiliada formalmente con las Fuerzas Armadas reales de México ni con la Secretaría de la Defensa Nacional (SEDENA).
            </div>
        </section>

        <section class="section">
            <h3 class="section-title">2. Normas de Conducta y Uso Aceptable</h3>
            <p>Al interactuar con los comandos de barra de Discord (<code>/diploma</code>, <code>/embed</code>, <code>/servidor</code>) o con el portal web, los usuarios se comprometen a:</p>
            <ul>
                <li><strong>No abusar de los comandos:</strong> Queda terminantemente prohibido el envío masivo (spam), la saturación de webhooks o la denegación de servicio intencional.</li>
                <li><strong>Veracidad en la expedición:</strong> Los instructores autorizados deben expedir certificados correspondientes a cursos reales acreditados por cadetes dentro del grupo de Roblox.</li>
                <li><strong>Prohibición de falsificación:</strong> Intentar alterar identificadores criptográficos o adjudicarse títulos militares sin autorización conllevará el veto permanente.</li>
                <li><strong>Cumplimiento de Términos Externos:</strong> Respetar íntegramente las Directrices de la Comunidad de Discord y los Términos de Servicio de Roblox.</li>
            </ul>
        </section>

        <section class="section">
            <h3 class="section-title">3. Verificación de Rangos y Permisos (OAuth2)</h3>
            <p>Para acceder a la consola de instructores y a las funciones de firma de diplomas, el sistema implementa una doble comprobación:</p>
            <ul>
                <li>Pertenencia verificada al servidor oficial de Discord de la FAM (<code>FAM_GUILD_ID</code>).</li>
                <li>Posesión del rol militar autorizado de Instructor u Oficial (<code>INSTRUCTOR_ROLE_ID</code>).</li>
            </ul>
            <p>Cualquier intento de evasión de permisos o inyección de parámetros será bloqueado y registrado en la bitácora de auditoría de seguridad militar.</p>
        </section>

        <section class="section">
            <h3 class="section-title">4. Derechos de la Comandancia y Revocación</h3>
            <p>El Estado Mayor y los Administradores de la FAM se reservan la facultad de:</p>
            <ul>
                <li>Revocar o declarar nulo cualquier folio de diploma emitido erróneamente o bajo falsas declaraciones.</li>
                <li>Suspender temporal o definitivamente el acceso al bot y a la plataforma web a usuarios que contravengan estas normas.</li>
                <li>Actualizar estos términos para adaptarlos a requerimientos de seguridad de Discord o Roblox.</li>
            </ul>
        </section>
    </article>
    """

    return HTMLResponse(content=get_legal_html_template(
        title="Términos de Servicio",
        subtitle="Condiciones generales de uso para el Bot de Discord y Portal Militar FAM Ro-Army.",
        badge="Legal • Términos Oficiales",
        content_html=terms_content,
        other_page_url="/privacy",
        other_page_label="Ver Política de Privacidad →"
    ))

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_policy(request: Request, format: Optional[str] = None):
    """
    Ruta Pública: Política de Privacidad requerida por Discord Developer Portal.
    Soporta HTML responsive y formato estructurado JSON.
    """
    accept_header = request.headers.get("accept", "")
    if format == "json" or "application/json" in accept_header:
        return JSONResponse(content={
            "app_name": "Fuerza Aérea Mexicana — Bot de Discord y Portal Militar",
            "document": "Privacy Policy / Política de Privacidad",
            "last_updated": "2026-10-28",
            "version": "2.0.0",
            "principles": [
                "Minimización de datos (Privacy by Design)",
                "Cero comercialización o venta de datos",
                "Almacenamiento seguro con cifrado JWT y cookies HttpOnly"
            ],
            "data_collected": [
                {
                    "source": "Discord OAuth2",
                    "fields": ["user_id", "username", "discriminator", "avatar_hash", "guild_roles"],
                    "purpose": "Verificar identidad del instructor y validar permisos de expedición."
                },
                {
                    "source": "Expedición de Diplomas",
                    "fields": ["cadet_roblox_username", "rank", "course_name", "date", "notes"],
                    "purpose": "Generar folios criptográficos y habilitar la consulta pública de acreditación militar."
                }
            ],
            "data_sharing": "No compartimos, vendemos ni transferimos información a terceros ni plataformas publicitarias.",
            "data_retention": "Las cookies de sesión caducan automáticamente a los 7 días o inmediatamente al invocar /auth/logout.",
            "contact": "Oficialía de Seguridad y Ciberdefensa FAM Roblox (Discord Oficial)"
        })

    privacy_content = """
    <article>
        <section class="section">
            <h3 class="section-title">1. Compromiso con la Privacidad y Principio de Minimización</h3>
            <p>La <strong>Fuerza Aérea Mexicana (FAM Ro-Army)</strong> respeta plenamente la privacidad de sus efectivos y miembros de la comunidad. Esta política detalla de forma transparente la información que recopilamos, cómo se utiliza y las medidas de seguridad adoptadas bajo el principio de minimización de datos (solo recopilamos lo estrictamente necesario para operar).</p>
            <div class="callout callout-alert">
                <strong>Garantía Absoluta:</strong> No recopilamos contraseñas, correos electrónicos personales, direcciones IP permanentes ni datos de pago. Nunca comercializamos, alquilamos ni cedemos información a terceros.
            </div>
        </section>

        <section class="section">
            <h3 class="section-title">2. Datos Recopilados y Finalidades Específicas</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Datos Tratados</th>
                        <th>Finalidad Operativa</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Identidad Discord (OAuth2)</strong></td>
                        <td>ID de Usuario de Discord, Nombre de usuario y Avatar.</td>
                        <td>Autenticar al instructor y atribuir la autoría oficial en los diplomas expedidos.</td>
                    </tr>
                    <tr>
                        <td><strong>Membresía Militar</strong></td>
                        <td>Identificador de Servidor y Roles en Discord.</td>
                        <td>Comprobar en tiempo real que el usuario tiene el rango de Instructor Oficial de la FAM.</td>
                    </tr>
                    <tr>
                        <td><strong>Registro de Diplomas</strong></td>
                        <td>Nombre de usuario de Roblox del cadete, curso acreditado y rango.</td>
                        <td>Generar y almacenar el certificado militar para consulta pública mediante folios (<code>FAM-XXXX</code>).</td>
                    </tr>
                </tbody>
            </table>
        </section>

        <section class="section">
            <h3 class="section-title">3. Seguridad Técnica y DevSecOps</h3>
            <p>Implementamos salvaguardas técnicas robustas para proteger la información contra accesos no autorizados:</p>
            <ul>
                <li><strong>Cookies Blindadas:</strong> Las sesiones utilizan cookies marcadas obligatoriamente como <code>HttpOnly</code>, <code>Secure</code> y <code>SameSite=Lax</code> para prevenir ataques XSS y robo de credenciales.</li>
                <li><strong>Cifrado de Tokens:</strong> Las credenciales de sesión se firman digitalmente mediante tokens JWT con algoritmo criptográfico HMAC-SHA256.</li>
                <li><strong>Sanitización Estricta:</strong> Todas las entradas en formularios y comandos de Discord son filtradas mediante esquemas Pydantic para neutralizar inyecciones de código.</li>
            </ul>
        </section>

        <section class="section">
            <h3 class="section-title">4. Retención y Control de Datos</h3>
            <p>El usuario posee el control total sobre su interacción con el sistema:</p>
            <ul>
                <li><strong>Cierre de Sesión:</strong> Puede cerrar su sesión en cualquier momento mediante la ruta <code>/auth/logout</code>, lo que destruye de forma instantánea las cookies de autenticación de su navegador.</li>
                <li><strong>Eliminación de Folios:</strong> Los cadetes pueden solicitar la rectificación o baja de un registro militar en caso de error justificable a través del canal oficial de soporte en Discord.</li>
            </ul>
        </section>
    </article>
    """

    return HTMLResponse(content=get_legal_html_template(
        title="Política de Privacidad",
        subtitle="Tratamiento seguro de datos de Discord y registros militares para la FAM Ro-Army.",
        badge="Legal • Privacidad DevSecOps",
        content_html=privacy_content,
        other_page_url="/terms",
        other_page_label="Ver Términos de Servicio →"
    ))

