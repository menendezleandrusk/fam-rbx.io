import React, { useState } from 'react';
import { DiplomaRecord, UserSession } from '../types';
import { FAM_RANKS, SPECIALTY_COURSES } from '../data/mockData';
import { DiplomaCertificateModal } from './DiplomaCertificateModal';
import { saveDiplomaToFirestore } from '../lib/firebase';
import { Lock, ShieldCheck, AlertTriangle, Key, UserCheck, Award, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

interface PrivateInstructorPanelProps {
  userSession: UserSession | null;
  onLoginClick: () => void;
}

export const PrivateInstructorPanel: React.FC<PrivateInstructorPanelProps> = ({
  userSession,
  onLoginClick,
}) => {
  // Form State
  const [cadetRoblox, setCadetRoblox] = useState('Cadete_FuerzaAerea2026');
  const [cadetDiscordTag, setCadetDiscordTag] = useState('CadetePilot#9910');
  const [cadetDiscordId, setCadetDiscordId] = useState('9823471092834019');
  const [targetRank, setTargetRank] = useState('Subteniente C.P.A.');
  const [specialtyCourse, setSpecialtyCourse] = useState(SPECIALTY_COURSES[0]);
  const [notes, setNotes] = useState('Aprobación satisfactoria de adiestramiento aéreo militar en Roblox.');
  const [baseLocation, setBaseLocation] = useState('Base Aérea Militar No. 1 Santa Lucía');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newlyCreatedDiploma, setNewlyCreatedDiploma] = useState<DiplomaRecord | null>(null);

  const handleSubmitExpedite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/diplomas/expedite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cadetRoblox,
          cadetDiscordId,
          cadetDiscordTag,
          rank: targetRank,
          course: specialtyCourse,
          notes,
          baseLocation,
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'SUCCESS' && data.diploma) {
        setNewlyCreatedDiploma(data.diploma);
        // Sincronización en tiempo real con Firebase Firestore
        try {
          await saveDiplomaToFirestore(data.diploma);
        } catch (fsErr) {
          console.warn('[FAM Firebase] Guardado local exitoso, Firestore background sync:', fsErr);
        }
      } else {
        setSubmitError(data.message || 'Error al expedir el diploma.');
      }
    } catch (err: any) {
      setSubmitError('Error de comunicación con el servidor backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. IF NOT LOGGED IN OR NOT INSTRUCTOR: DISPLAY HTTP 403 FORBIDDEN INTERFACE
  if (!userSession || !userSession.isInstructor) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-slate-900 border border-red-900/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-700/60 flex items-center justify-center text-red-400 mx-auto shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <span className="text-xs font-bold font-mono text-red-400 bg-red-950/80 px-2.5 py-1 rounded border border-red-800 uppercase">
              HTTP 403 FORBIDDEN — ACCESO RESTRINGIDO
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Se Requiere Rol de Oficial Instructor FAM
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              El Módulo 3 de Expedición de Diplomas exige autenticarse mediante **Discord OAuth2** y poseer la membresía del rol de instructor militar (<code className="text-amber-300 font-mono">INSTRUCTOR_ROLE_ID</code> configurado en variables de entorno).
            </p>
          </div>

          {/* Diagnostic Info Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Estado de Sesión:</span>
              <span className={userSession ? 'text-amber-400' : 'text-red-400'}>
                {userSession ? `Autenticado (${userSession.username})` : 'Sesión Bloqueada (Autenticación Requerida)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Membresía Servidor FAM:</span>
              <span className={userSession?.guildMember ? 'text-emerald-400' : 'text-slate-400'}>
                {userSession?.guildMember ? 'VERIFICADA (FAM_GUILD_ID)' : 'NO DETECTADA'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Permiso [FAM] Instructor:</span>
              <span className="text-red-400 font-bold">FALTANTE (ACCESO DENEGADO)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={onLoginClick}
              className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Reautenticar con Cuenta de Oficial en Discord</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // 2. AUTHORIZED INSTRUCTOR PANEL
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Módulo 3: Panel Privado de Expedición de Diplomas (Protegido por Middleware JWT)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Consola de Firma & Emisión Digital FAM
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Instructor Autenticado: <strong className="text-white">{userSession.username}</strong> ({userSession.instructorRank})
            </p>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-700/60 rounded-xl px-4 py-2.5 text-xs text-emerald-300 flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Firma Digital OAuth2 Activa · JWT Sesión Válida</span>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Expedir Nuevo Certificado de Vuelo Militar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Genera automáticamente el Hash de verificación y notifica al canal de Discord de la FAM.
            </p>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-950/40 border border-red-800 p-4 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitExpedite} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Usuario Roblox del Cadete <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={cadetRoblox}
                onChange={(e) => setCadetRoblox(e.target.value)}
                placeholder="ej. Roblox_Cadete_Aviador"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Discord User Tag del Cadete
              </label>
              <input
                type="text"
                value={cadetDiscordTag}
                onChange={(e) => setCadetDiscordTag(e.target.value)}
                placeholder="ej. CadetePilot#9910"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rango Concedido</label>
              <select
                value={targetRank}
                onChange={(e) => setTargetRank(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {FAM_RANKS.map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Base Aérea / Sede</label>
              <input
                type="text"
                value={baseLocation}
                onChange={(e) => setBaseLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Especialidad o Curso de Capacitación Aprobado <span className="text-emerald-400">*</span>
            </label>
            <select
              value={specialtyCourse}
              onChange={(e) => setSpecialtyCourse(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {SPECIALTY_COURSES.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notas de Graduación / Menciones Honoríficas</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Firmando Certificado con Discord OAuth2...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Expedir, Generar Folio Hash y Publicar Certificado</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Diploma Certificate Modal Preview upon success */}
      <DiplomaCertificateModal
        diploma={newlyCreatedDiploma}
        onClose={() => setNewlyCreatedDiploma(null)}
      />

    </div>
  );
};
