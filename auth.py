# ==============================================================================
# auth.py — Autenticación Discord OAuth2, Sesión JWT y Middlewares de Seguridad
# Fuerza Aérea Mexicana (FAM) - Roblox Ro-Army
# Blindaje DevSecOps: Protección CSRF, Cookies HttpOnly/Secure y Doble Validación
# ==============================================================================

import os
import secrets
import datetime
import urllib.parse
from typing import Optional, Dict, Any, List
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import RedirectResponse

# ==============================================================================
# CONFIGURACIÓN Y VARIABLES DE ENTORNO
# ==============================================================================

DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "1539391208411889676")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN", "")

def get_clean_redirect_uri(request: Optional[Request] = None) -> str:
    """
    Extrae y sanitiza la REDIRECT_URI para evitar el error de Discord 'Invalid OAuth2 redirect_uri'.
    Soporta detección dinámica de host (Google Cloud Run / AI Studio / Custom Domain).
    """
    if request:
        host = request.headers.get("host")
        if host and "localhost" not in host and "127.0.0.1" not in host:
            proto = request.headers.get("x-forwarded-proto", "https")
            return f"{proto}://{host}/auth/callback"

    raw_val = os.getenv("DISCORD_REDIRECT_URI") or os.getenv("REDIRECT_URI") or ""
    raw_val = raw_val.strip()

    if "discord.com/oauth2/authorize" in raw_val or "redirect_uri=" in raw_val:
        try:
            parsed = urllib.parse.urlparse(raw_val)
            query_params = urllib.parse.parse_qs(parsed.query)
            if "redirect_uri" in query_params:
                return query_params["redirect_uri"][0].strip()
        except Exception:
            pass

    if raw_val:
        return raw_val

    # Si no se definió, construir con APP_URL
    app_url = os.getenv("APP_URL", "").rstrip("/")
    if app_url:
        return f"{app_url}/auth/callback"

    return "https://ais-pre-tdidzq3x6qh7ek5k775onk-824715890255.us-east1.run.app/auth/callback"

REDIRECT_URI = get_clean_redirect_uri()
FAM_GUILD_ID = os.getenv("FAM_GUILD_ID", "1322384520288276540")
INSTRUCTOR_ROLE_ID = os.getenv("INSTRUCTOR_ROLE_ID", "1322384520380416126")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("JWT_SECRET", "fam_devsecops_jwt_secure_key_2026_mexico"))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 días de sesión activa

# ==============================================================================
# MANEJO CRIPTOGRÁFICO DE SESIÓN JWT
# ==============================================================================

def create_access_token(data: Dict[str, Any]) -> str:
    """Firma digitalmente un token JWT con tiempo de expiración."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Valida la firma criptográfica y decodifica el token de sesión."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

# ==============================================================================
# PROTECCIÓN CSRF (ANTI-CSRF STATE TOKENS)
# ==============================================================================

def generate_csrf_state() -> str:
    """Genera un token de estado aleatorio criptográficamente seguro para prevenir ataques CSRF."""
    return secrets.token_hex(32)

def build_discord_auth_url(state: str, redirect_uri: Optional[str] = None) -> str:
    """Construye la URL de inicio de sesión con Discord OAuth2."""
    scopes = "identify guilds.members.read"
    target_redirect = redirect_uri or REDIRECT_URI
    params = {
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": target_redirect,
        "response_type": "code",
        "scope": scopes,
        "state": state,
        "prompt": "consent",
    }
    return f"https://discord.com/api/oauth2/authorize?{urllib.parse.urlencode(params)}"

# ==============================================================================
# INTERCAMBIO DE CÓDIGO Y DOBLE VALIDACIÓN DISCORD
# ==============================================================================

async def exchange_code_for_token(code: str) -> Optional[str]:
    """Intercambia el código de autorización temporal por un Token de Acceso en Discord."""
    async with httpx.AsyncClient(timeout=10.0) as client:
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
    Doble Validación Estricta de Seguridad:
    1. Obtiene perfil básico del usuario (/users/@me).
    2. Comprueba obligatoriamente pertenencia al servidor oficial FAM (FAM_GUILD_ID).
    3. Verifica si posee el rol de Instructor (INSTRUCTOR_ROLE_ID).
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # 1. Obtener perfil del usuario
        user_res = await client.get("https://discord.com/api/users/@me", headers=headers)
        if user_res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de acceso de Discord no válido o revocado."
            )
        user_data = user_res.json()
        user_id = user_data["id"]

        is_guild_member = False
        is_instructor = False
        roles: List[str] = []

        # 2. Intento de validación directa mediante token del usuario
        try:
            member_url = f"https://discord.com/api/users/@me/guilds/{FAM_GUILD_ID}/member"
            member_res = await client.get(member_url, headers=headers)
            if member_res.status_code == 200:
                member_data = member_res.json()
                is_guild_member = True
                roles = member_data.get("roles", [])
                is_instructor = INSTRUCTOR_ROLE_ID in roles
        except Exception:
            pass

        # 3. Fallback: Verificación a través del Bot Oficial en el servidor
        if not is_guild_member and DISCORD_BOT_TOKEN:
            try:
                bot_headers = {"Authorization": f"Bot {DISCORD_BOT_TOKEN}"}
                bot_url = f"https://discord.com/api/v10/guilds/{FAM_GUILD_ID}/members/{user_id}"
                bot_res = await client.get(bot_url, headers=bot_headers)
                if bot_res.status_code == 200:
                    bot_member = bot_res.json()
                    is_guild_member = True
                    roles = bot_member.get("roles", [])
                    is_instructor = INSTRUCTOR_ROLE_ID in roles
            except Exception:
                pass

        # REQUISITO OBLIGATORIO: Pertenecer al servidor de la FAM
        if not is_guild_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso Denegado: Debes ser miembro activo del servidor oficial de la Fuerza Aérea Mexicana."
            )

        avatar_hash = user_data.get("avatar")
        avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png" if avatar_hash else ""

        return {
            "id": user_id,
            "username": f"{user_data['username']}#{user_data.get('discriminator', '0')}",
            "discriminator": user_data.get("discriminator", "0"),
            "avatar": avatar_url,
            "is_instructor": is_instructor,
            "guild_member": is_guild_member,
            "detected_roles": roles,
            "instructor_rank": "Coronel de Fuerza Aérea C.P.A." if is_instructor else "Cadete Aviador"
        }

# ==============================================================================
# MIDDLEWARES Y DEPENDENCIAS DE SEGURIDAD (FastAPI)
# ==============================================================================

async def require_auth(request: Request) -> Dict[str, Any]:
    """
    Middleware de Autenticación Obligatoria.
    Valida la cookie HttpOnly 'fam_session' o el header Bearer.
    Si no hay sesión válida, rechaza con HTTP 401 Unauthorized.
    """
    token = request.cookies.get("fam_session")
    if not token and "Authorization" in request.headers:
        token = request.headers["Authorization"].replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticación Obligatoria: Debes iniciar sesión con Discord OAuth2 para acceder al sistema FAM."
        )

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión expirada o manipulada. Vuelve a iniciar sesión con Discord."
        )
    return payload

async def require_instructor(user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    """
    Middleware de Control de Acceso Estricto (RBAC).
    Exclusivo para Oficiales e Instructores con INSTRUCTOR_ROLE_ID verificado.
    Rechaza con HTTP 403 Forbidden si el usuario no tiene rango suficiente.
    """
    if not user.get("is_instructor", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso Denegado (HTTP 403): Tu cuenta militar no posee el rol de Oficial Instructor requerido."
        )
    return user
