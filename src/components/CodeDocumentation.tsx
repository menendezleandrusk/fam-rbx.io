import React, { useState } from 'react';
import { FileCode2, Copy, Check, Server, Key, Database, Bot, Terminal, ShieldCheck } from 'lucide-react';

export const CodeDocumentation: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'database' | 'auth' | 'main' | 'bot' | 'guild_config'>('database');
  const [copiedCode, setCopiedCode] = useState(false);

  const databasePy = `# ==============================================================================
# database.py — Capa de Persistencia Segura y Parametrizada (FAM)
# ==============================================================================
import sqlite3
import secrets
import datetime
from typing import Optional, Dict, Any, List

DB_PATH = "fam_diplomas.db"

def get_connection() -> sqlite3.Connection:
    """Crea una conexión con row_factory para obtener diccionarios seguros."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa el esquema de base de datos con índices de búsqueda rápida."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diplomas_fam (
                id TEXT PRIMARY KEY,               -- Formato: FAM-8F42 o FAM-CERT-2026-XXXX
                cadet_roblox TEXT NOT NULL,       -- Usuario de Roblox sanitizado
                cadet_discord_id TEXT,            -- ID de Discord del Cadete
                cadet_discord_tag TEXT,           -- Tag de Discord
                rank TEXT NOT NULL,               -- Rango militar concedido
                course TEXT NOT NULL,             -- Curso oficial de la FAM
                notes TEXT,                       -- Observaciones y méritos
                instructor_name TEXT NOT NULL,    -- Nombre del instructor expedidor
                instructor_discord_id TEXT NOT NULL,
                issue_date TEXT NOT NULL,         -- Fecha ISO (YYYY-MM-DD)
                status TEXT DEFAULT 'VALIDO',     -- VALIDO o REVOCADO
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diplomas_id ON diplomas_fam(id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diplomas_cadet ON diplomas_fam(cadet_roblox);")
        conn.commit()

def generate_unique_code() -> str:
    """Genera un folio criptográficamente seguro y corto (ej. FAM-8F42)."""
    random_hex = secrets.token_hex(2).upper()
    return f"FAM-{random_hex}"

def create_diploma(
    cadet_roblox: str,
    course: str,
    instructor_name: str,
    instructor_discord_id: str,
    rank: str = "Subteniente C.P.A.",
    notes: str = "Aprobación satisfactoria del adiestramiento militar.",
    cadet_discord_id: Optional[str] = None,
    cadet_discord_tag: Optional[str] = None
) -> Dict[str, Any]:
    """Inserta un nuevo diploma utilizando consultas parametrizadas contra inyecciones SQL."""
    diploma_id = generate_unique_code()
    issue_date = datetime.date.today().isoformat()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO diplomas_fam (
                id, cadet_roblox, cadet_discord_id, cadet_discord_tag,
                rank, course, notes, instructor_name, instructor_discord_id,
                issue_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDO')
        """, (
            diploma_id, cadet_roblox, cadet_discord_id or "N/A", cadet_discord_tag or "N/A",
            rank, course, notes, instructor_name, instructor_discord_id, issue_date
        ))
        conn.commit()

    return get_diploma_by_id(diploma_id)

def get_diploma_by_id(diploma_id: str) -> Optional[Dict[str, Any]]:
    """Consulta segura de diploma por código único."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diplomas_fam WHERE UPPER(id) = UPPER(?)", (diploma_id.strip(),))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

def list_all_diplomas(limit: int = 50) -> List[Dict[str, Any]]:
    """Lista los diplomas más recientes."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diplomas_fam ORDER BY created_at DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]

# Auto-inicializar tablas al importar
init_db()
`;

  const authPy = `# ==============================================================================
# auth.py — Autenticación Discord OAuth2, Sesión JWT y Middlewares de Seguridad
# ==============================================================================
import os
import secrets
import datetime
from typing import Optional, Dict, Any, List
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import RedirectResponse

# CONFIGURACIÓN (Variables de entorno)
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "1539391208411889676")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")

# REDIRECT_URI Dinámica (Evita error 'Invalid OAuth2 redirect_uri')
# Prioridad: DISCORD_REDIRECT_URI -> REDIRECT_URI -> construida con APP_URL
_app_url = os.getenv("APP_URL", "").rstrip("/")
REDIRECT_URI = (
    os.getenv("DISCORD_REDIRECT_URI")
    or os.getenv("REDIRECT_URI")
    or (f"{_app_url}/auth/callback" if _app_url else "https://ais-pre-tdidzq3x6qh7ek5k775onk-824715890255.us-east1.run.app/auth/callback")
).strip()

FAM_GUILD_ID = os.getenv("FAM_GUILD_ID", "")        # Servidor FAM
INSTRUCTOR_ROLE_ID = os.getenv("INSTRUCTOR_ROLE_ID", "")  # Rol Instructor Militar

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fam_super_secure_jwt_secret_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

def create_access_token(data: Dict[str, Any]) -> str:
    """Firma un token JWT con tiempo de expiración definido."""
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodifica y valida la firma del token JWT."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

async def exchange_code_for_token(code: str) -> Optional[str]:
    """Intercambia el código de OAuth2 por un token de acceso de Discord."""
    async with httpx.AsyncClient() as client:
        payload = {
            "client_id": DISCORD_CLIENT_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        res = await client.post("https://discord.com/api/oauth2/token", data=payload, headers=headers)
        if res.status_code == 200:
            return res.json().get("access_token")
        return None

async def verify_fam_discord_user(access_token: str) -> Dict[str, Any]:
    """
    Doble Validación Estricta:
    1. Verifica perfil en Discord (/users/@me)
    2. Comprueba pertenencia al servidor FAM y posesión del INSTRUCTOR_ROLE_ID
    """
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 1. Obtener datos básicos de usuario
        user_res = await client.get("https://discord.com/api/users/@me", headers=headers)
        if user_res.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Discord no válido.")
        user_data = user_res.json()

        # 2. Consultar membresía en el servidor FAM
        member_url = f"https://discord.com/api/users/@me/guilds/{FAM_GUILD_ID}/member"
        member_res = await client.get(member_url, headers=headers)
        
        is_guild_member = member_res.status_code == 200
        is_instructor = False
        roles: List[str] = []

        if is_guild_member:
            member_data = member_res.json()
            roles = member_data.get("roles", [])
            # Verificación estricta del rol de Instructor
            is_instructor = INSTRUCTOR_ROLE_ID in roles
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso Denegado: Debes ser miembro del servidor de Discord de la Fuerza Aérea Mexicana."
            )

        return {
            "id": user_data["id"],
            "username": f"{user_data['username']}#{user_data.get('discriminator', '0')}",
            "avatar": user_data.get("avatar"),
            "is_instructor": is_instructor,
            "guild_member": is_guild_member,
            "roles": roles,
        }

# ==============================================================================
# DEPENDENCIAS Y MIDDLEWARES DE SEGURIDAD (FastAPI)
# ==============================================================================

async def require_auth(request: Request) -> Dict[str, Any]:
    """Dependencia: Exige token JWT válido en Cookie HttpOnly o Bearer."""
    token = request.cookies.get("fam_session")
    if not token and "Authorization" in request.headers:
        token = request.headers["Authorization"].replace("Bearer ", "")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación Obligatoria: Inicia sesión con Discord OAuth2."
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión expirada o token inválido.")
    return payload

async def require_instructor(user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    """Dependencia: Bloquea con HTTP 403 Forbidden si el usuario no es Instructor."""
    if not user.get("is_instructor", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso Denegado (HTTP 403): Tu rango militar no posee permisos de Oficial Instructor."
        )
    return user
`;

  const mainPy = `# ==============================================================================
# main.py — Servidor Web FastAPI con Blindaje DevSecOps (OWASP Top 10)
# ==============================================================================
import os
import secrets
import re
import html
from typing import Optional
import httpx
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from database import create_diploma, get_diploma_by_id, list_all_diplomas
from auth import (
    DISCORD_CLIENT_ID, REDIRECT_URI,
    create_access_token, exchange_code_for_token,
    verify_fam_discord_user, require_auth, require_instructor
)

app = FastAPI(
    title="Fuerza Aérea Mexicana — Sistema Oficial de Diplomas",
    description="Portal Web DevSecOps integrado con Discord OAuth2 y Bot de Discord.",
    version="2.0.0"
)

DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")

# ------------------------------------------------------------------------------
# ESQUEMAS PYDANTIC CON SANITIZACIÓN ANTI-XSS & ANTI-INJECTION
# ------------------------------------------------------------------------------
class ExpediteDiplomaSchema(BaseModel):
    cadet_roblox: str = Field(..., min_length=3, max_length=20, description="Nombre en Roblox")
    course: str = Field(..., min_length=5, max_length=150, description="Curso militar FAM")
    rank: Optional[str] = Field("Subteniente C.P.A.", max_length=60)
    notes: Optional[str] = Field("Aprobación satisfactoria de vuelo militar.", max_length=300)
    cadet_discord_id: Optional[str] = Field(None, max_length=30)
    cadet_discord_tag: Optional[str] = Field(None, max_length=50)

    @validator("cadet_roblox")
    def validate_roblox_username(cls, v: str) -> str:
        """Valida que el usuario cumpla la sintaxis de Roblox sin caracteres maliciosos."""
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_]{3,20}$", v):
            raise ValueError("El nombre de Roblox sólo puede contener letras, números y guión bajo.")
        return html.escape(v)

    @validator("course", "notes")
    def sanitize_text(cls, v: Optional[str]) -> Optional[str]:
        """Sanitiza campos de texto para evitar XSS (HTML escaping)."""
        if v:
            return html.escape(v.strip())
        return v

# ------------------------------------------------------------------------------
# RUTAS DE AUTENTICACIÓN (CON PROTECCIÓN ANTI-CSRF STATE)
# ------------------------------------------------------------------------------

@app.get("/auth/login")
def login_discord(response: Response):
    """Genera URL OAuth2 con parámetro criptográfico state para mitigar CSRF."""
    csrf_state = secrets.token_hex(32)
    
    # Guardar state en cookie HttpOnly temporal
    response = RedirectResponse(
        url=f"https://discord.com/api/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify%20guilds.members.read&state={csrf_state}"
    )
    response.set_cookie(
        key="fam_csrf_state",
        value=csrf_state,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=600 # 10 minutos
    )
    return response

@app.get("/auth/callback")
async def auth_callback(request: Request, code: Optional[str] = None, state: Optional[str] = None):
    """Callback seguro: verifica token CSRF, valida roles en la FAM y firma cookie JWT."""
    cookie_state = request.cookies.get("fam_csrf_state")
    
    # 1. Validación Anti-CSRF
    if not state or not cookie_state or state != cookie_state:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Error de Seguridad (CSRF): El parámetro de estado no es válido o ha expirado."
        )

    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código de autorización ausente.")

    # 2. Intercambio de código por token
    access_token = await exchange_code_for_token(code)
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo obtener el token de Discord.")

    # 3. Doble validación en Discord (Membresía + Rol Instructor)
    user_info = await verify_fam_discord_user(access_token)

    # 4. Crear JWT de sesión
    token_jwt = create_access_token(user_info)

    # 5. Inyectar Cookie segura y redirigir
    response = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    response.set_cookie(
        key="fam_session",
        value=token_jwt,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=86400 # 24 horas
    )
    response.delete_cookie("fam_csrf_state")
    return response

@app.post("/auth/logout")
def logout(response: Response):
    """Cierra la sesión destruyendo las cookies HttpOnly."""
    response = JSONResponse({"success": True, "message": "Sesión cerrada correctamente."})
    response.delete_cookie("fam_session")
    return response

# ------------------------------------------------------------------------------
# 1. CONSULTA MILITAR Y VERIFICACIÓN (USUARIOS AUTENTICADOS - SIN MODO INVITADO)
# ------------------------------------------------------------------------------

@app.get("/api/auth/me")
def get_current_user_profile(user: dict = Depends(require_auth)):
    """Retorna el perfil del usuario conectado (Avatar, Username, Roles)."""
    return {"authenticated": True, "user": user}

@app.get("/api/diplomas/verify/{diploma_id}")
def verify_diploma_public(diploma_id: str, user: dict = Depends(require_auth)):
    """Buscador y validador de diplomas oficial para cualquier usuario autenticado."""
    diploma = get_diploma_by_id(diploma_id)
    if not diploma:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Código de diploma no encontrado en el Registro Militar Oficial de la FAM."
        )
    return {"found": True, "diploma": diploma}

# ------------------------------------------------------------------------------
# 2. VISTA PRIVADA / PANEL DE EXPEDICIÓN (EXCLUSIVO INSTRUCTORES 403 GUARD)
# ------------------------------------------------------------------------------

@app.post("/api/diplomas/expedite", status_code=status.HTTP_201_CREATED)
async def expedite_diploma_route(
    data: ExpediteDiplomaSchema,
    instructor: dict = Depends(require_instructor)
):
    """
    Expedición protegida:
    - Exige rol de instructor validado por middleware require_instructor (HTTP 403 si falla).
    - Inserta en SQLite parametrizada.
    - Envía alerta por Webhook a Discord.
    """
    # Guardar en base de datos compartida
    new_diploma = create_diploma(
        cadet_roblox=data.cadet_roblox,
        course=data.course,
        instructor_name=instructor["username"],
        instructor_discord_id=instructor["id"],
        rank=data.rank or "Subteniente C.P.A.",
        notes=data.notes or "Aprobación satisfactoria.",
        cadet_discord_id=data.cadet_discord_id,
        cadet_discord_tag=data.cadet_discord_tag
    )

    # Disparar Webhook a Discord si está configurado
    if DISCORD_WEBHOOK_URL:
        async with httpx.AsyncClient() as client:
            try:
                await client.post(DISCORD_WEBHOOK_URL, json={
                    "embeds": [{
                        "title": "📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA",
                        "description": f"Se ha emitido el certificado oficial militar con folio **\`{new_diploma['id']}\`**.",
                        "color": 0x1E3A1E, # Verde Olivo FAM
                        "fields": [
                            {"name": "Cadete", "value": new_diploma["cadet_roblox"], "inline": True},
                            {"name": "Rango", "value": new_diploma["rank"], "inline": True},
                            {"name": "Curso", "value": new_diploma["course"], "inline": False},
                            {"name": "Oficial Instructor", "value": instructor["username"], "inline": False},
                        ],
                        "footer": {"text": "Sistema Oficial FAM Roblox • DevSecOps"}
                    }]
                })
            except Exception as e:
                # Loguear internamente sin filtrar excepciones al usuario
                print(f"[Webhook Error]: {e}")

    return {
        "success": True,
        "message": "Diploma expedido y registrado con éxito.",
        "diploma": new_diploma
    }

# ==============================================================================
# RUTAS LEGALES PÚBLICAS (DISCORD DEVELOPER PORTAL: TERMS & PRIVACY)
# ==============================================================================

@app.get("/terms", response_class=HTMLResponse)
async def terms_of_service(request: Request, format: Optional[str] = None):
    """Ruta Pública: Términos de Servicio requeridos por Discord Developer Portal."""
    if format == "json" or "application/json" in request.headers.get("accept", ""):
        return JSONResponse(content={
            "app_name": "Fuerza Aérea Mexicana — Bot & Portal Militar",
            "document": "Terms of Service",
            "scope": "Herramienta comunitaria de roleplay militar privado en Roblox (FAM Ro-Army)."
        })
    return HTMLResponse(content="<h1>Términos de Servicio — FAM Ro-Army</h1><p>Uso responsable para roleplay militar privado en Roblox.</p>")

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_policy(request: Request, format: Optional[str] = None):
    """Ruta Pública: Política de Privacidad requerida por Discord Developer Portal."""
    if format == "json" or "application/json" in request.headers.get("accept", ""):
        return JSONResponse(content={
            "app_name": "Fuerza Aérea Mexicana — Bot & Portal Militar",
            "document": "Privacy Policy",
            "data_collected": ["Discord ID", "Username", "Roles para validación de instructor"],
            "sharing": "Cero comercialización o cesión a terceros."
        })
    return HTMLResponse(content="<h1>Política de Privacidad — FAM Ro-Army</h1><p>Solo recopilamos tu ID y roles de Discord para validar permisos de instructor.</p>")
`;

  const botPy = `# ==============================================================================
# bot.py — Bot de Discord Todo en Uno para la Fuerza Aérea Mexicana (FAM)
# Framework: discord.py v2.x + app_commands (Slash Commands)
# Características: Webhooks Nativos Autogestionados, Multi-Servidor y Diplomas
# ==============================================================================

import os
import datetime
from typing import Optional, List
import discord
from discord import app_commands
from discord.ext import commands

import database

DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")
FAM_EMBLEM_URL = "https://raw.githubusercontent.com/FAM-Roblox/assets/main/fam_emblem.png"
DEFAULT_EMBED_COLOR = 0x1E3A1E  # Verde Olivo Militar Institucional

intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.message_content = True

class FAMBot(commands.Bot):
    def __init__(self):
        super().__init__(command_prefix="!", intents=intents)

    async def setup_hook(self):
        """Sincroniza los comandos de barra (Slash Commands) de forma global al iniciar."""
        print("[FAM Bot] Sincronizando comandos de barra (/)...")
        await self.tree.sync()
        print("[FAM Bot] Comandos sincronizados exitosamente.")

bot = FAMBot()

# ------------------------------------------------------------------------------
# 1. GESTOR PROGRAMÁTICO DE WEBHOOKS NATIVOS DEL BOT
# ------------------------------------------------------------------------------
async def get_or_create_native_webhook(channel: discord.TextChannel) -> Optional[discord.Webhook]:
    """
    Verifica si ya existe un webhook integrado creado por el bot en el canal oficial.
    Si no existe, lo crea automáticamente usando los permisos del bot ('manage_webhooks').
    Guarda la URL y el ID en la base de datos para persistencia eficiente.
    """
    guild_id = str(channel.guild.id)
    config = database.get_guild_config(guild_id)

    # 1. Verificar si ya tenemos el webhook guardado y sigue activo
    saved_url = config.get("native_webhook_url")
    if saved_url:
        try:
            webhook = discord.Webhook.from_url(saved_url, client=bot)
            await webhook.fetch()
            return webhook
        except (discord.NotFound, discord.HTTPException):
            print(f"[FAM Bot] Webhook previo en #{channel.name} no accesible. Creando uno nuevo...")

    # 2. Buscar en la lista de webhooks existentes del canal
    try:
        webhooks = await channel.webhooks()
        for wh in webhooks:
            if wh.user == bot.user and wh.name == "FAM - Registros Oficiales":
                database.save_guild_config(
                    guild_id=guild_id,
                    guild_name=channel.guild.name,
                    official_log_channel_id=str(channel.id),
                    native_webhook_id=str(wh.id),
                    native_webhook_url=wh.url
                )
                return wh
    except discord.Forbidden:
        print(f"[FAM Error] El bot carece del permiso 'Manage Webhooks' en #{channel.name}.")
        return None
    except Exception as e:
        print(f"[FAM Error] Error consultando webhooks en #{channel.name}: {e}")

    # 3. Si no existe, crear programáticamente el webhook nativo
    try:
        new_webhook = await channel.create_webhook(
            name="FAM - Registros Oficiales",
            reason="Generación automática de Webhook del Bot FAM para diplomas y registros."
        )
        database.save_guild_config(
            guild_id=guild_id,
            guild_name=channel.guild.name,
            official_log_channel_id=str(channel.id),
            native_webhook_id=str(new_webhook.id),
            native_webhook_url=new_webhook.url
        )
        print(f"[FAM Bot] Webhook nativo creado con éxito en #{channel.name} (Guild: {channel.guild.name})")
        return new_webhook
    except discord.Forbidden:
        print(f"[FAM Error CRÍTICO] Imposible crear webhook en #{channel.name}: Falta el permiso 'Manage Webhooks'.")
        return None
    except Exception as e:
        print(f"[FAM Error] Error al crear webhook nativo: {e}")
        return None

async def send_via_native_webhook_or_fallback(channel: discord.TextChannel, embed: discord.Embed, content: Optional[str] = None) -> bool:
    """Envía el Embed a través del Webhook nativo del bot con branding militar FAM, con fallback al canal."""
    webhook = await get_or_create_native_webhook(channel)
    if webhook:
        try:
            await webhook.send(
                content=content,
                embed=embed,
                username="Fuerza Aérea Mexicana — Registros",
                avatar_url=FAM_EMBLEM_URL
            )
            return True
        except Exception as wh_err:
            print(f"[FAM Bot] Envío por Webhook falló, recurriendo a envío directo: {wh_err}")

    # Fallback si falló el webhook o no hay permisos
    try:
        await channel.send(content=content, embed=embed)
        return True
    except Exception as chan_err:
        print(f"[FAM Bot] Fallback al canal también falló: {chan_err}")
        return False

# ------------------------------------------------------------------------------
# 2. VALIDACIÓN DE ROLES Y COMANDOS DE ADMINISTRACIÓN MULTI-SERVIDOR
# ------------------------------------------------------------------------------
def is_guild_admin_or_instructor(interaction: discord.Interaction) -> bool:
    """Verifica si el usuario es administrador del servidor o posee el rol de instructor autorizado."""
    if interaction.user.guild_permissions.administrator:
        return True
    guild_id = str(interaction.guild_id)
    config = database.get_guild_config(guild_id)
    instructor_role_id = config.get("instructor_role_id")
    if instructor_role_id and isinstance(interaction.user, discord.Member):
        return any(str(r.id) == str(instructor_role_id) for r in interaction.user.roles)
    return False

@bot.tree.command(name="servidores", description="[Admin] Lista los servidores en los que está activo el bot y sus estadísticas.")
async def cmd_servidores(interaction: discord.Interaction):
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message("❌ **Acceso Denegado:** Exclusivo para Oficiales e Instructores de la FAM.", ephemeral=True)

    embed = discord.Embed(
        title="🌐 PANEL MULTI-SERVIDOR — BOT FUERZA AÉREA MEXICANA",
        description=f"El bot está prestando servicio en **{len(bot.guilds)}** servidor(es) de Roleplay Militar.",
        color=DEFAULT_EMBED_COLOR,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    for g in bot.guilds:
        cfg = database.get_guild_config(str(g.id))
        canal = f"<#{cfg['official_log_channel_id']}>" if cfg.get("official_log_channel_id") else "⚠️ No configurado"
        rol = f"<@&{cfg['instructor_role_id']}>" if cfg.get("instructor_role_id") else "⚠️ No configurado"
        webhook = "✅ Activo" if cfg.get("native_webhook_url") else "⚪ Pendiente"
        embed.add_field(
            name=f"🛩️ {g.name}",
            value=f"• **ID:** \`{g.id}\`\\n• **Miembros:** \`{g.member_count}\`\\n• **Canal:** {canal}\\n• **Rol:** {rol}\\n• **Webhook:** {webhook}",
            inline=False
        )
    await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name="configurar_servidor", description="[Admin] Configura el canal de registros y rol de instructor para este servidor.")
@app_commands.describe(canal_registros="Canal oficial de diplomas", rol_instructor="Rol de instructor autorizado")
async def cmd_configurar_servidor(interaction: discord.Interaction, canal_registros: discord.TextChannel, rol_instructor: discord.Role):
    if not interaction.user.guild_permissions.administrator:
        return await interaction.response.send_message("❌ **Acceso Denegado:** Se requieren permisos de Administrador de Discord.", ephemeral=True)

    webhook = await get_or_create_native_webhook(canal_registros)
    database.save_guild_config(
        guild_id=str(interaction.guild_id),
        guild_name=interaction.guild.name,
        official_log_channel_id=str(canal_registros.id),
        instructor_role_id=str(rol_instructor.id),
        native_webhook_id=str(webhook.id) if webhook else None,
        native_webhook_url=webhook.url if webhook else None
    )

    embed = discord.Embed(
        title="⚙️ CONFIGURACIÓN DE SERVIDOR GUARDADA",
        description=f"Directivas militares guardadas para **{interaction.guild.name}**.",
        color=0x16A34A
    )
    embed.add_field(name="Canal de Registros", value=canal_registros.mention, inline=True)
    embed.add_field(name="Rol Autorizado", value=rol_instructor.mention, inline=True)
    embed.add_field(name="Webhook Nativo", value="✅ Activo" if webhook else "⚠️ Faltan permisos", inline=False)
    await interaction.response.send_message(embed=embed)

# ------------------------------------------------------------------------------
# 3. COMANDOS DE BARRA /diploma expedir Y /diploma verificar
# ------------------------------------------------------------------------------
diploma_group = app_commands.Group(name="diploma", description="Gestión militar oficial de diplomas y certificaciones FAM")

@diploma_group.command(name="expedir", description="[Instructores] Expide un diploma oficial con folio único y anuncio por webhook.")
@app_commands.describe(
    cadete_roblox="Nombre de usuario en Roblox",
    curso="Curso militar cursado",
    rango="Rango otorgado",
    miembro_discord="Usuario de Discord del cadete",
    observaciones="Méritos de honor"
)
async def cmd_expedir_diploma(
    interaction: discord.Interaction,
    cadete_roblox: str,
    curso: str,
    rango: str = "Subteniente C.P.A.",
    miembro_discord: Optional[discord.Member] = None,
    observaciones: str = "Aprobación satisfactoria de adiestramiento militar y examen de vuelo."
):
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message("❌ **Acceso Denegado:** Rol de Oficial Instructor requerido.", ephemeral=True)

    await interaction.response.defer(thinking=True)
    guild_id = str(interaction.guild_id)
    config = database.get_guild_config(guild_id)

    cadet_id = str(miembro_discord.id) if miembro_discord else "000000000000000000"
    cadet_tag = str(miembro_discord) if miembro_discord else f"{cadete_roblox}#0000"

    diploma = database.create_diploma(
        cadet_roblox=cadete_roblox,
        course=curso,
        instructor_name=interaction.user.display_name,
        instructor_discord_id=str(interaction.user.id),
        rank=rango,
        notes=observaciones,
        cadet_discord_id=cadet_id,
        cadet_discord_tag=cadet_tag,
        instructor_discord_tag=str(interaction.user),
        guild_id=guild_id
    )

    embed_anuncio = discord.Embed(
        title="📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA",
        description=f"Certificado oficial con folio **\`{diploma['id']}\`**.",
        color=DEFAULT_EMBED_COLOR,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed_anuncio.set_thumbnail(url=FAM_EMBLEM_URL)
    embed_anuncio.add_field(name="🪖 Cadete Roblox", value=f"**{diploma['cadet_roblox']}**", inline=True)
    embed_anuncio.add_field(name="🎖️ Rango", value=diploma["rank"], inline=True)
    embed_anuncio.add_field(name="✈️ Curso", value=diploma["course"], inline=False)
    embed_anuncio.add_field(name="👨‍✈️ Instructor", value=interaction.user.mention, inline=True)
    embed_anuncio.add_field(name="🔍 Verificación", value=f"\`/diploma verificar codigo:{diploma['id']}\`", inline=False)

    channel_id = config.get("official_log_channel_id")
    if channel_id:
        target_channel = interaction.guild.get_channel(int(channel_id))
        if isinstance(target_channel, discord.TextChannel):
            await send_via_native_webhook_or_fallback(target_channel, embed_anuncio)

    await interaction.followup.send(f"✅ **Diploma expedido:** Folio \`{diploma['id']}\`.", embed=embed_anuncio)

@diploma_group.command(name="verificar", description="Consulta en el registro militar la autenticidad de un folio.")
@app_commands.describe(codigo="Código de folio (ej. FAM-8F42)")
async def cmd_verificar_diploma(interaction: discord.Interaction, codigo: str):
    diploma = database.get_diploma_by_id(codigo.strip().upper())
    if not diploma:
        return await interaction.response.send_message(f"❌ El folio **{codigo}** no existe en los registros de la FAM.", ephemeral=True)

    embed = discord.Embed(
        title="✅ CERTIFICADO OFICIAL VÁLIDO — FUERZA AÉREA MEXICANA",
        description=f"Registro militar oficial **\`{diploma['id']}\`**.",
        color=0x16A34A
    )
    embed.add_field(name="Cadete", value=diploma["cadet_roblox"], inline=True)
    embed.add_field(name="Rango", value=diploma["rank"], inline=True)
    embed.add_field(name="Curso", value=diploma["course"], inline=False)
    embed.add_field(name="Instructor", value=diploma["instructor_name"], inline=True)
    embed.add_field(name="Fecha", value=diploma["issue_date"], inline=True)
    await interaction.response.send_message(embed=embed)

bot.tree.add_command(diploma_group)

# ------------------------------------------------------------------------------
# 4. COMANDO DE ENVÍO DE ANUNCIOS EMBEDS (/embed_enviar)
# ------------------------------------------------------------------------------
@bot.tree.command(name="embed_enviar", description="[Admin/Instructores] Envía órdenes del día o convocatorias institucionales.")
@app_commands.describe(canal="Canal destino", titulo="Título del comunicado", descripcion="Contenido detallado", tipo="Estilo militar")
@app_commands.choices(tipo=[
    app_commands.Choice(name="🛩️ Órden del Día (Verde Olivo)", value="orden"),
    app_commands.Choice(name="🎖️ Boletín de Ascensos (Dorado)", value="ascenso"),
    app_commands.Choice(name="🚨 Alerta Táctica Aérea (Rojo DEFCON)", value="alerta"),
])
async def cmd_embed_enviar(interaction: discord.Interaction, canal: discord.TextChannel, titulo: str, descripcion: str, tipo: app_commands.Choice[str]):
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message("❌ **Acceso Denegado:** Permisos insuficientes.", ephemeral=True)

    colores = {"orden": 0x1E3A1E, "ascenso": 0xD97706, "alerta": 0x991B1B}
    embed = discord.Embed(
        title=f"{tipo.name.split()[0]} {titulo.upper()}",
        description=descripcion,
        color=colores.get(tipo.value, DEFAULT_EMBED_COLOR),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.set_author(name="Comandancia General de la Fuerza Aérea Mexicana", icon_url=FAM_EMBLEM_URL)
    embed.set_footer(text=f"Emitido por {interaction.user.display_name} • Honor, Valor y Lealtad")

    await send_via_native_webhook_or_fallback(canal, embed)
    await interaction.response.send_message(f"✅ Comunicado enviado exitosamente a {canal.mention}.", ephemeral=True)

if __name__ == "__main__":
    bot.run(DISCORD_BOT_TOKEN)
`;

  const guildConfigPy = `# ==============================================================================
# guild_config.py — Persistencia de Configuración Multi-Servidor (FAM)
# ==============================================================================
import sqlite3
from typing import Optional, Dict, Any, List

DB_PATH = "fam_diplomas.db"

def init_guild_settings_table():
    """Inicializa la tabla de configuración por servidor si no existe."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS guild_settings (
            guild_id TEXT PRIMARY KEY,
            guild_name TEXT NOT NULL,
            logs_channel_id TEXT,
            announcements_channel_id TEXT,
            instructor_role_id TEXT,
            embed_color TEXT DEFAULT '#1E3A1E',
            prefix TEXT DEFAULT '!',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    conn.close()

def get_guild_settings(guild_id: str) -> Dict[str, Any]:
    """Obtiene la configuración de un servidor o retorna valores por defecto de la FAM."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM guild_settings WHERE guild_id = ?", (str(guild_id),))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return dict(row)
    
    return {
        "guild_id": str(guild_id),
        "guild_name": "Servidor FAM",
        "logs_channel_id": None,
        "announcements_channel_id": None,
        "instructor_role_id": None,
        "embed_color": "#1E3A1E",
        "prefix": "!"
    }

def update_guild_settings(guild_id: str, guild_name: str, **kwargs) -> Dict[str, Any]:
    """Inserta o actualiza de forma parametrizada los parámetros de un servidor."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO guild_settings (guild_id, guild_name)
        VALUES (?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET guild_name = excluded.guild_name;
    """, (str(guild_id), guild_name))
    
    valid_fields = ["logs_channel_id", "announcements_channel_id", "instructor_role_id", "embed_color", "prefix"]
    for key, value in kwargs.items():
        if value is not None and key in valid_fields:
            cursor.execute(f"UPDATE guild_settings SET {key} = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?", (str(value), str(guild_id)))
            
    conn.commit()
    conn.close()
    return get_guild_settings(guild_id)

init_guild_settings_table()
`;

  const filesMap = {
    database: { name: 'database.py', desc: 'Manejo seguro de datos SQLite parametrizada', code: databasePy },
    auth: { name: 'auth.py', desc: 'Discord OAuth2, JWT HttpOnly y Guardias de Seguridad', code: authPy },
    main: { name: 'main.py', desc: 'Rutas Web FastAPI con sanitización Pydantic y Webhooks', code: mainPy },
    bot: { name: 'bot.py', desc: 'Bot de Discord con Slash Commands y Sincronización', code: botPy },
    guild_config: { name: 'guild_config.py', desc: 'Panel Multi-Servidor y Ajustes por Guild', code: guildConfigPy },
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>Código Modular Python: Web + Bot Discord (DevSecOps)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Estructura de Componentes Python para Producción
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Arquitectura híbrida con Panel Multi-Servidor, esquemas Pydantic, protección CSRF y comandos /embed enviar.
          </p>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFile('database')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activeFile === 'database'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>1. database.py</span>
            </button>

            <button
              onClick={() => setActiveFile('auth')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activeFile === 'auth'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>2. auth.py</span>
            </button>

            <button
              onClick={() => setActiveFile('main')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activeFile === 'main'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>3. main.py</span>
            </button>

            <button
              onClick={() => setActiveFile('bot')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activeFile === 'bot'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>4. bot.py</span>
            </button>

            <button
              onClick={() => setActiveFile('guild_config')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                activeFile === 'guild_config'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>5. guild_config.py</span>
            </button>
          </div>

          <button
            onClick={() => handleCopy(filesMap[activeFile].code)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-900 rounded-lg transition-colors shadow-sm self-start md:self-auto shrink-0"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? '¡Código Copiado!' : `Copiar ${filesMap[activeFile].name}`}</span>
          </button>

        </div>

        {/* File Description Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <span>{filesMap[activeFile].desc}</span>
          <span className="text-emerald-400 font-bold">{filesMap[activeFile].name}</span>
        </div>

        {/* Code Box */}
        <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 font-mono text-xs overflow-x-auto max-h-[620px] scrollbar-thin">
          <pre className="text-slate-200 whitespace-pre">
            {filesMap[activeFile].code}
          </pre>
        </div>

      </div>

    </div>
  );
};
