import React from 'react';
import { TabType, UserSession } from '../types';
import { ASSETS } from '../data/mockData';
import { Shield, Sparkles, Terminal, FileCheck, Award, Lock, LogIn, LogOut, CheckCircle2, UserCheck, ShieldAlert, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  userSession: UserSession | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onOpenQuickVerify: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userSession,
  onLoginClick,
  onLogoutClick,
  onOpenQuickVerify,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode; requiresInstructor?: boolean }[] = [
    { id: 'public', label: 'Consulta & Registro Militar', icon: <Globe className="w-4 h-4" /> },
    { id: 'private', label: 'Sección B: Panel Instructores', icon: <Lock className="w-4 h-4" />, requiresInstructor: true },
    { id: 'security', label: 'Auditoría DevSecOps', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'embed', label: 'Embed Generator', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'moderation', label: 'Moderación & Logs', icon: <Shield className="w-4 h-4" /> },
    { id: 'simulator', label: 'Simulador Bot', icon: <Terminal className="w-4 h-4" /> },
    { id: 'code', label: 'Código & Docs', icon: <FileCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-emerald-900/40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        
        {/* Zone 1: Single text element wordmark + Military Crest */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-emerald-700/60 shadow-inner bg-slate-800 flex items-center justify-center shrink-0">
            <img 
              src={ASSETS.famEmblem} 
              alt="Escudo FAM" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <a 
              href="/" 
              onClick={(e) => { e.preventDefault(); setActiveTab('public'); }}
              className="text-base font-bold tracking-tight text-white hover:text-emerald-400 transition-colors whitespace-nowrap"
            >
              FUERZA AÉREA MEXICANA
            </a>
            <span className="text-[11px] text-emerald-400 font-medium tracking-wide whitespace-nowrap">
              PORTAL OFICIAL DIPLOMAS OAUTH2
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.requiresInstructor && (
                  <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded font-mono border border-amber-800/60">
                    OAUTH2
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: OAuth Session Controls */}
        <div className="flex items-center gap-3 shrink-0">

          <button
            onClick={onOpenQuickVerify}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
            title="Verificación Rápida de Folio Militar"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Verificar Folio</span>
          </button>

          {userSession ? (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-emerald-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {userSession.username.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-white leading-tight">{userSession.username.split('#')[0]}</span>
                <span className="text-[10px] text-emerald-400 font-mono leading-none">
                  {userSession.isInstructor ? 'Oficial Instructor' : 'Cadete / Efectivo FAM'}
                </span>
              </div>
              <button
                onClick={onLogoutClick}
                className="text-slate-400 hover:text-red-400 p-1 transition-colors ml-1"
                title="Cerrar Sesión OAuth2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Discord OAuth2</span>
            </button>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800 bg-slate-950 px-3 py-2 gap-2 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
