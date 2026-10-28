import React, { useState, useEffect } from 'react';
import { DiplomaRecord, UserSession } from '../types';
import { ASSETS, INITIAL_DIPLOMAS } from '../data/mockData';
import { DiplomaCertificateModal } from './DiplomaCertificateModal';
import { subscribeDiplomas, seedInitialDiplomas, verifyDiplomaInFirestore } from '../lib/firebase';
import { Search, ShieldCheck, Award, LogIn, CheckCircle2, AlertTriangle, ExternalLink, Globe, Sparkles, Lock, Database } from 'lucide-react';

interface PublicLandingProps {
  userSession: UserSession | null;
  onLoginClick: () => void;
  onGoToPrivatePanel: () => void;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({
  userSession,
  onLoginClick,
  onGoToPrivatePanel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DiplomaRecord | null | 'NOT_FOUND'>(null);
  const [selectedModalDiploma, setSelectedModalDiploma] = useState<DiplomaRecord | null>(null);

  // Real-time Firestore Public Diplomas
  const [featuredDiplomas, setFeaturedDiplomas] = useState<DiplomaRecord[]>(INITIAL_DIPLOMAS);
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);

  useEffect(() => {
    // 1. Initial seed check
    seedInitialDiplomas(INITIAL_DIPLOMAS).catch(() => {});

    // 2. Real-time Firestore subscription
    const unsubscribe = subscribeDiplomas(
      (diplomas) => {
        if (diplomas && diplomas.length > 0) {
          setFeaturedDiplomas(diplomas);
        }
        setIsFirestoreLive(true);
      },
      (error) => {
        console.warn('Fallback a API local de diplomas:', error);
        // Fallback to Express backend if needed
        fetch('/api/diplomas/list')
          .then((res) => res.json())
          .then((data) => {
            if (data.diplomas) setFeaturedDiplomas(data.diplomas);
          })
          .catch(() => {});
      }
    );

    return () => unsubscribe();
  }, []);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      // Intentar validación directa en Firestore
      const firestoreRes = await verifyDiplomaInFirestore(
        cleanQuery,
        userSession ? userSession.username : 'Efectivo Militar Anónimo'
      );

      if (firestoreRes.found && firestoreRes.diploma) {
        setSearchResult(firestoreRes.diploma);
        setIsSearching(false);
        return;
      }

      // Fallback a API de servidor
      const res = await fetch(`/api/diplomas/verify/${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();
      if (res.ok && data.found) {
        setSearchResult(data.diploma);
      } else {
        setSearchResult('NOT_FOUND');
      }
    } catch (err) {
      setSearchResult('NOT_FOUND');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-10">
      
      {/* Hero Banner Section */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none w-1/2">
          <img src={ASSETS.famBaseHero} alt="FAM Hero Jet" className="w-full h-full object-cover object-center" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-widest uppercase">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Módulo de Consulta & Registro Oficial de Efectivos FAM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Fuerza Aérea Mexicana <br />
            <span className="text-emerald-400 font-serif">Registro Oficial de Diplomas Roblox</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Plataforma militar centralizada para consulta y certificación de licencias de vuelo de combate, honores y especialidades emitidas mediante firma digital criptográfica con **Discord OAuth2**.
          </p>

          {/* User Status Bar in Hero */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {userSession && userSession.isInstructor ? (
              <button
                onClick={onGoToPrivatePanel}
                className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-md flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Acceder a la Sección Privada (Oficial Instructor)</span>
              </button>
            ) : (
              <div className="bg-emerald-950/60 border border-emerald-700/80 px-4 py-2 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Efectivo Militar Activo: <strong>{userSession?.username}</strong> — Consulta y Verificación Oficial</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECTION A: DETAILED PROFILE & ROLE BLOCK (FOR NON-INSTRUCTORS) */}
      {userSession && !userSession.isInstructor && (
        <div className="max-w-7xl mx-auto bg-slate-900 border border-amber-900/50 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-950 border-2 border-amber-500/80 flex items-center justify-center font-bold text-lg text-white shadow-inner shrink-0">
                {userSession.username.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold">
                  EFECTIVO FAM AUTENTICADO
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{userSession.username}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    ID: {userSession.id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Rango Detectado: <strong className="text-slate-200">{userSession.instructorRank || 'Cadete Aviador'}</strong> · Servidor FAM: <span className="text-emerald-400">Verificado</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-950/80 border border-amber-700/60 rounded-xl px-4 py-2.5 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Privilegios Militares de Expedición Restringidos</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-tight">
                No cuentas con el rol de <code className="bg-amber-900/60 px-1 rounded text-white font-mono">INSTRUCTOR_ROLE_ID</code> para expedir certificados nuevos. Tienes autorización para consultar y validar registros militares oficiales.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Military Search Module */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Search Engine Card */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Buscador Militar de Certificados de Vuelo FAM
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Consulta autorizada mediante sesión militar. Ingresa el código Hash único del certificado (ej. <code className="text-emerald-300 font-mono">FAM-CERT-2026-9A81B</code>).
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ingresa folio FAM-CERT-2026-XXXXX"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shrink-0 flex items-center gap-2"
              >
                {isSearching ? <span>Buscando...</span> : <span>Verificar Folio</span>}
              </button>
            </div>

            {/* Quick Test Chips */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Probar Folios Ejemplo:</span>
              <button
                type="button"
                onClick={() => setSearchQuery('FAM-CERT-2026-9A81B')}
                className="text-emerald-400 hover:underline font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
              >
                FAM-CERT-2026-9A81B
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('FAM-CERT-2026-4C72D')}
                className="text-emerald-400 hover:underline font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
              >
                FAM-CERT-2026-4C72D
              </button>
            </div>
          </form>

          {/* Search Result Display */}
          {searchResult === 'NOT_FOUND' && (
            <div className="bg-red-950/40 border border-red-800 rounded-xl p-5 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
              <h3 className="text-sm font-bold text-red-300">Folio Inexistente o Inválido</h3>
              <p className="text-xs text-red-200/80">
                El código ingresado no concuerda con ningún certificado oficial en los archivos de la Fuerza Aérea Mexicana.
              </p>
            </div>
          )}

          {searchResult && searchResult !== 'NOT_FOUND' && (
            <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" /> CERTIFICADO OFICIAL VÁLIDO EN LA FAM
                </div>
                <button
                  onClick={() => setSelectedModalDiploma(searchResult)}
                  className="px-3 py-1 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
                >
                  Ver Certificado Imprimible
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Cadete Roblox</span>
                  <span className="font-bold text-white text-sm">{searchResult.cadetRoblox}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Rango Militar</span>
                  <span className="font-bold text-emerald-300">{searchResult.rank}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Especialidad / Curso</span>
                  <span className="text-slate-200">{searchResult.course}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Oficial Instructor</span>
                  <span className="text-slate-200">{searchResult.instructorName}</span>
                </div>
              </div>

              {searchResult.notes && (
                <div className="bg-slate-950/60 p-3 rounded-lg text-xs italic text-slate-300 border border-slate-800">
                  "{searchResult.notes}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Public Diploma Recent Feed */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Últimas Licencias de Vuelo Emitidas
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 font-mono mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Firestore Cloud Sync: {isFirestoreLive ? 'En vivo' : 'Conectando...'}</span>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
              {featuredDiplomas.length} Registros
            </span>
          </div>

          <div className="space-y-3">
            {featuredDiplomas.map((dip) => (
              <div
                key={dip.id}
                onClick={() => setSelectedModalDiploma(dip)}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-600 rounded-xl p-4 cursor-pointer transition-all space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {dip.cadetRoblox}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {dip.id}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-1">{dip.course}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>Rango: {dip.rank}</span>
                  <span>{dip.issueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Diploma Certificate Viewer Modal */}
      <DiplomaCertificateModal
        diploma={selectedModalDiploma}
        onClose={() => setSelectedModalDiploma(null)}
      />

    </div>
  );
};
