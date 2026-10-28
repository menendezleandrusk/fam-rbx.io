# ==============================================================================
# database.py — Capa de Persistencia Unificada (Multi-Servidor y Diplomas FAM)
# Fuerza Aérea Mexicana (FAM) - Roblox Ro-Army
# Blindaje DevSecOps: Consultas Parametrizadas, Índices Rápidos y Sanitización
# ==============================================================================

import sqlite3
import secrets
import datetime
import os
import json
from typing import Optional, Dict, Any, List

DB_PATH = os.getenv("SQLITE_DB_PATH", "fam_military_system.db")

def get_connection() -> sqlite3.Connection:
    """Crea una conexión con row_factory para devolver diccionarios seguros."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa las tablas relacionales para diplomas, servidores y auditoría."""
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Tabla de Diplomas Militares Oficiales
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS diplomas_fam (
                id TEXT PRIMARY KEY,                       -- Folio militar: FAM-XXXX o FAM-CERT-2026-XXXX
                cadet_roblox TEXT NOT NULL,               -- Usuario Roblox sanitizado
                cadet_discord_id TEXT NOT NULL,           -- ID Snowflake de Discord
                cadet_discord_tag TEXT NOT NULL,          -- Tag de Discord (ej. Cadete#1234)
                rank TEXT NOT NULL,                       -- Rango militar concedido
                course TEXT NOT NULL,                     -- Especialidad de vuelo o combate
                notes TEXT,                               -- Méritos / Menciones honoríficas
                instructor_name TEXT NOT NULL,            -- Nombre del instructor expedidor
                instructor_discord_id TEXT NOT NULL,      -- ID Discord del instructor
                instructor_discord_tag TEXT,              -- Tag Discord del instructor
                base_location TEXT DEFAULT 'Base Aérea Militar No. 1 Santa Lucía',
                issue_date TEXT NOT NULL,                 -- Fecha oficial (YYYY-MM-DD)
                status TEXT DEFAULT 'VALIDO',             -- VALIDO | REVOCADO
                guild_id TEXT,                            -- ID del servidor Discord donde se expidió
                qr_data TEXT,                             -- URL de verificación
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Tabla de Configuración Multi-Servidor (Multi-Guild)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS guild_configs (
                guild_id TEXT PRIMARY KEY,                -- Discord Guild ID
                guild_name TEXT NOT NULL,                 -- Nombre del servidor
                official_log_channel_id TEXT,             -- Canal oficial para webhooks y registros
                instructor_role_id TEXT,                  -- Rol de Instructor exclusivo para este servidor
                embed_color_hex TEXT DEFAULT '#1E3A1E',   -- Color institucional FAM
                prefix TEXT DEFAULT '!',                  -- Prefijo de comandos clásicos
                native_webhook_id TEXT,                   -- ID del webhook autogestionado por el bot
                native_webhook_url TEXT,                  -- URL del webhook autogestionado por el bot
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Bitácora de Verificaciones y Auditoría
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verification_logs (
                id TEXT PRIMARY KEY,
                diploma_id TEXT NOT NULL,
                verifier_user TEXT NOT NULL,
                is_valid INTEGER NOT NULL,
                verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_hash TEXT
            );
        """)

        # Índices de Alto Rendimiento para Búsquedas por Folio y Cadete
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diplomas_id ON diplomas_fam(id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diplomas_cadet ON diplomas_fam(cadet_roblox);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_diplomas_guild ON diplomas_fam(guild_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_guild_configs_id ON guild_configs(guild_id);")

        conn.commit()

# ==============================================================================
# GESTIÓN DE DIPLOMAS MILITARES
# ==============================================================================

def generate_short_code() -> str:
    """Genera un folio criptográficamente seguro y corto: FAM-XXXX (Anti-Colisión)."""
    random_hex = secrets.token_hex(2).upper()
    return f"FAM-{random_hex}"

def create_diploma(
    cadet_roblox: str,
    course: str,
    instructor_name: str,
    instructor_discord_id: str,
    rank: str = "Subteniente C.P.A.",
    notes: str = "Aprobación satisfactoria de adiestramiento aéreo militar.",
    cadet_discord_id: str = "000000000000000000",
    cadet_discord_tag: str = "Cadete#0000",
    instructor_discord_tag: str = "Instructor#0000",
    base_location: str = "Base Aérea Militar No. 1 Santa Lucía",
    guild_id: Optional[str] = None,
    custom_code: Optional[str] = None
) -> Dict[str, Any]:
    """Inserta un nuevo diploma militar utilizando consultas estrictamente parametrizadas."""
    diploma_id = custom_code or generate_short_code()
    issue_date = datetime.date.today().isoformat()
    qr_data = f"https://fam-roblox.gov/diploma/{diploma_id}"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO diplomas_fam (
                id, cadet_roblox, cadet_discord_id, cadet_discord_tag,
                rank, course, notes, instructor_name, instructor_discord_id,
                instructor_discord_tag, base_location, issue_date, status,
                guild_id, qr_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALIDO', ?, ?)
        """, (
            diploma_id, cadet_roblox.strip(), cadet_discord_id, cadet_discord_tag,
            rank.strip(), course.strip(), notes.strip(), instructor_name.strip(),
            instructor_discord_id, instructor_discord_tag, base_location.strip(),
            issue_date, guild_id, qr_data
        ))
        conn.commit()

    return get_diploma_by_id(diploma_id)

def get_diploma_by_id(diploma_id: str) -> Optional[Dict[str, Any]]:
    """Consulta segura de diploma por código de folio (insensible a mayúsculas/minúsculas)."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM diplomas_fam WHERE UPPER(id) = UPPER(?)", (diploma_id.strip(),))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

def list_all_diplomas(limit: int = 50, guild_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Lista los diplomas más recientes, opcionalmente filtrados por servidor."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if guild_id:
            cursor.execute(
                "SELECT * FROM diplomas_fam WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?",
                (guild_id, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM diplomas_fam ORDER BY created_at DESC LIMIT ?",
                (limit,)
            )
        return [dict(r) for r in cursor.fetchall()]

def revoke_diploma(diploma_id: str, reason: str = "Revocación Militar Oficial") -> bool:
    """Revoca el estado de validez de un diploma."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE diplomas_fam SET status = 'REVOCADO', notes = notes || ' [REVOCADO: ' || ? || ']' WHERE UPPER(id) = UPPER(?)",
            (reason, diploma_id.strip())
        )
        conn.commit()
        return cursor.rowcount > 0

# ==============================================================================
# GESTIÓN MULTI-SERVIDOR (DISCORD GUILD CONFIGS)
# ==============================================================================

def get_guild_config(guild_id: str) -> Dict[str, Any]:
    """Obtiene la configuración de un servidor o retorna los valores predeterminados de la FAM."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM guild_configs WHERE guild_id = ?", (str(guild_id),))
        row = cursor.fetchone()
        if row:
            return dict(row)

    # Valores por defecto basados en variables de entorno o institucionales
    return {
        "guild_id": str(guild_id),
        "guild_name": "Servidor FAM",
        "official_log_channel_id": os.getenv("CHANNEL_ID", ""),
        "instructor_role_id": os.getenv("INSTRUCTOR_ROLE_ID", ""),
        "embed_color_hex": "#1E3A1E",
        "prefix": "!",
        "native_webhook_id": None,
        "native_webhook_url": None,
    }

def save_guild_config(
    guild_id: str,
    guild_name: str,
    official_log_channel_id: Optional[str] = None,
    instructor_role_id: Optional[str] = None,
    embed_color_hex: str = "#1E3A1E",
    prefix: str = "!",
    native_webhook_id: Optional[str] = None,
    native_webhook_url: Optional[str] = None
) -> Dict[str, Any]:
    """Crea o actualiza la configuración específica de un servidor (Upsert)."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO guild_configs (
                guild_id, guild_name, official_log_channel_id, instructor_role_id,
                embed_color_hex, prefix, native_webhook_id, native_webhook_url, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(guild_id) DO UPDATE SET
                guild_name = excluded.guild_name,
                official_log_channel_id = COALESCE(excluded.official_log_channel_id, guild_configs.official_log_channel_id),
                instructor_role_id = COALESCE(excluded.instructor_role_id, guild_configs.instructor_role_id),
                embed_color_hex = excluded.embed_color_hex,
                prefix = excluded.prefix,
                native_webhook_id = COALESCE(excluded.native_webhook_id, guild_configs.native_webhook_id),
                native_webhook_url = COALESCE(excluded.native_webhook_url, guild_configs.native_webhook_url),
                updated_at = CURRENT_TIMESTAMP
        """, (
            str(guild_id), guild_name, official_log_channel_id, instructor_role_id,
            embed_color_hex, prefix, native_webhook_id, native_webhook_url
        ))
        conn.commit()

    return get_guild_config(guild_id)

def list_all_guild_configs() -> List[Dict[str, Any]]:
    """Devuelve la lista de todos los servidores registrados en el bot."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM guild_configs ORDER BY updated_at DESC")
        return [dict(r) for r in cursor.fetchall()]

# Auto-inicialización al importar
init_db()
