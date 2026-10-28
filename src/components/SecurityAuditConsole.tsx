import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertTriangle, Bug, Terminal, CheckCircle2, ShieldAlert, Zap, RefreshCw, Key } from 'lucide-react';

export const SecurityAuditConsole: React.FC = () => {
  const [xssInput, setXssInput] = useState("<script>alert('XSS_ATTACK')</script><b>Cadete_Roblox</b>");
  const [sanitizedOutput, setSanitizedOutput] = useState('');
  const [rateLimitCounter, setRateLimitCounter] = useState(0);
  const [rateLimitStatus, setRateLimitStatus] = useState<string | null>(null);

  const handleTestXss = () => {
    // Mirror server sanitization logic
    const cleaned = xssInput
      .replace(/<[^>]*>/g, '')
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
    setSanitizedOutput(cleaned);
  };

  const handleTestRateLimit = async () => {
    setRateLimitCounter((prev) => prev + 1);
    try {
      const res = await fetch(`/api/diplomas/verify/FAM-TEST-${Date.now()}`);
      if (res.status === 429) {
        const data = await res.json();
        setRateLimitStatus(`🚨 HTTP 429 RATE_LIMIT_EXCEEDED: ${data.message}`);
      } else {
        const remaining = res.headers.get('X-RateLimit-Remaining');
        setRateLimitStatus(`Petición permitida (Restantes en ventana: ${remaining || 'N/A'})`);
      }
    } catch (err) {
      setRateLimitStatus('Error de red');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>DevSecOps & Ciberseguridad Militar FAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Consola de Seguridad y Auditoría OWASP Top 10
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Monitoreo en tiempo real de los mecanismos de protección implementados en la arquitectura web de la Fuerza Aérea Mexicana.
          </p>
        </div>
      </div>

      {/* Security Defenses Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Defense 1: CSRF */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              OWASP A01:2021
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Protección Anti-CSRF
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Genera tokens criptográficos <code className="text-emerald-300 font-mono">crypto.randomBytes(32)</code> como parámetro <code className="text-emerald-300 font-mono">state</code> en Discord OAuth2 y los compara en el callback.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
            Cookie: fam_csrf_state (HttpOnly, Secure, 10m TTL)
          </div>
        </div>

        {/* Defense 2: XSS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              OWASP A03:2021
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Bug className="w-4 h-4 text-emerald-400" />
            Sanitización Anti-XSS
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Limpieza estricta de tags HTML peligrosos y escape de entidades en los campos de Roblox, especialidades y observaciones militares.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
            Sanitizer: Regex Strip + HTML Entity Encode
          </div>
        </div>

        {/* Defense 3: Rate Limiter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              OWASP A04:2021
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Control de Tasa (Rate Limit)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Algoritmo Token Bucket por IP que mitiga ataques de fuerza bruta al validador de diplomas y saturación en rutas de login.
          </p>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
            Límite: 20 req/min (Verify) | 8 req/min (Auth)
          </div>
        </div>

      </div>

      {/* Interactive Testing Sandbox */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Sandbox 1: XSS Neutralizer Test */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide border-b border-slate-800 pb-3">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Simulador de Sanitización Anti-XSS
          </h3>
          <p className="text-xs text-slate-400">
            Ingresa un payload malicioso para comprobar cómo el sanitizador neutraliza el contenido antes de guardarlo en la base de datos:
          </p>
          <div className="space-y-3">
            <textarea
              rows={2}
              value={xssInput}
              onChange={(e) => setXssInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleTestXss}
              className="px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              Ejecutar Sanitización
            </button>
            {sanitizedOutput && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase">Resultado Sanitizado y Seguro:</span>
                <span className="text-emerald-400">{sanitizedOutput}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sandbox 2: Rate Limiting Test */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide border-b border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            Prueba de Estrés Rate Limiting (DoS Defense)
          </h3>
          <p className="text-xs text-slate-400">
            Envía solicitudes consecutivas para verificar que el servidor responde con <code className="text-amber-400 font-mono">HTTP 429 Too Many Requests</code> al superar la tasa permitida:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTestRateLimit}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Enviar Petición #{rateLimitCounter + 1}</span>
              </button>
            </div>
            {rateLimitStatus && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                <span className={rateLimitStatus.includes('429') ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {rateLimitStatus}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
