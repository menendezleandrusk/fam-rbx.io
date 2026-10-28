# ==============================================================================
# bot.py — Bot de Discord Todo en Uno para la Fuerza Aérea Mexicana (FAM)
# Framework: discord.py v2.x + app_commands (Slash Commands)
# Características: Webhooks Nativos Autogestionados, Multi-Servidor y Diplomas
# ==============================================================================

import os
import io
import datetime
from typing import Optional, List
import discord
from discord import app_commands
from discord.ext import commands

import database

# ==============================================================================
# CONFIGURACIÓN Y CLIENTE DEL BOT
# ==============================================================================

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

# ==============================================================================
# 1. GESTOR PROGRAMÁTICO DE WEBHOOKS NATIVOS DEL BOT
# ==============================================================================

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
            # Prueba de existencia consultando al webhook
            await webhook.fetch()
            return webhook
        except (discord.NotFound, discord.HTTPException):
            print(f"[FAM Bot] Webhook previo en {channel.name} ya no es accesible. Creando uno nuevo...")

    # 2. Buscar entre los webhooks existentes en el canal uno propio del bot
    try:
        webhooks = await channel.webhooks()
        for wh in webhooks:
            if wh.user == bot.user and wh.name == "FAM - Registros Oficiales":
                # Guardar en base de datos
                database.save_guild_config(
                    guild_id=guild_id,
                    guild_name=channel.guild.name,
                    official_log_channel_id=str(channel.id),
                    native_webhook_id=str(wh.id),
                    native_webhook_url=wh.url
                )
                return wh
    except discord.Forbidden:
        print(f"[FAM Error] El bot carece del permiso 'Manage Webhooks' en el canal #{channel.name}.")
        return None
    except Exception as e:
        print(f"[FAM Error] Error consultando webhooks en #{channel.name}: {e}")

    # 3. Si no existe, crear programáticamente el webhook nativo
    try:
        new_webhook = await channel.create_webhook(
            name="FAM - Registros Oficiales",
            reason="Generación automática de Webhook del Bot de la Fuerza Aérea Mexicana para diplomas y registros."
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
        print(f"[FAM Error CRÍTICO] Imposible crear webhook en #{channel.name}: Falta el permiso 'Manage Webhooks' en Discord.")
        return None
    except Exception as e:
        print(f"[FAM Error] Error al crear webhook nativo: {e}")
        return None

async def send_via_native_webhook_or_fallback(
    channel: discord.TextChannel,
    embed: discord.Embed,
    content: Optional[str] = None
) -> bool:
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

# ==============================================================================
# 2. EVENTOS DEL BOT Y CONFIGURACIÓN AUTOMÁTICA
# ==============================================================================

@bot.event
async def on_ready():
    print("=" * 60)
    print(f"✅ Bot de la Fuerza Aérea Mexicana listo como {bot.user}")
    print(f"🌐 Conectado a {len(bot.guilds)} servidor(es) de Discord.")
    print("=" * 60)
    activity = discord.Activity(type=discord.ActivityType.watching, name="los Cielos de la Patria ✈️ | /diploma")
    await bot.change_presence(status=discord.Status.online, activity=activity)

@bot.event
async def on_guild_join(guild: discord.Guild):
    """Inicializa la configuración por defecto al ingresar a un nuevo servidor."""
    print(f"[FAM Bot] Nuevo servidor detectado: {guild.name} (ID: {guild.id})")
    database.save_guild_config(
        guild_id=str(guild.id),
        guild_name=guild.name,
        official_log_channel_id=None,
        instructor_role_id=None
    )

# ==============================================================================
# 3. COMANDOS DE ADMINISTRACIÓN Y MULTI-SERVIDOR
# ==============================================================================

def is_guild_admin_or_instructor(interaction: discord.Interaction) -> bool:
    """Verifica si el usuario es administrador del servidor o tiene el rol de instructor autorizado."""
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
    """Muestra el panel de control de servidores del bot."""
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message(
            "❌ **Acceso Denegado:** Este comando es exclusivo para Oficiales e Instructores de la FAM.",
            ephemeral=True
        )

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
        webhook = "✅ Activo" if cfg.get("native_webhook_url") else "⚪ Pendiente de creación"

        embed.add_field(
            name=f"🛩️ {g.name}",
            value=(
                f"• **ID:** `{g.id}`\n"
                f"• **Miembros:** `{g.member_count}`\n"
                f"• **Canal Oficial:** {canal}\n"
                f"• **Rol Instructor:** {rol}\n"
                f"• **Webhook Bot:** {webhook}"
            ),
            inline=False
        )

    embed.set_footer(text="Estado Mayor de la FAM • Gestión Multi-Servidor")
    await interaction.response.send_message(embed=embed, ephemeral=True)

@bot.tree.command(name="configurar_servidor", description="[Admin] Configura el canal de registros y rol de instructor para este servidor.")
@app_commands.describe(
    canal_registros="Canal de texto oficial donde se anunciarán los diplomas",
    rol_instructor="Rol que autoriza a los instructores para expedir diplomas"
)
async def cmd_configurar_servidor(
    interaction: discord.Interaction,
    canal_registros: discord.TextChannel,
    rol_instructor: discord.Role
):
    """Ajusta los parámetros específicos de cada servidor de forma persistente."""
    if not interaction.user.guild_permissions.administrator:
        return await interaction.response.send_message(
            "❌ **Acceso Denegado:** Se requieren permisos de Administrador de Discord para este servidor.",
            ephemeral=True
        )

    guild_id = str(interaction.guild_id)

    # Probar/Crear webhook nativo en el canal indicado
    webhook = await get_or_create_native_webhook(canal_registros)
    wh_url = webhook.url if webhook else None
    wh_id = str(webhook.id) if webhook else None

    # Guardar en base de datos
    database.save_guild_config(
        guild_id=guild_id,
        guild_name=interaction.guild.name,
        official_log_channel_id=str(canal_registros.id),
        instructor_role_id=str(rol_instructor.id),
        native_webhook_id=wh_id,
        native_webhook_url=wh_url
    )

    embed = discord.Embed(
        title="⚙️ CONFIGURACIÓN DE SERVIDOR GUARDADA",
        description=f"Se han establecido las directivas militares para **{interaction.guild.name}**.",
        color=0x16A34A,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.add_field(name="Canal de Registros", value=canal_registros.mention, inline=True)
    embed.add_field(name="Rol Autorizado", value=rol_instructor.mention, inline=True)
    embed.add_field(
        name="Webhook Nativo",
        value="✅ Creado y enlazado correctamente" if webhook else "⚠️ No se pudo crear (revisar permiso 'Manage Webhooks')",
        inline=False
    )
    embed.set_footer(text="Fuerza Aérea Mexicana • Sistema Parametrizado")

    await interaction.response.send_message(embed=embed)

# ==============================================================================
# 4. COMANDO DE EXPEDICIÓN Y CONSULTA DE DIPLOMAS (/diploma)
# ==============================================================================

diploma_group = app_commands.Group(name="diploma", description="Gestión militar oficial de diplomas y certificaciones FAM")

@diploma_group.command(name="expedir", description="[Instructores] Expide un diploma oficial con folio único y anuncio por webhook.")
@app_commands.describe(
    cadete_roblox="Nombre de usuario oficial en Roblox del cadete",
    curso="Curso de especialidad militar cursado",
    rango="Rango militar concedido (ej. Subteniente C.P.A.)",
    miembro_discord="Usuario de Discord del cadete",
    observaciones="Méritos o anotaciones honoríficas"
)
@app_commands.choices(curso=[
    app_commands.Choice(name="Piloto Aviador de Caza y Combate (F-5E Tiger II)", value="Piloto Aviador de Caza y Combate (F-5E Tiger II)"),
    app_commands.Choice(name="Piloto Aviador de Adiestramiento (T-6C Texan II)", value="Piloto Aviador de Adiestramiento (T-6C Texan II)"),
    app_commands.Choice(name="Piloto de Transporte y Helicóptero (UH-60M Black Hawk)", value="Piloto de Transporte y Helicóptero (UH-60M Black Hawk)"),
    app_commands.Choice(name="Especialista en Mantenimiento Aeronáutico de Combate", value="Especialista en Mantenimiento Aeronáutico de Combate"),
    app_commands.Choice(name="Controlador de Tráfico y Espacio Aéreo Militar (C4+i)", value="Controlador de Tráfico y Espacio Aéreo Militar (C4+i)"),
    app_commands.Choice(name="Tácticas de Paracaidismo de la Brigada de Fusileros", value="Tácticas de Paracaidismo de la Brigada de Fusileros"),
])
async def cmd_expedir_diploma(
    interaction: discord.Interaction,
    cadete_roblox: str,
    curso: app_commands.Choice[str],
    rango: str = "Subteniente C.P.A.",
    miembro_discord: Optional[discord.Member] = None,
    observaciones: str = "Aprobación satisfactoria de adiestramiento militar y examen de vuelo."
):
    """Expide un diploma militar sincronizado con la base de datos de la web."""
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message(
            "❌ **Acceso Denegado (HTTP 403):** Se requiere el rol de Oficial Instructor autorizado para expedir certificados.",
            ephemeral=True
        )

    await interaction.response.defer(thinking=True)

    guild_id = str(interaction.guild_id)
    config = database.get_guild_config(guild_id)

    # 1. Guardar diploma en la misma base de datos unificada
    cadet_id = str(miembro_discord.id) if miembro_discord else "000000000000000000"
    cadet_tag = str(miembro_discord) if miembro_discord else f"{cadete_roblox}#0000"

    diploma = database.create_diploma(
        cadet_roblox=cadete_roblox,
        course=curso.value,
        instructor_name=interaction.user.display_name,
        instructor_discord_id=str(interaction.user.id),
        rank=rango,
        notes=observaciones,
        cadet_discord_id=cadet_id,
        cadet_discord_tag=cadet_tag,
        instructor_discord_tag=str(interaction.user),
        guild_id=guild_id
    )

    diploma_code = diploma["id"]

    # 2. Construir Embed Militar Institucional
    embed_anuncio = discord.Embed(
        title="📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA",
        description=f"La Comandancia General certifica el egreso militar con folio oficial **`{diploma_code}`**.",
        color=DEFAULT_EMBED_COLOR,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed_anuncio.set_author(name="Secretaría de la Defensa Nacional • Fuerza Aérea Mexicana", icon_url=FAM_EMBLEM_URL)
    embed_anuncio.set_thumbnail(url=FAM_EMBLEM_URL)
    embed_anuncio.add_field(name="🪖 Cadete Roblox", value=f"**{diploma['cadet_roblox']}**", inline=True)
    embed_anuncio.add_field(name="🎖️ Rango Concedido", value=f"**{diploma['rank']}**", inline=True)
    if miembro_discord:
        embed_anuncio.add_field(name="👤 Cuenta de Discord", value=miembro_discord.mention, inline=True)
    embed_anuncio.add_field(name="✈️ Curso / Especialidad", value=diploma["course"], inline=False)
    embed_anuncio.add_field(name="👨‍✈️ Oficial Instructor", value=interaction.user.mention, inline=True)
    embed_anuncio.add_field(name="📅 Fecha de Emisión", value=diploma["issue_date"], inline=True)
    embed_anuncio.add_field(name="🔍 Verificación Oficial", value=f"`/diploma verificar codigo:{diploma_code}`", inline=False)
    embed_anuncio.set_footer(text="Fuerza Aérea Mexicana • Honor, Valor y Lealtad", icon_url=FAM_EMBLEM_URL)

    # 3. Enviar a través del Webhook Nativo al canal de registros
    channel_id = config.get("official_log_channel_id")
    notificado = False

    if channel_id:
        target_channel = interaction.guild.get_channel(int(channel_id))
        if isinstance(target_channel, discord.TextChannel):
            notificado = await send_via_native_webhook_or_fallback(target_channel, embed_anuncio)

    # 4. Respuesta de confirmación al instructor que ejecutó el comando
    msg_confirmacion = f"✅ **Diploma expedido con éxito con folio:** `{diploma_code}`."
    if notificado:
        msg_confirmacion += f" Anunciado automáticamente en <#{channel_id}> vía Webhook Nativo."
    else:
        msg_confirmacion += " (Nota: Canal de registros no configurado. Usa `/configurar_servidor` para automatizar)."

    await interaction.followup.send(msg_confirmacion, embed=embed_anuncio)

@diploma_group.command(name="verificar", description="Consulta en el registro militar de la FAM la autenticidad de un folio.")
@app_commands.describe(codigo="Código de folio militar (ej. FAM-8F42 o FAM-CERT-2026-9A81B)")
async def cmd_verificar_diploma(interaction: discord.Interaction, codigo: str):
    """Permite a cualquier efectivo o civil verificar un diploma en Discord."""
    clean_code = codigo.strip().upper()
    diploma = database.get_diploma_by_id(clean_code)

    if not diploma:
        embed_error = discord.Embed(
            title="❌ CERTIFICADO NO ENCONTRADO O INVÁLIDO",
            description=f"El código `{clean_code}` no figura en los registros de la Fuerza Aérea Mexicana.",
            color=0x991B1B,
            timestamp=datetime.datetime.now(datetime.timezone.utc)
        )
        embed_error.set_footer(text="Registro de Auditoría FAM")
        return await interaction.response.send_message(embed=embed_error)

    es_valido = diploma.get("status") == "VALIDO"
    embed_result = discord.Embed(
        title="✅ CERTIFICADO OFICIAL VÁLIDO — FUERZA AÉREA MEXICANA" if es_valido else "⚠️ DIPLOMA REVOCADO",
        description=f"Registro militar oficial con folio **`{diploma['id']}`**.",
        color=0x16A34A if es_valido else 0xD97706,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed_result.set_thumbnail(url=FAM_EMBLEM_URL)
    embed_result.add_field(name="Cadete Roblox", value=diploma["cadet_roblox"], inline=True)
    embed_result.add_field(name="Rango Militar", value=diploma["rank"], inline=True)
    embed_result.add_field(name="Especialidad", value=diploma["course"], inline=False)
    embed_result.add_field(name="Instructor Expedidor", value=diploma["instructor_name"], inline=True)
    embed_result.add_field(name="Fecha de Expedición", value=diploma["issue_date"], inline=True)
    embed_result.add_field(name="Estado", value=f"**{diploma['status']}**", inline=True)

    if diploma.get("notes"):
        embed_result.add_field(name="Observaciones", value=diploma["notes"], inline=False)

    embed_result.set_footer(text="Base de Datos Centralizada FAM • Verificación OAuth2")
    await interaction.response.send_message(embed=embed_result)

bot.tree.add_command(diploma_group)

# ==============================================================================
# 5. COMANDO DE ENVÍO DE EMBEDS PERSONALIZADOS (/embed enviar)
# ==============================================================================

@bot.tree.command(name="embed_enviar", description="[Admin/Instructores] Envía anuncios y órdenes del día con diseño militar oficial.")
@app_commands.describe(
    canal="Canal de Discord donde se publicará el anuncio institucional",
    titulo="Título del comunicado u orden militar",
    descripcion="Cuerpo o contenido detallado del comunicado",
    tipo_comunicado="Plantilla estética militar a aplicar",
    imagen_url="URL opcional de un banner o imagen de Roblox"
)
@app_commands.choices(tipo_comunicado=[
    app_commands.Choice(name="🛩️ Órden del Día (Verde Olivo)", value="orden"),
    app_commands.Choice(name="🎖️ Boletín de Ascensos (Dorado Militar)", value="ascenso"),
    app_commands.Choice(name="🚨 Alerta Táctica Aérea (Rojo DEFCON)", value="alerta"),
    app_commands.Choice(name="📋 Convocatoria de Reclutamiento (Azul Fuerza Aérea)", value="convocatoria"),
])
async def cmd_embed_enviar(
    interaction: discord.Interaction,
    canal: discord.TextChannel,
    titulo: str,
    descripcion: str,
    tipo_comunicado: app_commands.Choice[str],
    imagen_url: Optional[str] = None
):
    """Permite a mandos enviar anuncios corporativos militarizados al canal seleccionado."""
    if not is_guild_admin_or_instructor(interaction):
        return await interaction.response.send_message(
            "❌ **Acceso Denegado:** Se requieren permisos de Oficial o Administrador para enviar comunicados oficiales.",
            ephemeral=True
        )

    # Definir paleta militar según tipo
    colores = {
        "orden": 0x1E3A1E,        # Verde Olivo FAM
        "ascenso": 0xD97706,      # Dorado Mérito
        "alerta": 0x991B1B,       # Rojo Alerta
        "convocatoria": 0x1A365D  # Azul Fuerza Aérea
    }
    color_seleccionado = colores.get(tipo_comunicado.value, DEFAULT_EMBED_COLOR)

    embed = discord.Embed(
        title=f"{tipo_comunicado.name.split()[0]} {titulo.upper()}",
        description=descripcion,
        color=color_seleccionado,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.set_author(name="Comandancia General de la Fuerza Aérea Mexicana", icon_url=FAM_EMBLEM_URL)
    embed.set_thumbnail(url=FAM_EMBLEM_URL)
    embed.set_footer(
        text=f"Emitido por {interaction.user.display_name} • Honor, Valor y Lealtad",
        icon_url=FAM_EMBLEM_URL
    )

    if imagen_url and (imagen_url.startswith("http://") or imagen_url.startswith("https://")):
        embed.set_image(url=imagen_url)

    # Enviar al canal destino utilizando el webhook nativo del canal si está disponible
    enviado = await send_via_native_webhook_or_fallback(canal, embed)

    if enviado:
        await interaction.response.send_message(
            f"✅ **Comunicado oficial enviado exitosamente a {canal.mention}.**",
            ephemeral=True
        )
    else:
        await interaction.response.send_message(
            f"❌ Error al enviar el mensaje a {canal.mention}. Verifica que el bot tenga permisos de 'Send Messages'.",
            ephemeral=True
        )

# ==============================================================================
# MANEJO GLOBAL DE ERRORES DE COMANDOS DE BARRA
# ==============================================================================

@bot.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.MissingPermissions):
        msg = "❌ No cuentas con los permisos suficientes en Discord para ejecutar esta orden militar."
    elif isinstance(error, app_commands.BotMissingPermissions):
        msg = f"❌ El bot carece de permisos para realizar esta acción: {error.missing_permissions}"
    else:
        msg = "❌ Ocurrió un error inesperado al procesar el comando. El evento ha sido registrado."
        print(f"[FAM Bot Error]: {error}")

    try:
        if interaction.response.is_done():
            await interaction.followup.send(msg, ephemeral=True)
        else:
            await interaction.response.send_message(msg, ephemeral=True)
    except Exception:
        pass

if __name__ == "__main__":
    if not DISCORD_BOT_TOKEN or DISCORD_BOT_TOKEN == "TU_DISCORD_BOT_TOKEN_AQUI":
        print("⚠️ [AVISO] DISCORD_BOT_TOKEN no está definido en las variables de entorno.")
        print("Configura DISCORD_BOT_TOKEN en tu archivo .env para iniciar el bot.")
    else:
        bot.run(DISCORD_BOT_TOKEN)
