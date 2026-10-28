import React, { useEffect, useState } from 'react';
import { ASSETS } from '../data/mockData';
import { Lock, LogIn, CheckCircle2, Server, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { UserSession } from '../types';

interface AuthGateProps {
  onLoginClick: () => void;
  onSessionAuthenticated?: (user: UserSession) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginClick, onSessionAuthenticated }) => {
  const [envStatus, setEnvStatus] = useState<any>(null);
  const [authUrl, setAuthUrl] = useState<string>('');
  const [isWaitingAuth, setIsWaitingAuth] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Cargar estado de variables y generar URL de autenticación
  useEffect(() => {
    fetch('/api/config/env-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEnvStatus(data.environment);
        }
      })
      .catch(() => {});

    fetch('/api/auth/url')
      .then((res) => res.json())
      .then((data) => {
        if (data.url) {
          setAuthUrl(data.url);
        }
      })
      .catch(() => {});
  }, []);

  // Polling automático mientras está en espera de autorización
  useEffect(() => {
    if (!isWaitingAuth) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          clearInterval(interval);
          if (onSessionAuthenticated) {
            onSessionAuthenticated(data.user);
          } else {
            window.location.reload();
          }
        }
      } catch (_) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [isWaitingAuth, onSessionAuthenticated]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        if (onSessionAuthenticated) {
          onSessionAuthenticated(data.user);
        } else {
          window.location.reload();
        }
      } else {
        alert('Aún no se detecta la sesión. Asegúrate de presionar "Autorizar" en Discord.');
      }
    } catch (_) {
      alert('Error al verificar sesión.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background Jet Graphic */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img src={ASSETS.famBaseHero} alt="Fuerza Aérea Mexicana" className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 max-w-xl w-full bg-slate-900 border border-emerald-900/60 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-6 border-b border-emerald-900/60 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-emerald-500/80 p-1 mx-auto shadow-lg flex items-center justify-center">
            <img src={ASSETS.famEmblem} alt="Escudo FAM" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800">
              ACCESO RESTRINGIDO • AUTENTICACIÓN DISCORD OAUTH2
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-2">
              Fuerza Aérea Mexicana
            </h1>
            <p className="text-xs text-slate-300 tracking-wide font-medium">
              Portal Oficial de Expedición y Consulta de Diplomas Militares
            </p>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Autenticación Obligatoria con Discord OAuth2</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Por políticas de seguridad y control disciplinario, ningún usuario puede consultar o expedir documentos sin autenticarse formalmente mediante las credenciales y roles oficiales de **Discord**.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Membresía Servidor FAM</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Rol Oficial Instructor</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Tokens JWT HttpOnly</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bot FAM Sincronizado</span>
              </div>
            </div>
          </div>

          {/* Botón Principal de Inicio de Sesión (Enlace Directo sin bloqueo de popups) */}
          <div className="space-y-3">
            <a
              href={authUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setIsWaitingAuth(true);
                if (!authUrl) onLoginClick();
              }}
              className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] transition-all shadow-lg flex items-center justify-center gap-2 group cursor-pointer text-center no-underline"
            >
              <LogIn className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Iniciar Sesión con Discord OAuth2</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            {isWaitingAuth && (
              <div className="p-3 bg-slate-950 border border-emerald-900/60 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Esperando autorización en la pestaña de Discord...</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Autoriza la aplicación en la pestaña que se abrió. Una vez completado, este portal detectará tu sesión automáticamente.
                </p>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isChecking}
                  className="w-full mt-1 py-2 px-3 text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isChecking ? 'Verificando...' : 'Ya autoricé en Discord — Ingresar Ahora'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Environment Variables Production Status */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Server className="w-3.5 h-3.5 text-emerald-400" /> Diagnóstico Oficial de Credenciales
              </span>
              <span className="text-emerald-400 font-bold">FAM Producción</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div>
                <span className="text-slate-500">CLIENT_ID:</span>{' '}
                <span className="text-emerald-300 font-bold">
                  {envStatus?.CLIENT_ID_DISPLAY || '1539391208411889676'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">CLIENT_SECRET:</span>{' '}
                <span className="text-slate-200">
                  {envStatus?.DISCORD_CLIENT_SECRET_CONFIGURED ? '✅ Configurado' : 'Predeterminado'}
                </span>
              </div>
              <div className="sm:col-span-2 overflow-hidden text-ellipsis">
                <span className="text-slate-500">REDIRECT_URI:</span>{' '}
                <span className="text-emerald-400 break-all">
                  {envStatus?.REDIRECT_URI || 'https://ais-pre-tdidzq3x6qh7ek5k775onk-824715890255.us-east1.run.app/auth/callback'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">FAM_GUILD:</span>{' '}
                <span className="text-slate-200">
                  {envStatus?.FAM_GUILD_ID || '1322384520288276540'} (FAM)
                </span>
              </div>
              <div>
                <span className="text-slate-500">BOT_FAM:</span>{' '}
                <span className="text-emerald-400">
                  {envStatus?.DISCORD_BOT_TOKEN_CONFIGURED ? '✅ Activo en Servidor' : 'Sin Token'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
          ESTADO MAYOR • FUERZA AÉREA MEXICANA • PROTOCOLO SEGURO TLS/JWT
        </div>

      </div>

    </div>
  );
};
