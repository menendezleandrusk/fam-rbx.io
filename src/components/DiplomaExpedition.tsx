import React, { useState } from 'react';
import { DiplomaRecord } from '../types';
import { INITIAL_DIPLOMAS, FAM_RANKS, SPECIALTY_COURSES, ASSETS } from '../data/mockData';
import { DiplomaCertificateModal } from './DiplomaCertificateModal';
import { Award, Lock, CheckCircle2, AlertTriangle, ShieldCheck, UserCheck, Search, Key, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';

interface DiplomaExpeditionProps {
  onDiplomaCreated?: (diploma: DiplomaRecord) => void;
}

export const DiplomaExpedition: React.FC<DiplomaExpeditionProps> = ({ onDiplomaCreated }) => {
  const [diplomasList, setDiplomasList] = useState<DiplomaRecord[]>(INITIAL_DIPLOMAS);
  const [selectedDiploma, setSelectedDiploma] = useState<DiplomaRecord | null>(null);

  // Simulated OAuth2 Auth State
  const [isOAuthAuthenticated, setIsOAuthAuthenticated] = useState<boolean>(true);
  const [oauthUser, setOauthUser] = useState({
    username: 'Cnl_Ordonez#0001',
    name: 'Coronel Rafael G. Ordóñez',
    rank: 'Coronel de Fuerza Aérea C.P.A.',
    discordId: '10928374102938471',
    isAuthorized: true,
  });

  // Form Fields
  const [cadetRoblox, setCadetRoblox] = useState('Cadete_FuerzaAerea2026');
  const [cadetDiscordTag, setCadetDiscordTag] = useState('CadetePilot#9910');
  const [cadetDiscordId, setCadetDiscordId] = useState('9823471092834019');
  const [targetRank, setTargetRank] = useState('Subteniente C.P.A.');
  const [specialtyCourse, setSpecialtyCourse] = useState(SPECIALTY_COURSES[0]);
  const [baseLocation, setBaseLocation] = useState('Base Aérea Militar No. 1 Santa Lucía');

  // Verification Search
  const [verifySearchQuery, setVerifySearchQuery] = useState('');
  const [verifyResult, setVerifyResult] = useState<DiplomaRecord | null | 'NOT_FOUND'>(null);

  const handleSimulateOAuthLogin = (authorized: boolean) => {
    if (authorized) {
      setOauthUser({
        username: 'Cnl_Ordonez#0001',
        name: 'Coronel Rafael G. Ordóñez',
        rank: 'Coronel de Fuerza Aérea C.P.A.',
        discordId: '10928374102938471',
        isAuthorized: true,
      });
      setIsOAuthAuthenticated(true);
    } else {
      setOauthUser({
        username: 'Cadete_Rookie#9999',
        name: 'Cadete Inexperto',
        rank: 'Cadete Aviador',
        discordId: '5544332211009988',
        isAuthorized: false,
      });
      setIsOAuthAuthenticated(true);
    }
  };

  const handleCreateDiploma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oauthUser.isAuthorized) return;

    const randomHashSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newHashId = `FAM-CERT-2026-${randomHashSuffix}`;
    const newDiploma: DiplomaRecord = {
      id: newHashId,
      cadetRoblox,
      cadetDiscordId,
      cadetDiscordTag,
      rank: targetRank,
      course: specialtyCourse,
      issueDate: new Date().toISOString().split('T')[0],
      instructorName: oauthUser.name,
      instructorRank: oauthUser.rank,
      instructorDiscordTag: oauthUser.username,
      baseLocation,
      status: 'VALID',
      qrData: `https://fam-roblox.gov/diploma/${newHashId}`,
    };

    setDiplomasList([newDiploma, ...diplomasList]);
    setSelectedDiploma(newDiploma);
    if (onDiplomaCreated) onDiplomaCreated(newDiploma);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const found = diplomasList.find((d) => d.id.toLowerCase() === verifySearchQuery.trim().toLowerCase());
    setVerifyResult(found || 'NOT_FOUND');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Módulo Exclusivo: Expedición de Certificados Oficiales FAM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Portal de Diplomas Militarisados con Discord OAuth2
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Permite a instructores autenticados de la Fuerza Aérea Mexicana en Roblox expadir certificados con folio único Hash, código QR dinámico y registro automático en Discord.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: OAuth Auth Status & Form */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Discord OAuth2 Identity Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                Autenticación Discord OAuth2
              </h3>
              <span className="text-xs text-slate-400 font-mono">Scope: identify guilds.members</span>
            </div>

            {/* Simulated Auth User Info Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border-2 border-emerald-600 flex items-center justify-center font-bold text-white text-base">
                  {oauthUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{oauthUser.name}</span>
                    <span className="text-xs font-mono text-emerald-400">({oauthUser.username})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{oauthUser.rank}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    {oauthUser.isAuthorized ? (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Rol de Instructor Autorizado
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Sin permisos de Oficial Instructor
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Toggle Simulated Roles */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSimulateOAuthLogin(true)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    oauthUser.isAuthorized
                      ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Simular Coronel (Autorizado)
                </button>
                <button
                  onClick={() => handleSimulateOAuthLogin(false)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                    !oauthUser.isAuthorized
                      ? 'bg-red-950/80 text-red-300 border-red-700'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Simular Cadete (No Autorizado)
                </button>
              </div>
            </div>
          </div>

          {/* Form for Creating Diploma */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-emerald-400" />
              Expedición de Nuevo Diploma
            </h3>

            {!oauthUser.isAuthorized ? (
              <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-4 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                <h4 className="text-sm font-bold text-red-300">Acceso Denegado por Seguridad FAM</h4>
                <p className="text-xs text-red-200/80">
                  Tu usuario de Discord actual no posee el rol militar <code className="bg-red-900/80 px-1 py-0.5 rounded text-white">[FAM] Oficial Instructor</code> en el servidor.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateDiploma} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Usuario de Roblox del Cadete</label>
                    <input
                      type="text"
                      required
                      value={cadetRoblox}
                      onChange={(e) => setCadetRoblox(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tag / Discord User del Cadete</label>
                    <input
                      type="text"
                      required
                      value={cadetDiscordTag}
                      onChange={(e) => setCadetDiscordTag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Rango Concedido</label>
                    <select
                      value={targetRank}
                      onChange={(e) => setTargetRank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {FAM_RANKS.map((rank) => (
                        <option key={rank} value={rank}>{rank}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Base o Escuela Aérea</label>
                    <input
                      type="text"
                      value={baseLocation}
                      onChange={(e) => setBaseLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Especialidad o Curso Completado</label>
                  <select
                    value={specialtyCourse}
                    onChange={(e) => setSpecialtyCourse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SPECIALTY_COURSES.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Expedir, Firmar con OAuth2 y Publicar en Discord</span>
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Column: Public Verifier & Diplomas History */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Verification Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Search className="w-4 h-4 text-emerald-400" />
              Verificador Oficial de Folios FAM
            </h3>
            <p className="text-xs text-slate-400">
              Ingresa cualquier código Hash (ej. <code className="text-emerald-300">FAM-CERT-2026-9A81B</code>) para consultar el registro militar.
            </p>

            <form onSubmit={handleVerify} className="flex gap-2">
              <input
                type="text"
                placeholder="FAM-CERT-2026-XXXXX"
                value={verifySearchQuery}
                onChange={(e) => setVerifySearchQuery(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shrink-0"
              >
                Buscar
              </button>
            </form>

            {verifyResult === 'NOT_FOUND' && (
              <div className="bg-red-950/40 border border-red-800 p-3 rounded-lg text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>No se encontró ningún registro militar con ese folio hash.</span>
              </div>
            )}

            {verifyResult && verifyResult !== 'NOT_FOUND' && (
              <div className="bg-emerald-950/60 border border-emerald-700/60 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> REGISTRO VÁLIDO EN LA FAM
                  </span>
                  <button
                    onClick={() => setSelectedDiploma(verifyResult)}
                    className="text-xs font-semibold text-emerald-300 underline hover:text-white"
                  >
                    Ver Diploma
                  </button>
                </div>
                <div className="text-xs text-slate-300 space-y-1 font-mono">
                  <p>Cadete: <strong>{verifyResult.cadetRoblox}</strong></p>
                  <p>Curso: {verifyResult.course}</p>
                  <p>Instructor: {verifyResult.instructorName}</p>
                </div>
              </div>
            )}
          </div>

          {/* List of Registered Diplomas */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Historial de Diplomas Expedidos
              </h3>
              <span className="text-xs font-mono text-emerald-400">{diplomasList.length} Registros</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
              {diplomasList.map((dip) => (
                <div
                  key={dip.id}
                  onClick={() => setSelectedDiploma(dip)}
                  className="bg-slate-950 border border-slate-800 hover:border-emerald-600 rounded-lg p-3 cursor-pointer transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{dip.cadetRoblox}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                      {dip.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-1">{dip.course}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Instructor: {dip.instructorName}</span>
                    <span>{dip.issueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Diploma Certificate Viewer Modal */}
      <DiplomaCertificateModal
        diploma={selectedDiploma}
        onClose={() => setSelectedDiploma(null)}
      />

    </div>
  );
};
