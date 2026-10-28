import React, { useState } from 'react';
import { DiplomaRecord } from '../types';
import { INITIAL_DIPLOMAS } from '../data/mockData';
import { verifyDiplomaInFirestore } from '../lib/firebase';
import { X, Search, CheckCircle2, AlertTriangle, Award, ShieldCheck, Loader2 } from 'lucide-react';

interface QuickVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickVerifyModal: React.FC<QuickVerifyModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DiplomaRecord | null | 'NOT_FOUND'>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim().toUpperCase();
    if (!clean) return;

    setIsSearching(true);
    setResult(null);

    try {
      // 1. Try real-time Firestore query
      const fsRes = await verifyDiplomaInFirestore(clean, 'Quick Verify Modal');
      if (fsRes.found && fsRes.diploma) {
        setResult(fsRes.diploma);
        setIsSearching(false);
        return;
      }

      // 2. Fallback to API
      const res = await fetch(`/api/diplomas/verify/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.found && data.diploma) {
        setResult(data.diploma);
      } else {
        const local = INITIAL_DIPLOMAS.find((d) => d.id.toUpperCase() === clean);
        setResult(local || 'NOT_FOUND');
      }
    } catch {
      const local = INITIAL_DIPLOMAS.find((d) => d.id.toUpperCase() === clean);
      setResult(local || 'NOT_FOUND');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-900/60 rounded-xl shadow-2xl p-6 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Verificación Rápida de Diploma FAM</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Prueba ingresando un folio de certificado registrado como <code className="text-emerald-300 font-mono">FAM-CERT-2026-9A81B</code> o <code className="text-emerald-300 font-mono">FAM-CERT-2026-4C72D</code>.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="FAM-CERT-2026-XXXXX"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shrink-0"
          >
            Buscar Folio
          </button>
        </form>

        {result === 'NOT_FOUND' && (
          <div className="bg-red-950/40 border border-red-800 p-3 rounded-lg text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>Folio no registrado en la base de datos de la Fuerza Aérea Mexicana.</span>
          </div>
        )}

        {result && result !== 'NOT_FOUND' && (
          <div className="bg-emerald-950/60 border border-emerald-700/60 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> DIPLOMA AUTÉNTICO Y VÁLIDO
            </div>
            <div className="text-xs text-slate-200 space-y-1 font-mono">
              <p>Cadete: <strong>{result.cadetRoblox}</strong></p>
              <p>Rango: {result.rank}</p>
              <p>Especialidad: {result.course}</p>
              <p>Instructor: {result.instructorName}</p>
              <p>Fecha de Expedición: {result.issueDate}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
