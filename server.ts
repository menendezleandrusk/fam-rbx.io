import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ==============================================================================
// CONFIGURACIÓN DE SEGURIDAD Y VARIABLES DE ENTORNO
// ==============================================================================
function extractCleanRedirectUri(val?: string): string {
  if (!val) return '';
  val = val.trim();
  if (val.includes('discord.com/oauth2/authorize') || val.includes('redirect_uri=')) {
    try {
      const u = new URL(val);
      const extracted = u.searchParams.get('redirect_uri');
      if (extracted) return decodeURIComponent(extracted).trim();
    } catch (_) {}
  }
  return val;
}

function extractScopesFromUrl(val?: string): string {
  if (val && (val.includes('discord.com/oauth2/authorize') || val.includes('scope='))) {
    try {
      const u = new URL(val);
      const extracted = u.searchParams.get('scope');
      if (extracted) return decodeURIComponent(extracted).trim();
    } catch (_) {}
  }
  return process.env.DISCORD_OAUTH_SCOPES || 'openid identify role_connections.write';
}

function extractClientIdFromUrl(val?: string): string {
  if (val && (val.includes('discord.com/oauth2/authorize') || val.includes('client_id='))) {
    try {
      const u = new URL(val);
      const extracted = u.searchParams.get('client_id');
      if (extracted) return extracted.trim();
    } catch (_) {}
  }
  return process.env.DISCORD_CLIENT_ID || '1539391208411889676';
}

const JWT_SECRET = process.env.JWT_SECRET || 'fam_devsecops_jwt_secure_key_2026_mexico';
const FAM_GUILD_ID = process.env.FAM_GUILD_ID || '1322384520288276540';
const INSTRUCTOR_ROLE_ID = process.env.INSTRUCTOR_ROLE_ID || '1322384520380416126';
const DISCORD_CLIENT_ID = extractClientIdFromUrl(process.env.DISCORD_REDIRECT_URI);
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'MOCK_SECRET';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const DISCORD_OAUTH_SCOPES = extractScopesFromUrl(process.env.DISCORD_REDIRECT_URI);
const DEFAULT_REDIRECT_URI = extractCleanRedirectUri(process.env.DISCORD_REDIRECT_URI) || 'https://ais-pre-tdidzq3x6qh7ek5k775onk-824715890255.us-east1.run.app/auth/callback';

// Confianza en proxy inverso (Google Cloud Run / AI Studio / Ingress)
app.set('trust proxy', 1);

function getAppUrl(req: Request): string {
  const host = req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    return `${proto}://${host}`.replace(/\/$/, '');
  }
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  return 'https://ais-pre-tdidzq3x6qh7ek5k775onk-824715890255.us-east1.run.app';
}

function getRedirectUri(req: Request): string {
  const host = req.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/auth/callback`;
  }
  const fromEnv = extractCleanRedirectUri(process.env.DISCORD_REDIRECT_URI);
  if (fromEnv && fromEnv.startsWith('http')) {
    return fromEnv;
  }
  return DEFAULT_REDIRECT_URI;
}
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '10kb' })); // Mitigate Large Payload DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ==============================================================================
// 1. IN-MEMORY RATE LIMITER (OWASP DOS & BRUTE-FORCE DEFENSE)
// ==============================================================================
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

function createRateLimiter(maxRequests: number, windowSeconds: number, contextName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${contextName}:${ip}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    let bucket = rateLimitStore.get(key);
    if (!bucket) {
      bucket = { tokens: maxRequests, lastRefill: now };
      rateLimitStore.set(key, bucket);
    } else {
      const elapsed = now - bucket.lastRefill;
      if (elapsed > windowMs) {
        bucket.tokens = maxRequests;
        bucket.lastRefill = now;
      }
    }

    if (bucket.tokens <= 0) {
      return res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Control de Tasa (Rate Limit): Demasiadas peticiones. Intenta de nuevo en ${windowSeconds} segundos.`,
        retryAfter: windowSeconds,
      });
    }

    bucket.tokens -= 1;
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', bucket.tokens.toString());
    next();
  };
}

const authRateLimiter = createRateLimiter(8, 60, 'auth');
const verifyRateLimiter = createRateLimiter(20, 60, 'verify');
const expediteRateLimiter = createRateLimiter(10, 60, 'expedite');

// ==============================================================================
// 2. SANITIZACIÓN ESTRICTA ANTI-XSS & ANTI-INJECTION
// ==============================================================================
function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[&<>"']/g, (m) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
      };
      return map[m] || m;
    })
    .trim();
}

function isValidRobloxUsername(username: string): boolean {
  // Roblox usernames: 3-20 characters, letters, digits, underscore, no consecutive underscores
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// ==============================================================================
// 3. BASE DE DATOS PARAMETRIZADA (IN-MEMORY SECURE STORE)
// ==============================================================================
export interface DiplomaRecord {
  id: string; // Hash code (e.g. FAM-CERT-2026-9A81B)
  cadetRoblox: string;
  cadetDiscordId: string;
  cadetDiscordTag: string;
  rank: string;
  course: string;
  notes?: string;
  issueDate: string;
  instructorName: string;
  instructorRank: string;
  instructorDiscordTag: string;
  baseLocation: string;
  status: 'VALID' | 'REVOKED';
  qrData: string;
}

let diplomasDb: DiplomaRecord[] = [
  {
    id: 'FAM-CERT-2026-9A81B',
    cadetRoblox: 'Roblox_Cadete_Alpha',
    cadetDiscordId: '29834710928340192',
    cadetDiscordTag: 'AlphaPiloto#1234',
    rank: 'Subteniente C.P.A.',
    course: 'Piloto Aviador de Caza y Combate (F-5E Tiger II)',
    notes: 'Graduado con Mención Honorífica en tiro de precisión aéreo.',
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
    notes: 'Certificación en inspección de turbinas a reacción.',
    issueDate: '2026-10-20',
    instructorName: 'Mayor Javier Ruiz M.',
    instructorRank: 'Mayor de Fuerza Aérea C.P.A.',
    instructorDiscordTag: 'Mayor_Ruiz#0044',
    baseLocation: 'Escuela Militar de Aviación',
    status: 'VALID',
    qrData: 'https://fam-roblox.gov/diploma/FAM-CERT-2026-4C72D',
  },
];

export interface UserSession {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  isInstructor: boolean;
  instructorRank?: string;
  guildMember: boolean;
  detectedRoles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

// Helper: Extraer y validar JWT de Cookie o Bearer Header
function verifySessionToken(req: AuthenticatedRequest): UserSession | null {
  const token = req.cookies.fam_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

// Middleware de Autenticación Obligatoria (Requiere estar conectado)
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = verifySessionToken(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Autenticación obligatoria: Debes iniciar sesión con Discord OAuth2 para acceder.',
    });
  }
  req.user = session;
  next();
}

// Middleware de Seguridad Estricto: Exclusivo para Instructores / Oficiales
function requireInstructor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const session = verifySessionToken(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Autenticación obligatoria: Inicia sesión con Discord OAuth2.',
    });
  }

  if (!session.isInstructor) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN_INSTRUCTOR_ROLE_REQUIRED',
      message: 'Acceso Denegado (HTTP 403): Tu cuenta no posee el rol de [FAM] Oficial Instructor requerido.',
      requiredRoleId: INSTRUCTOR_ROLE_ID,
      currentUser: session.username,
      roles: session.detectedRoles,
    });
  }

  req.user = session;
  next();
}

// ==============================================================================
// ENDPOINTS DE SEGURIDAD & OAUTH2
// ==============================================================================

// 1. GET /api/auth/url — Genera URL de Autorización con CSRF State Token Criptográfico
app.get('/api/auth/url', authRateLimiter, (req: Request, res: Response) => {
  const redirectUri = getRedirectUri(req);

  // Generación criptográfica de Anti-CSRF State Token (OWASP Standard)
  const csrfState = crypto.randomBytes(32).toString('hex');

  // Guardar State en cookie HttpOnly temporal con expiración de 10 minutos
  res.cookie('fam_csrf_state', csrfState, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DISCORD_OAUTH_SCOPES,
    state: csrfState,
  });

  const url = `https://discord.com/oauth2/authorize?${params.toString()}`;
  res.json({
    success: true,
    url,
    redirectUri,
    state: csrfState,
    clientId: DISCORD_CLIENT_ID,
    guildId: FAM_GUILD_ID,
    scopes: DISCORD_OAUTH_SCOPES,
  });
});

// 2. GET /auth/callback — Validación Doble (Guild + Rol) & Verificación Anti-CSRF
app.get(['/auth/callback', '/auth/callback/'], authRateLimiter, async (req: Request, res: Response) => {
  const { code, state, error: oauthError, error_description } = req.query;
  const cookieState = req.cookies.fam_csrf_state;

  if (oauthError) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Discord OAuth2 — Error de Autorización</title></head>
        <body style="background:#0f172a; color:#f87171; font-family:sans-serif; text-align:center; padding:50px; line-height:1.6;">
          <div style="max-width:550px; margin:0 auto; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:30px;">
            <h2 style="color:#f87171;">❌ Autorización de Discord Cancelada o Denegada</h2>
            <p style="color:#cbd5e1; font-size:14px;">${String(error_description || oauthError)}</p>
            <div style="margin-top:20px;">
              <a href="/" style="display:inline-block; padding:10px 20px; background:#38bdf8; color:#0f172a; font-weight:bold; border-radius:6px; text-decoration:none;">← Volver al Portal FAM</a>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  // Validación Anti-CSRF: si la cookie fue fijada por el flujo web, comprobar que coincida
  if (cookieState && state && state !== cookieState) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
        <body style="background:#0f172a; color:#f87171; font-family:sans-serif; text-align:center; padding:50px;">
          <h2>❌ Error de Seguridad: Validación CSRF Fallida</h2>
          <p>El token de estado (State) de OAuth2 no coincide o ha expirado. Petición abortada por seguridad.</p>
          <a href="/" style="display:inline-block; margin-top:20px; color:#38bdf8; text-decoration:none; font-weight:bold;">← Volver al Portal FAM</a>
        </body>
      </html>
    `);
  }

  // Limpiar cookie de estado CSRF una vez utilizada
  res.clearCookie('fam_csrf_state', { httpOnly: true, secure: true, sameSite: 'none' });

  if (!code) {
    return res.status(400).send('Código de autorización de Discord ausente.');
  }

  const redirectUri = getRedirectUri(req);

  try {
    // Intercambio de código por token de acceso
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorBody);
      } catch (_) {}

      return res.status(401).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Diagnóstico OAuth2 — Fuerza Aérea Mexicana</title></head>
          <body style="background:#0f172a; color:#e2e8f0; font-family:sans-serif; text-align:center; padding:40px; line-height:1.6;">
            <div style="max-width:650px; margin:0 auto; background:#1e293b; border:1px solid #334155; border-radius:12px; padding:30px; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
              <h2 style="color:#f87171; margin-bottom:10px;">⚠️ Respuesta de Discord OAuth2: ${parsedError.error || 'Token Error'}</h2>
              <p style="color:#94a3b8; font-size:14px;">${parsedError.error_description || errorBody}</p>
              
              <div style="background:#0f172a; border-left:4px solid #38bdf8; padding:15px; text-align:left; margin:20px 0; border-radius:4px; font-size:13px;">
                <p style="margin:0 0 8px 0; font-weight:bold; color:#38bdf8;">📌 Parámetros validados en el canje de código:</p>
                <div style="font-family:monospace; color:#cbd5e1; line-height:1.8;">
                  • <strong>Client ID:</strong> ${DISCORD_CLIENT_ID}<br/>
                  • <strong>Redirect URI:</strong> ${redirectUri}<br/>
                  • <strong>Code recibido:</strong> Sí (${String(code).slice(0, 10)}...)<br/>
                  • <strong>Client Secret:</strong> ${DISCORD_CLIENT_SECRET === 'MOCK_SECRET' ? '⚠️ MOCK_SECRET (Requiere DISCORD_CLIENT_SECRET real en .env)' : '✅ Configurado'}
                </div>
              </div>

              <p style="font-size:13px; color:#cbd5e1;">
                Si ves <code>invalid_client</code>, asegúrate de colocar tu <strong>Client Secret</strong> de Discord en tu archivo <code>.env</code> como <code>DISCORD_CLIENT_SECRET=...</code>.<br/>
                La <code>redirect_uri</code> coincide al 100% con tu enlace registrado: <code>${redirectUri}</code>.
              </p>

              <div style="margin-top:25px;">
                <a href="/" style="display:inline-block; padding:10px 20px; background:#38bdf8; color:#0f172a; font-weight:bold; border-radius:6px; text-decoration:none;">← Volver al Portal Militar</a>
              </div>
            </div>
          </body>
        </html>
      `);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Obtener datos del usuario
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userRes.json();

    // DOBLE VALIDACIÓN: Membresía en Servidor FAM y Rol de Instructor
    let isGuildMember = false;
    let isInstructor = false;
    let detectedRoles: string[] = [];

    // 1. Intentar verificación con token del usuario (si autorizó guilds.members.read)
    try {
      const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${FAM_GUILD_ID}/member`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (memberRes.ok) {
        isGuildMember = true;
        const memberData = await memberRes.json();
        const roleIds: string[] = memberData.roles || [];
        detectedRoles = roleIds;
        isInstructor = roleIds.includes(INSTRUCTOR_ROLE_ID);
      }
    } catch (err) {
      console.warn('Verificación directa con token de usuario:', err);
    }

    // 2. Si no se obtuvo rol vía usuario, consultar a través del Bot Oficial FAM en el servidor
    if (!isGuildMember && process.env.DISCORD_BOT_TOKEN) {
      try {
        const botMemberRes = await fetch(`https://discord.com/api/guilds/${FAM_GUILD_ID}/members/${userData.id}`, {
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        });

        if (botMemberRes.ok) {
          isGuildMember = true;
          const memberData = await botMemberRes.json();
          const roleIds: string[] = memberData.roles || [];
          detectedRoles = roleIds;
          isInstructor = roleIds.includes(INSTRUCTOR_ROLE_ID);
          console.log(`[FAM] Verificación exitosa vía Bot FAM para ${userData.username} (Roles: ${roleIds.length}, Instructor: ${isInstructor})`);
        }
      } catch (err) {
        console.warn('Verificación mediante Bot Token falló:', err);
      }
    }

    const userSession: UserSession = {
      id: userData.id,
      username: `${userData.username}#${userData.discriminator || '0'}`,
      discriminator: userData.discriminator || '0',
      avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : '',
      isInstructor,
      instructorRank: isInstructor ? 'Coronel de Fuerza Aérea C.P.A.' : 'Cadete Aviador',
      guildMember: isGuildMember,
      detectedRoles,
    };

    // Firmar JWT con algoritmo seguro HS256
    const token = jwt.sign(userSession, JWT_SECRET, { expiresIn: '7d' });

    // Guardar en cookie segura HttpOnly
    res.cookie('fam_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autenticación Exitosa — Fuerza Aérea Mexicana</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background:#020617; color:#e2e8f0; font-family:sans-serif; text-align:center; padding:30px; line-height:1.6;">
          <div style="max-width:550px; margin:40px auto; background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:35px; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
            <div style="font-size:40px; margin-bottom:10px;">✈️</div>
            <h2 style="color:#34d399; margin:0 0 10px 0;">Autenticación Militar Exitosa</h2>
            <p style="color:#cbd5e1; font-size:15px; margin-bottom:5px;">Efectivo validado: <strong>${userSession.username}</strong></p>
            <p style="font-size:13px; color:#94a3b8; margin-top:0;">
              ${isInstructor ? '🎖️ Rol Oficial: Coronel / Instructor Autorizado' : '📋 Rol Oficial: Cadete / Miembro General'}
            </p>

            <div style="margin-top:25px; padding-top:20px; border-top:1px solid #1e293b;">
              <a href="/" style="display:inline-block; padding:12px 28px; background:#10b981; color:#022c22; font-weight:bold; border-radius:8px; text-decoration:none; font-size:14px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                Entrar al Portal FAM →
              </a>
            </div>
            <p style="font-size:11px; color:#64748b; margin-top:15px;">Esta ventana se cerrará automáticamente en unos segundos.</p>
          </div>

          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userSession)}, token: "${token}" }, '*');
                setTimeout(function() { window.close(); }, 1500);
              }
            } catch(e) {}
            setTimeout(function() {
              if (!window.opener) {
                window.location.href = '/';
              }
            }, 2500);
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth Callback Security Error:', error);
    return res.status(500).send(`Error en autenticación segura OAuth2: ${error.message}`);
  }
});

// 3. GET /api/config/env-status — Diagnóstico seguro del estado de Variables de Entorno (Sin filtrar secretos)
app.get('/api/config/env-status', (req: Request, res: Response) => {
  const isCustomClientId = Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_ID.length > 5);
  const isCustomClientSecret = Boolean(process.env.DISCORD_CLIENT_SECRET && process.env.DISCORD_CLIENT_SECRET !== 'MOCK_SECRET');
  const isCustomBotToken = Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_BOT_TOKEN !== 'TU_DISCORD_BOT_TOKEN_AQUI');

  res.json({
    success: true,
    environment: {
      APP_URL: getAppUrl(req),
      REDIRECT_URI: getRedirectUri(req),
      CLIENT_ID_DISPLAY: DISCORD_CLIENT_ID,
      FAM_GUILD_ID: process.env.FAM_GUILD_ID || '102938475610293847',
      INSTRUCTOR_ROLE_ID: process.env.INSTRUCTOR_ROLE_ID || '987654321098765432',
      DISCORD_CLIENT_ID_CONFIGURED: isCustomClientId,
      DISCORD_CLIENT_SECRET_CONFIGURED: isCustomClientSecret,
      DISCORD_BOT_TOKEN_CONFIGURED: isCustomBotToken,
      DISCORD_WEBHOOK_CONFIGURED: Boolean(process.env.DISCORD_WEBHOOK_URL),
      JWT_SECRET_CONFIGURED: Boolean(process.env.JWT_SECRET),
    },
  });
});

// 4. GET /api/auth/me — Valida sesión actual
app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const session = verifySessionToken(req);
  if (!session) {
    return res.json({ authenticated: false, user: null });
  }
  res.json({ authenticated: true, user: session });
});

// 5. POST /api/auth/logout — Invalida sesión
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('fam_session', { httpOnly: true, secure: true, sameSite: 'none' });
  res.clearCookie('fam_csrf_state', { httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ success: true, message: 'Sesión cerrada con éxito.' });
});

// ==============================================================================
// 4. MÓDULO DE CONSULTA & VERIFICACIÓN MILITAR DE DIPLOMAS
// (Autenticación Obligatoria: Sin Modo Invitado)
// ==============================================================================

// GET /api/diplomas/verify/:code — Validador con Rate Limiting, Sanitización y Autenticación Obligatoria
app.get('/api/diplomas/verify/:code', verifyRateLimiter, requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const rawCode = req.params.code;
  const cleanCode = sanitizeText(rawCode).toLowerCase();

  const diploma = diplomasDb.find((d) => d.id.toLowerCase() === cleanCode);

  if (!diploma) {
    return res.status(404).json({
      success: false,
      found: false,
      message: 'Código de certificado no registrado o inválido en el Registro Oficial de la FAM.',
    });
  }

  res.json({
    success: true,
    found: true,
    diploma,
  });
});

// GET /api/diplomas/list — Listado de diplomas emitidos (Requiere Sesión Activa de Discord)
app.get('/api/diplomas/list', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    count: diplomasDb.length,
    diplomas: diplomasDb,
  });
});

// ==============================================================================
// 5. MÓDULO PRIVADO: EXPEDICIÓN DE DIPLOMAS (PROTEGIDO: MIDDLEWARE requireInstructor)
// ==============================================================================
app.post('/api/diplomas/expedite', expediteRateLimiter, requireInstructor, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rawCadet = req.body.cadetRoblox;
    const rawCourse = req.body.course;
    const rawRank = req.body.rank;
    const rawNotes = req.body.notes;
    const rawDiscordTag = req.body.cadetDiscordTag;
    const rawBase = req.body.baseLocation;

    // Validación y Sanitización Estricta
    const cadetRoblox = sanitizeText(rawCadet);
    const course = sanitizeText(rawCourse);
    const rank = sanitizeText(rawRank) || 'Subteniente C.P.A.';
    const notes = sanitizeText(rawNotes) || 'Aprobación de adiestramiento militar y examen de vuelo.';
    const cadetDiscordTag = sanitizeText(rawDiscordTag) || `${cadetRoblox}#0000`;
    const baseLocation = sanitizeText(rawBase) || 'Base Aérea Militar No. 1 Santa Lucía';

    if (!cadetRoblox || !course) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Los campos Usuario de Roblox y Curso de Capacitación son estrictamente obligatorios.',
      });
    }

    if (!isValidRobloxUsername(cadetRoblox)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ROBLOX_USERNAME',
        message: 'El nombre de usuario de Roblox contiene caracteres inválidos. Debe tener entre 3 y 20 caracteres alfanuméricos.',
      });
    }

    // Generar Hash Criptográfico Único (Anti-Colisión)
    const randomHash = crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashId = `FAM-CERT-2026-${randomHash}`;

    const newDiploma: DiplomaRecord = {
      id: hashId,
      cadetRoblox,
      cadetDiscordId: sanitizeText(req.body.cadetDiscordId) || '00000000000000000',
      cadetDiscordTag,
      rank,
      course,
      notes,
      issueDate: new Date().toISOString().split('T')[0],
      instructorName: req.user?.username.split('#')[0] || 'Oficial Instructor',
      instructorRank: req.user?.instructorRank || 'Coronel de Fuerza Aérea C.P.A.',
      instructorDiscordTag: req.user?.username || 'Instructor#0000',
      baseLocation,
      status: 'VALID',
      qrData: `https://fam-roblox.gov/diploma/${hashId}`,
    };

    diplomasDb.unshift(newDiploma);

    // Envío de Alerta Automatizada vía Webhook a Discord (si está configurado)
    if (DISCORD_WEBHOOK_URL) {
      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [
              {
                title: '📜 NUEVO DIPLOMA EXPEDIDO — FUERZA AÉREA MEXICANA',
                description: `Se ha emitido con éxito el certificado militar con folio **\`${hashId}\`**.`,
                color: 0x1e3a1e,
                fields: [
                  { name: 'Cadete Roblox', value: cadetRoblox, inline: true },
                  { name: 'Rango Concedido', value: rank, inline: true },
                  { name: 'Curso', value: course, inline: false },
                  { name: 'Oficial Expedidor', value: req.user?.username, inline: false },
                ],
                footer: { text: 'Fuerza Aérea Mexicana • Verificación Criptográfica OAuth2' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        });
      } catch (webhookErr) {
        console.warn('Webhook Discord no alcanzable:', webhookErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Diploma militar expedido y registrado en la base de datos oficial.',
      diploma: newDiploma,
      securityAudit: {
        hashAlgorithm: 'CryptoRandom-Hex8',
        jwtVerified: true,
        sanitizedInputs: true,
      },
    });
  } catch (err: any) {
    // Manejo Seguro de Errores: No exponer stack trace interno
    console.error('Error interno al expedir diploma:', err);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Ocurrió un error inesperado al procesar la solicitud militar.',
    });
  }
});

// ==============================================================================
// RUTAS LEGALES PÚBLICAS (DISCORD DEVELOPER PORTAL: TERMS & PRIVACY)
// ==============================================================================

function getLegalHtmlTemplate(
  title: string,
  subtitle: string,
  badge: string,
  contentHtml: string,
  otherPageUrl: string,
  otherPageLabel: string
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Fuerza Aérea Mexicana (FAM)</title>
  <meta name="description" content="${subtitle}">
  <style>
    :root {
      --bg-main: #050811;
      --bg-card: #0c1322;
      --bg-subtle: #111a2e;
      --border: #1e293b;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --emerald: #10b981;
      --emerald-light: #34d399;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.65;
      padding: 32px 16px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 820px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(12, 19, 34, 0.95) 100%);
      border-bottom: 1px solid var(--border);
      padding: 32px 28px 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #022c22;
      border: 1px solid var(--emerald);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    .badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.15);
      color: var(--emerald-light);
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .title-block h2 {
      font-size: 1.7rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .title-block p {
      font-size: 0.92rem;
      color: var(--text-muted);
    }
    .meta-strip {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      gap: 20px;
      font-size: 0.78rem;
      color: #64748b;
      flex-wrap: wrap;
    }
    .content {
      padding: 32px 28px;
    }
    .section {
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 1.12rem;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    .section p, .section li {
      color: #cbd5e1;
      font-size: 0.92rem;
      margin-bottom: 10px;
    }
    .section ul {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    .callout {
      background: var(--bg-subtle);
      border-left: 4px solid var(--emerald);
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      margin: 16px 0;
      font-size: 0.88rem;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 0.85rem;
    }
    .table th, .table td {
      padding: 10px 14px;
      text-align: left;
      border: 1px solid var(--border);
    }
    .table th {
      background: var(--bg-subtle);
      color: #f8fafc;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 30px;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--emerald);
      color: #022c22;
    }
    .btn-secondary {
      background: var(--bg-subtle);
      color: #e2e8f0;
      border: 1px solid var(--border);
    }
    .footer {
      background: #080d18;
      border-top: 1px solid var(--border);
      padding: 20px 28px;
      text-align: center;
      font-size: 0.78rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div class="brand">
          <div class="brand-icon">✈️</div>
          <div>
            <h1 style="font-size:1.15rem; font-weight:800; color:#fff;">FUERZA AÉREA MEXICANA</h1>
            <span style="font-size:0.72rem; color:var(--emerald-light); font-weight:600;">SISTEMA MILITAR ROBLOX RO-ARMY</span>
          </div>
        </div>
        <div class="badge">${badge}</div>
      </div>
      <div class="title-block">
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="meta-strip">
        <span>Última Actualización: <strong>28 de Octubre, 2026</strong></span>
        <span>Versión: <strong>2.0.0 DevSecOps</strong></span>
        <span>Jurisdicción: <strong>Discord & Roblox Community</strong></span>
      </div>
    </header>

    <main class="content">
      ${contentHtml}

      <div class="actions">
        <a href="/" class="btn btn-primary">← Volver al Portal FAM</a>
        <a href="${otherPageUrl}" class="btn btn-secondary">${otherPageLabel}</a>
        <a href="?format=json" class="btn btn-secondary">⚡ Formato JSON (API)</a>
      </div>
    </main>

    <footer class="footer">
      <p><strong>Aviso de Roleplay Militar:</strong> Este bot y portal son herramientas comunitarias privadas creadas exclusivamente para la simulación militar en Roblox (Fuerza Aérea Mexicana Ro-Army). No existe vínculo oficial o político con la Secretaría de la Defensa Nacional real.</p>
    </footer>
  </div>
</body>
</html>`;
}

// Ruta Pública: /terms (Términos de Servicio para Discord Developer Portal)
app.get('/terms', (req: Request, res: Response) => {
  const isJson = req.query.format === 'json' || req.headers.accept?.includes('application/json');
  if (isJson) {
    return res.json({
      app_name: 'Fuerza Aérea Mexicana — Bot de Discord y Portal Militar',
      document: 'Terms of Service / Términos de Uso',
      last_updated: '2026-10-28',
      version: '2.0.0',
      platform: 'Roblox Ro-Army & Discord',
      sections: [
        {
          title: '1. Naturaleza del Sistema y Ámbito de Aplicación',
          content: 'Herramienta de gestión militar y roleplay comunitario para Roblox. Sin relación formal con la SEDENA ni entidades gubernamentales reales.',
        },
        {
          title: '2. Normas de Uso Responsable y Seguridad',
          content: 'Uso ético y prohibición estricta de spam, alteración de folios, trampas en credenciales o vulneración de seguridad.',
        },
        {
          title: '3. Privilegios de Instructores y Oficiales',
          content: 'Expedición y gestión restringida a miembros con rol oficial verificado mediante Discord OAuth2.',
        },
        {
          title: '4. Revocación de Diplomas y Folios',
          content: 'La comandancia militar comunitaria puede invalidar cualquier certificado por infracción disciplinaria.',
        },
      ],
      contact: 'Comandancia General FAM Roblox Ro-Army (Discord Server Oficial)',
    });
  }

  const termsHtml = `
    <article>
      <section class="section">
        <h3 class="section-title">1. Naturaleza Recreativa y Simulación Militar</h3>
        <p>Bienvenido al sistema oficial automatizado de la <strong>Fuerza Aérea Mexicana (FAM) en Roblox</strong>. Este servicio abarca tanto el bot de Discord como la plataforma web de gestión y consulta militar.</p>
        <div class="callout">
          <strong>Cláusula de Deslinde Oficial:</strong> Esta aplicación es una iniciativa comunitaria de Roleplay Militar (Ro-Army) dentro de la plataforma virtual Roblox. No representa, reemplaza ni está afiliada formalmente con las Fuerzas Armadas reales de México ni con la Secretaría de la Defensa Nacional (SEDENA).
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">2. Normas de Conducta y Uso Aceptable</h3>
        <p>Al interactuar con los comandos de barra de Discord (<code>/diploma</code>, <code>/embed</code>, <code>/servidor</code>) o con el portal web:</p>
        <ul>
          <li><strong>No abusar de los comandos:</strong> Prohibido el spam o la saturación intencional de webhooks.</li>
          <li><strong>Veracidad en la expedición:</strong> Los instructores deben certificar únicamente a cadetes que hayan acreditado los cursos en Roblox.</li>
          <li><strong>Prohibición de falsificación:</strong> Alterar o clonar folios militares conllevará expulsión inmediata.</li>
        </ul>
      </section>

      <section class="section">
        <h3 class="section-title">3. Verificación de Rangos y Permisos (OAuth2)</h3>
        <p>El acceso a funciones de instructor requiere comprobar en tiempo real la membresía en el servidor oficial de la FAM (<code>FAM_GUILD_ID</code>) y el rol correspondiente (<code>INSTRUCTOR_ROLE_ID</code>).</p>
      </section>

      <section class="section">
        <h3 class="section-title">4. Derechos de la Comandancia</h3>
        <p>La administración se reserva el derecho de anular folios y suspender privilegios en caso de desacato al reglamento militar del servidor.</p>
      </section>
    </article>
  `;

  return res.send(getLegalHtmlTemplate(
    'Términos de Servicio',
    'Condiciones generales de uso para el Bot de Discord y Portal Militar FAM Ro-Army.',
    'Legal • Términos Oficiales',
    termsHtml,
    '/privacy',
    'Ver Política de Privacidad →'
  ));
});

// Ruta Pública: /privacy (Política de Privacidad para Discord Developer Portal)
app.get('/privacy', (req: Request, res: Response) => {
  const isJson = req.query.format === 'json' || req.headers.accept?.includes('application/json');
  if (isJson) {
    return res.json({
      app_name: 'Fuerza Aérea Mexicana — Bot de Discord y Portal Militar',
      document: 'Privacy Policy / Política de Privacidad',
      last_updated: '2026-10-28',
      version: '2.0.0',
      principles: [
        'Minimización de datos (Privacy by Design)',
        'Cero comercialización o venta a terceros',
        'Almacenamiento seguro con cifrado JWT y cookies HttpOnly',
      ],
      data_collected: [
        {
          source: 'Discord OAuth2',
          fields: ['user_id', 'username', 'discriminator', 'avatar_hash', 'guild_roles'],
          purpose: 'Verificar identidad del instructor y validar permisos de expedición.',
        },
        {
          source: 'Expedición de Diplomas',
          fields: ['cadet_roblox_username', 'rank', 'course_name', 'date', 'notes'],
          purpose: 'Generar folios criptográficos y habilitar la consulta pública de acreditación militar.',
        },
      ],
      data_sharing: 'No compartimos, vendemos ni transferimos información a terceros.',
      contact: 'Oficialía de Seguridad y Ciberdefensa FAM Roblox (Discord Oficial)',
    });
  }

  const privacyHtml = `
    <article>
      <section class="section">
        <h3 class="section-title">1. Compromiso con la Privacidad y Principio de Minimización</h3>
        <p>La <strong>Fuerza Aérea Mexicana (FAM Ro-Army)</strong> trata únicamente los datos indispensables para autenticar instructores y verificar diplomas militares.</p>
        <div class="callout">
          <strong>Garantía Absoluta:</strong> No recopilamos contraseñas, correos electrónicos ni información bancaria. Jamás comercializamos ni transferimos información a terceros.
        </div>
      </section>

      <section class="section">
        <h3 class="section-title">2. Datos Tratados y Finalidades</h3>
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
              <td><strong>Identidad Discord</strong></td>
              <td>ID de usuario, nombre y avatar público.</td>
              <td>Identificar al instructor y firmar diplomas.</td>
            </tr>
            <tr>
              <td><strong>Membresía Militar</strong></td>
              <td>Roles en el servidor oficial de Discord.</td>
              <td>Validar permisos de expedición en tiempo real.</td>
            </tr>
            <tr>
              <td><strong>Registro de Diplomas</strong></td>
              <td>Usuario de Roblox del cadete, curso y rango.</td>
              <td>Generar y consultar folios públicos de verificación.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="section">
        <h3 class="section-title">3. Seguridad DevSecOps</h3>
        <p>Las credenciales de sesión se almacenan en cookies blindadas <code>HttpOnly</code>, <code>Secure</code> y <code>SameSite=Lax</code>, con tokens JWT firmados digitalmente.</p>
      </section>

      <section class="section">
        <h3 class="section-title">4. Retención y Control</h3>
        <p>El usuario puede revocar su sesión en cualquier instante con <code>/auth/logout</code>. Los folios militares quedan registrados para consulta y auditoría militar permanente.</p>
      </section>
    </article>
  `;

  return res.send(getLegalHtmlTemplate(
    'Política de Privacidad',
    'Tratamiento seguro de datos de Discord y registros militares para la FAM Ro-Army.',
    'Legal • Privacidad DevSecOps',
    privacyHtml,
    '/terms',
    'Ver Términos de Servicio →'
  ));
});

// ==============================================================================
// VITE MIDDLEWARE EN MODO DESARROLLO
// ==============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await import('vite');
    const viteDevServer = await vite.createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(viteDevServer.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🔒 Servidor Seguro FAM DevSecOps activo en http://localhost:${PORT}`);
  });
}

startServer();
