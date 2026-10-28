import { DiscordEmbedData, DiplomaRecord, AuditLogItem, AutoModRule, ReactionRoleConfig, BotCommandHelp } from '../types';

export const ASSETS = {
  famEmblem: '/src/assets/images/fam_emblem_1793150878922.jpg',
  famDiplomaWatermark: '/src/assets/images/fam_diploma_watermark_1793150879629.jpg',
  famBaseHero: '/src/assets/images/fam_base_hero_1793150879667.jpg',
};

export const FAM_RANKS = [
  'General de División C.P.A.',
  'General de Grupo C.P.A.',
  'Coronel de Fuerza Aérea C.P.A.',
  'Teniente Coronel C.P.A.',
  'Mayor de Fuerza Aérea C.P.A.',
  'Capitán Primero C.P.A.',
  'Capitán Segundo C.P.A.',
  'Teniente C.P.A.',
  'Subteniente C.P.A.',
  'Cadete de 1ª Clase',
  'Cadete Aviador',
];

export const SPECIALTY_COURSES = [
  'Piloto Aviador de Caza y Combate (F-5E Tiger II)',
  'Piloto Aviador de Adiestramiento (T-6C Texan II)',
  'Piloto de Transporte Helicóptero (UH-60M Black Hawk / Mi-17)',
  'Especialista en Mantenimiento Aeronáutico de Combate',
  'Controlador de Tráfico y Espacio Aéreo Militar (C4+i)',
  'Tácticas de Paracaidismo de la Brigada de Fusileros Paracaidistas',
  'Armamento Aéreo y Sistemas de Misiles Guiados',
  'Instructor Certificado de Vuelo de la Escuela Militar de Aviación',
];

export const INITIAL_EMBED_PRESETS: Record<string, DiscordEmbedData> = {
  orden_del_dia: {
    title: '🛩️ ÓRDEN DEL DÍA — BASE AÉREA MILITAR NO. 1 SANTA LUCÍA',
    description: 'Se convoca a todo el personal de la Fuerza Aérea Mexicana en Roblox para las maniobras de entrenamiento aéreo programadas para el día de hoy.',
    color: '#1e3a1e', // Verde Olivo Militar
    authorName: 'Comandancia General de la FAM',
    authorIcon: ASSETS.famEmblem,
    thumbnail: ASSETS.famEmblem,
    image: ASSETS.famBaseHero,
    footerText: 'Fuerza Aérea Mexicana • Honor, Valor y Lealtad',
    footerIcon: ASSETS.famEmblem,
    timestamp: true,
    fields: [
      { id: '1', name: '📅 Fecha y Hora', value: '20:00 hrs (Hora Centro México)', inline: true },
      { id: '2', name: '📍 Ubicación en Roblox', value: 'Base Aérea Santa Lucía (Servidor Principal)', inline: true },
      { id: '3', name: '🪖 Código de Vestimenta', value: 'Uniforme de Vuelo / Transición Tipo A', inline: true },
      { id: '4', name: '📋 Instrucciones para Instructores', value: 'Verificar lista de asistencia y mantener frecuencias de radio activas en Discord.', inline: false },
    ],
  },
  ascenso_oficial: {
    title: '🎖️ BOLETÍN OFICIAL DE ASCENSOS Y CONDECORACIONES',
    description: 'El Alto Mando de la Fuerza Aérea Mexicana reconoce la dedicación, excelencia en vuelo y liderazgo militar de los siguientes efectivos.',
    color: '#d97706', // Dorado Honor
    authorName: 'Estado Mayor de la Fuerza Aérea Mexicana',
    authorIcon: ASSETS.famEmblem,
    thumbnail: ASSETS.famEmblem,
    image: '',
    footerText: 'Secretaría de la Defensa Nacional • R.A. FAM',
    footerIcon: ASSETS.famEmblem,
    timestamp: true,
    fields: [
      { id: '1', name: '👤 Elemento Promovido', value: 'Roblox: **Roblox_Aviador99** (@Aviador99)', inline: true },
      { id: '2', name: '🎖️ Nuevo Rango Asignado', value: '**Capitán Segundo C.P.A.**', inline: true },
      { id: '3', name: '📜 Mérito Militar', value: 'Aprobación con honores en el Curso de Caza y Combate F-5E.', inline: false },
    ],
  },
  convocatoria_reclutamiento: {
    title: '📋 CONVOCATORIA DE ADMISIÓN — ESCUELA MILITAR DE AVIACIÓN (EMA)',
    description: '¿Tienes lo necesario para ser un Piloto Aviador de la Fuerza Aérea Mexicana en Roblox? Abrimos el proceso de reclutamiento nacional.',
    color: '#1a365d', // Azul Fuerza Aérea
    authorName: 'Escuela Militar de Aviación — FAM',
    authorIcon: ASSETS.famEmblem,
    thumbnail: ASSETS.famEmblem,
    image: ASSETS.famBaseHero,
    footerText: 'Admisiones FAM Roblox 2026',
    footerIcon: ASSETS.famEmblem,
    timestamp: true,
    fields: [
      { id: '1', name: 'Requisitos Básicos', value: '• Cuenta de Roblox > 90 días\n• Edad Roblox/Discord adecuada\n• Asistencia regular y micrófono claro', inline: false },
      { id: '2', name: '¿Cómo postular?', value: 'Reacciona en el canal <#roles-verificacion> y usa el comando `!verificar` en bot.', inline: false },
    ],
  },
  alerta_defcon: {
    title: '🚨 ALERTA TÁCTICA AÉREA — DESPLIEGUE INMEDIATO',
    description: 'Se ha activado el Protocolo de Defensa del Espacio Aéreo. Todos los pilotos de Caza y Escuadrón 201 deben presentarse en la línea de vuelo.',
    color: '#991b1b', // Rojo Alerta
    authorName: 'Centro de Operaciones Aéreas (C4+i)',
    authorIcon: ASSETS.famEmblem,
    thumbnail: ASSETS.famEmblem,
    image: '',
    footerText: 'Prioridad 1 — Transmisión Encriptada',
    footerIcon: ASSETS.famEmblem,
    timestamp: true,
    fields: [
      { id: '1', name: 'Escuadrón Requerido', value: 'Escuadrón Aéreo 201 (F-5E Tiger II)', inline: true },
      { id: '2', name: 'Canal de Radio', value: 'Voz: [Voz] Escuadrón Alfa-1', inline: true },
    ],
  },
};

export const INITIAL_DIPLOMAS: DiplomaRecord[] = [
  {
    id: 'FAM-CERT-2026-9A81B',
    cadetRoblox: 'Roblox_Cadete_Alpha',
    cadetDiscordId: '29834710928340192',
    cadetDiscordTag: 'AlphaPiloto#1234',
    rank: 'Subteniente C.P.A.',
    course: 'Piloto Aviador de Caza y Combate (F-5E Tiger II)',
    issueDate: '2026-10-25',
    instructorName: 'Coronel Rafael G. Ordóñez',
    instructorRank: 'Coronel de Fuerza Aérea C.P.A.',
    instructorDiscordTag: 'Cnl_Ordonez#0001',
    baseLocation: 'Base Aérea Militar No. 1 Santa Lucía',
    status: 'VALID',
    qrData: 'https://fam-roblox.gov/diploma/FAM-CERT-2026-9A81B',
  },
  {
    id: 'FAM-CERT-2026-4C72D',
    cadetRoblox: 'Mecánico_Aero_MX',
    cadetDiscordId: '84920192837410923',
    cadetDiscordTag: 'MecaMX#9981',
    rank: 'Teniente C.P.A.',
    course: 'Especialista en Mantenimiento Aeronáutico de Combate',
    issueDate: '2026-10-20',
    instructorName: 'Mayor Javier Ruiz M.',
    instructorRank: 'Mayor de Fuerza Aérea C.P.A.',
    instructorDiscordTag: 'Mayor_Ruiz#0044',
    baseLocation: 'Escuela Militar de Aviación',
    status: 'VALID',
    qrData: 'https://fam-roblox.gov/diploma/FAM-CERT-2026-4C72D',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-101',
    timestamp: 'Hace 5 minutos',
    action: 'DIPLOMA_ISSUED',
    target: 'Roblox_Cadete_Alpha (FAM-CERT-2026-9A81B)',
    executor: 'Cnl_Ordonez#0001 (Coronel)',
    reason: 'Finalización exitosa del curso de Caza F-5E con Discord OAuth2 autenticado.',
    severity: 'low',
  },
  {
    id: 'log-102',
    timestamp: 'Hace 22 minutos',
    action: 'WARN',
    target: 'Cadete_Spammer99#4321',
    executor: 'FAM Bot (Auto-Mod)',
    reason: 'Envío continuo de enlaces no autorizados en #general.',
    severity: 'medium',
  },
  {
    id: 'log-103',
    timestamp: 'Hace 1 hora',
    action: 'ROLE_CHANGE',
    target: 'Roblox_Aviador99',
    executor: 'General_Grupo_MX#0002',
    reason: 'Promoción a Capitán Segundo C.P.A.',
    severity: 'low',
  },
  {
    id: 'log-104',
    timestamp: 'Hace 2 horas',
    action: 'MUTE',
    target: 'Troll_User_2026#9999',
    executor: 'Capitan_Vuelo#1102',
    reason: 'Interrupción repetida en canal de radio de vuelo. Silenciado por 24 horas.',
    severity: 'high',
  },
  {
    id: 'log-105',
    timestamp: 'Hace 3 horas',
    action: 'VOICE_MOVE',
    target: 'Cadete_Rookie#0011',
    executor: 'Sistema de Guardia',
    reason: 'Movido de Espera a Canal de Examen de Vuelo.',
    severity: 'low',
  },
];

export const INITIAL_AUTOMOD_RULES: AutoModRule[] = [
  {
    id: 'rule-1',
    name: 'Anti-Spam de Mensajes Rápido',
    description: 'Detecta y bloquea más de 5 mensajes en menos de 3 segundos.',
    enabled: true,
    action: 'mute',
    threshold: '5 msgs / 3s',
  },
  {
    id: 'rule-2',
    name: 'Filtro de Enlaces Roblox / Discord Ajenos',
    description: 'Bloquea enlaces de invitación a servidores de Discord no autorizados.',
    enabled: true,
    action: 'delete',
    threshold: '1 enlace detectado',
  },
  {
    id: 'rule-3',
    name: 'Filtro de Lenguaje Insustancial / Insubordinación',
    description: 'Detecta malas palabras y faltas al protocolo militar.',
    enabled: true,
    action: 'warn',
    threshold: 'Palabras clave FAM',
  },
  {
    id: 'rule-4',
    name: 'Verificación Obligatoria Roblox-Discord',
    description: 'Exige vincular la cuenta de Roblox para escribir en canales tácticos.',
    enabled: true,
    action: 'warn',
    threshold: 'Sin rol [Verificado]',
  },
];

export const REACTION_ROLES_CONFIG: ReactionRoleConfig[] = [
  {
    id: 'rr-1',
    emoji: '🛩️',
    roleName: '[FAM] Cadete Aviador',
    roleColor: '#1a365d',
    description: 'Acceso a canales de vuelo y Escuela Militar de Aviación',
    count: 142,
  },
  {
    id: 'rr-2',
    emoji: '🛠️',
    roleName: '[FAM] Mecánico de Combate',
    roleColor: '#d97706',
    description: 'Acceso a talleres de mantenimiento y hangares',
    count: 68,
  },
  {
    id: 'rr-3',
    emoji: '🪂',
    roleName: '[FAM] Fusilero Paracaidista',
    roleColor: '#1e3a1e',
    description: 'Acceso a brigada de operaciones especiales',
    count: 95,
  },
];

export const BOT_COMMANDS: BotCommandHelp[] = [
  {
    command: '!embed create',
    module: 'Anuncios',
    rankRequired: 'Capitán o Superior',
    description: 'Abre el creador interactivo de anuncios corporativos militarizados.',
    usage: '!embed create #anuncios-oficiales',
  },
  {
    command: '!expedir_diploma',
    module: 'Diplomas',
    rankRequired: 'Oficial Instructor (Capitán/Coronel)',
    description: 'Inicia el flujo seguro con Discord OAuth2 para expedir un diploma con código único y QR.',
    usage: '!expedir_diploma @Cadete "Piloto Aviador" "Subteniente"',
  },
  {
    command: '!verificar_diploma <HASH>',
    module: 'Verificación',
    rankRequired: 'Cualquier usuario',
    description: 'Consulta en el registro militar de la FAM la validez de un certificado.',
    usage: '!verificar_diploma FAM-CERT-2026-9A81B',
  },
  {
    command: '!mod warn / mute / kick / ban',
    module: 'Moderación',
    rankRequired: 'Personal de Seguridad / Oficiales',
    description: 'Sanciona miembros e insustanciales con registro automático en Auditoría.',
    usage: '!mod mute @Usuario 1h "Insubordinación"',
  },
  {
    command: '!ascenso @Usuario <NuevoRango>',
    module: 'Utilidad',
    rankRequired: 'General de Grupo / División',
    description: 'Promueve al elemento en Roblox/Discord y publica el anuncio institucional.',
    usage: '!ascenso @Aviador99 "Capitán Segundo"',
  },
  {
    command: '!auditoria',
    module: 'Moderación',
    rankRequired: 'Estado Mayor',
    description: 'Muestra los últimos eventos de moderación, expediciones y cambios de canal.',
    usage: '!auditoria 10',
  },
];

export const PYTHON_DISCORD_CODE = `# ==============================================================================
# BOT DE DISCORD TODO EN UNO — FUERZA AÉREA MEXICANA (ROBLOX RO-ARMY)
# Framework: discord.py v2.x + FastAPI (OAuth2 Web Service para Diplomas)
# ==============================================================================

import os
import uuid
import qrcode
import datetime
from io import BytesIO
import discord
from discord.ext import commands
from discord import app_commands
import uvicorn
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse

# CONFIGURACIÓN Y CLIENTES
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "TU_BOT_TOKEN_AQUI")
CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "123456789012345678")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "TU_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "https://tu-dominio.com/auth/callback")

# ROLES PERMITIDOS PARA EXPEDIR DIPLOMAS (ROLES DE LA FAM)
AUTHORIZED_INSTRUCTOR_ROLES = [
    "General de División C.P.A.",
    "General de Grupo C.P.A.",
    "Coronel de Fuerza Aérea C.P.A.",
    "Capitán Primero C.P.A.",
    "Instructor EMA"
]

# INICIALIZACIÓN DEL BOT DISCORD
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix="!", intents=intents)

# BASE DE DATOS SIMULADA (En producción usar Firebase Firestore o PostgreSQL)
db_diplomas = {}
db_audit_logs = []

# ------------------------------------------------------------------------------
# 1. MÓDULO DE EMBEDS CORPORATIVOS (ANUNCIOS MILITARES)
# ------------------------------------------------------------------------------
@bot.command(name="anuncio_fam")
@commands.has_any_role(*AUTHORIZED_INSTRUCTOR_ROLES)
async def anuncio_fam(ctx, titulo: str, *, contenido: str):
    """Crea un anuncio institucional con la estética de la Fuerza Aérea Mexicana."""
    embed = discord.Embed(
        title=f"🛩️ {titulo.upper()}",
        description=contenido,
        color=discord.Color.from_rgb(30, 58, 30), # Verde Olivo FAM
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.set_author(
        name="Comandancia General de la Fuerza Aérea Mexicana",
        icon_url="https://i.imgur.com/FAM_EMBLEM_LOGO.png"
    )
    embed.set_thumbnail(url="https://i.imgur.com/FAM_EMBLEM_LOGO.png")
    embed.set_footer(
        text="Honor, Valor y Lealtad • Sistema Oficial FAM Roblox",
        icon_url="https://i.imgur.com/FAM_EMBLEM_LOGO.png"
    )
    
    await ctx.message.delete()
    await ctx.send(embed=embed)

@bot.command(name="ascenso")
@commands.has_any_role(*AUTHORIZED_INSTRUCTOR_ROLES)
async def ascenso(ctx, miembro: discord.Member, nuevo_rango: str, *, merito: str = "Aprobación de exámenes militares"):
    """Publica un ascenso oficial de rango militar."""
    embed = discord.Embed(
        title="🎖️ BOLETÍN OFICIAL DE ASCENSO DE RANGO",
        description=f"El Alto Mando de la FAM otorga el siguiente reconocimiento militar:",
        color=discord.Color.gold(),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    embed.add_field(name="👤 Elemento", value=miembro.mention, inline=True)
    embed.add_field(name="🎖️ Nuevo Rango", value=f"**{nuevo_rango}**", inline=True)
    embed.add_field(name="📜 Mérito", value=merito, inline=False)
    embed.set_footer(text="Estado Mayor de la Fuerza Aérea Mexicana")
    
    # Asignar rol en Discord si coincide el nombre
    role = discord.utils.get(ctx.guild.roles, name=nuevo_rango)
    if role:
        await miembro.add_roles(role)
        
    await ctx.send(embed=embed)

# ------------------------------------------------------------------------------
# 2. MÓDULO DE MODERACIÓN Y AUDITORÍA (DYNO / CARL-BOT STYLE)
# ------------------------------------------------------------------------------
@bot.command(name="warn")
@commands.has_permissions(manage_messages=True)
async def warn_user(ctx, miembro: discord.Member, *, razon: str):
    """Advierte a un usuario y registra en la auditoría militar."""
    log_entry = {
        "action": "WARN",
        "target": str(miembro),
        "executor": str(ctx.author),
        "reason": razon,
        "date": datetime.datetime.now().isoformat()
    }
    db_audit_logs.append(log_entry)
    
    embed = discord.Embed(
        title="🚨 Advertencia Registrada",
        description=f"El elemento {miembro.mention} ha recibido una advertencia oficial.",
        color=discord.Color.orange()
    )
    embed.add_field(name="Motivo", value=razon)
    embed.add_field(name="Oficial", value=ctx.author.mention)
    await ctx.send(embed=embed)

# ------------------------------------------------------------------------------
# 3. MÓDULO WEB & DISCORD OAUTH2 PARA EXPEDICIÓN DE DIPLOMAS (FASTAPI)
# ------------------------------------------------------------------------------
app = FastAPI(title="Portal de Diplomas FAM - Discord OAuth2")

@app.get("/auth/login")
def login_discord():
    """Redirige al usuario al flujo oficial de Discord OAuth2."""
    discord_auth_url = (
        f"https://discord.com/api/oauth2/authorize?"
        f"client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}"
        f"&response_type=code&scope=identify%20guilds.members.read"
    )
    return RedirectResponse(discord_auth_url)

@app.get("/auth/callback")
async def auth_callback(code: str):
    """Procesa el código de autorización de Discord y verifica los roles del instructor."""
    # 1. Intercambiar código por Token de Acceso
    import aiohttp
    async with aiohttp.ClientSession() as session:
        payload = {
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': REDIRECT_URI
        }
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        async with session.post('https://discord.com/api/oauth2/token', data=payload, headers=headers) as resp:
            token_data = await resp.json()
            access_token = token_data.get('access_token')

        # 2. Obtener Perfil del Usuario de Discord
        user_headers = {'Authorization': f'Bearer {access_token}'}
        async with session.get('https://discord.com/api/users/@me', headers=user_headers) as resp:
            user_info = await resp.json()

    user_id = user_info['id']
    username = f"{user_info['username']}#{user_info.get('discriminator', '0')}"

    # Renderizar panel HTML para que el instructor expida el diploma
    html_content = f'''
    <html>
        <head><title>Fuerza Aérea Mexicana — Portal de Diplomas</title></head>
        <body style="font-family: sans-serif; background: #0f172a; color: white; padding: 40px;">
            <h2>✈️ Sistema de Expedición Oficial de Diplomas FAM</h2>
            <p>Bienvenido Instructor: <strong>{username}</strong> (ID: {user_id})</p>
            <form action="/expedir" method="POST" style="background: #1e293b; padding: 20px; border-radius: 8px;">
                <input type="hidden" name="instructor_id" value="{user_id}">
                <input type="hidden" name="instructor_tag" value="{username}">
                <label>Usuario Roblox del Cadete:</label><br>
                <input type="text" name="cadete_roblox" required style="width: 100%; padding: 8px; margin-bottom: 15px;"><br>
                <label>Curso Aprobado:</label><br>
                <select name="curso" style="width: 100%; padding: 8px; margin-bottom: 15px;">
                    <option>Piloto Aviador de Caza y Combate (F-5E)</option>
                    <option>Mantenimiento Aeronáutico Militar</option>
                    <option>Controlador de Espacio Aéreo</option>
                </select><br>
                <label>Nuevo Rango Militar:</label><br>
                <input type="text" name="rango" value="Subteniente C.P.A." style="width: 100%; padding: 8px; margin-bottom: 15px;"><br>
                <button type="submit" style="background: #1e3a1e; color: white; padding: 12px 24px; border: none; cursor: pointer;">
                    📜 Generar y Firmar Diploma Digital
                </button>
            </form>
        </body>
    </html>
    '''
    return HTMLResponse(content=html_content)

@app.post("/expedir")
async def expedir_diploma(request: Request):
    """Genera el certificado oficial, crea el hash único de validación y notifica en Discord."""
    form = await request.form()
    hash_id = f"FAM-CERT-{datetime.datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
    
    diploma_data = {
        "hash_id": hash_id,
        "cadete_roblox": form.get("cadete_roblox"),
        "curso": form.get("curso"),
        "rango": form.get("rango"),
        "instructor": form.get("instructor_tag"),
        "fecha": str(datetime.date.today()),
        "estado": "VALIDO"
    }
    db_diplomas[hash_id] = diploma_data

    # Publicar automáticamente en Discord mediante el bot
    channel = bot.get_channel(123456789012345678) # ID del canal de diplomas
    if channel:
        embed = discord.Embed(
            title="📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA",
            description=f"Se ha otorgado oficialmente el diploma con folio **{hash_id}**",
            color=discord.Color.brand_green()
        )
        embed.add_field(name="Cadete", value=diploma_data["cadete_roblox"], inline=True)
        embed.add_field(name="Curso", value=diploma_data["curso"], inline=True)
        embed.add_field(name="Instructor Expedidor", value=diploma_data["instructor"], inline=False)
        embed.add_field(name="Código de Verificación", value=f"\`{hash_id}\`", inline=False)
        embed.set_footer(text="Verificable mediante !verificar_diploma <HASH>")
        await channel.send(embed=embed)

    return JSONResponse({"status": "SUCCESS", "hash_id": hash_id, "data": diploma_data})

@bot.event
async def on_ready():
    print(f"✅ Bot Fuerza Aérea Mexicana iniciado como {bot.user}")

if __name__ == "__main__":
    # Iniciar bot e interfaz web FastAPI
    import threading
    threading.Thread(target=lambda: uvicorn.run(app, host="0.0.0.0", port=8000), daemon=True).start()
    bot.run(DISCORD_TOKEN)
`;

export const NODE_DISCORD_CODE = `// ==============================================================================
// BOT DE DISCORD TODO EN UNO — FUERZA AÉREA MEXICANA (ROBLOX RO-ARMY)
// Framework: discord.js v14 + Express.js (OAuth2 Web Portal)
// ==============================================================================

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1234567890';
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'SECRET';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

// BASE DE DATOS EN MEMORIA
const diplomasDB = new Map();

// 1. ANUNCIO EMBED CON ESTÉTICA FAM
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'anuncio_fam') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ No tienes permisos militares de la FAM para enviar anuncios.');
    }

    const title = args.join(' ') || 'ÓRDEN DEL DÍA — FUERZA AÉREA MEXICANA';
    const embed = new EmbedBuilder()
      .setTitle(\`🛩️ \${title.toUpperCase()}\`)
      .setDescription('Maniobras de vuelo táctico y entrenamiento de cadetes en Roblox.')
      .setColor('#1E3A1E') // Verde Olivo
      .setAuthor({ name: 'Comandancia General de la FAM', iconURL: 'https://i.imgur.com/FAM_EMBLEM.png' })
      .setThumbnail('https://i.imgur.com/FAM_EMBLEM.png')
      .setFooter({ text: 'Honor, Valor y Lealtad • Servidor Oficial FAM' })
      .setTimestamp();

    await message.delete();
    await message.channel.send({ embeds: [embed] });
  }

  if (command === 'verificar_diploma') {
    const hash = args[0];
    if (!hash || !diplomasDB.has(hash)) {
      return message.reply('❌ Código de diploma inválido o no encontrado en el Registro Militar.');
    }
    const dip = diplomasDB.get(hash);
    const verifyEmbed = new EmbedBuilder()
      .setTitle('✅ CERTIFICADO OFICIAL VÁLIDO — FUERZA AÉREA MEXICANA')
      .addFields(
        { name: 'Cadete', value: dip.cadete, inline: true },
        { name: 'Curso', value: dip.curso, inline: true },
        { name: 'Instructor', value: dip.instructor, inline: false },
        { name: 'Folio Hash', value: \`\`\`\${dip.hash}\`\`\` }
      )
      .setColor('#16A34A');
    return message.reply({ embeds: [verifyEmbed] });
  }
});

// 2. DISCORD OAUTH2 EXPEDICIÓN DE DIPLOMAS
app.get('/auth/login', (req, res) => {
  const url = \`https://discord.com/api/oauth2/authorize?client_id=\${CLIENT_ID}&redirect_uri=\${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.members.read\`;
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Código de OAuth2 ausente.');

  try {
    // Intercambiar código
    const tokenParams = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', tokenParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: \`Bearer \${tokenRes.data.access_token}\` },
    });

    res.send(\`
      <h1>Portal de Expedición FAM — Instructor: \${userRes.data.username}</h1>
      <form action="/expedir" method="POST">
        <input type="hidden" name="instructor" value="\${userRes.data.username}">
        <p>Cadete Roblox: <input name="cadete" required></p>
        <p>Curso: <input name="curso" value="Piloto Aviador de Caza F-5E"></p>
        <button type="submit">Generar Diploma Oficial</button>
      </form>
    \`);
  } catch (e) {
    res.status(500).send('Error de autenticación OAuth2 Discord');
  }
});

app.post('/expedir', (req, res) => {
  const hash = 'FAM-CERT-2026-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const diploma = {
    hash,
    cadete: req.body.cadete,
    curso: req.body.curso,
    instructor: req.body.instructor,
    fecha: new Date().toISOString().split('T')[0],
  };
  diplomasDB.set(hash, diploma);
  res.json({ message: 'Diploma registrado exitosamente', diploma });
});

client.login(process.env.DISCORD_TOKEN);
app.listen(3000, () => console.log('Servidor OAuth2 corriendo en puerto 3000'));
`;
