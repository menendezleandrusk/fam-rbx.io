import React from 'react';
import { DiplomaRecord } from '../types';
import { ASSETS } from '../data/mockData';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { X, Printer, Download, Share2, ShieldCheck, CheckCircle2, Award, Copy, Check } from 'lucide-react';

interface DiplomaCertificateModalProps {
  diploma: DiplomaRecord | null;
  onClose: () => void;
}

export const DiplomaCertificateModal: React.FC<DiplomaCertificateModalProps> = ({ diploma, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (diploma) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#1e3a1e', '#d97706', '#16a34a', '#ffffff'],
      });
    }
  }, [diploma]);

  if (!diploma) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(diploma.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-emerald-900/60 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Control Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white tracking-wide uppercase">
              Certificado Oficial Expedido — Fuerza Aérea Mexicana
            </span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[11px] font-mono px-2 py-0.5 rounded">
              FOLIO: {diploma.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHash}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Folio Copiado!' : 'Copiar Folio'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Paper Container */}
        <div className="p-6 sm:p-10 bg-[#fdfbf7] text-slate-900 relative print:p-0 print:bg-white" id="printable-certificate">
          
          {/* Decorative Certificate Frame */}
          <div className="border-4 border-double border-[#1e3a1e] rounded-xl p-6 sm:p-10 relative overflow-hidden bg-[#fdfbf7]">
            
            {/* Background Seal Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <img src={ASSETS.famDiplomaWatermark} alt="Seal Watermark" className="max-w-md w-full object-contain" />
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-3 relative z-10 border-b-2 border-slate-300 pb-6">
              <div className="flex items-center justify-center gap-4">
                <img src={ASSETS.famEmblem} alt="FAM Emblem" className="w-16 h-16 object-cover rounded-full shadow-md border-2 border-emerald-900" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-[#1e3a1e] uppercase font-serif">
                ESTADOS UNIDOS MEXICANOS
              </h2>
              <h3 className="text-lg sm:text-xl font-bold tracking-widest text-slate-800 uppercase font-serif">
                SECRETARÍA DE LA DEFENSA NACIONAL • FUERZA AÉREA MEXICANA
              </h3>
              <p className="text-xs font-semibold tracking-widest text-emerald-900 uppercase">
                ESCUELA MILITAR DE AVIACIÓN & COMANDANCIA DE EDUCACIÓN MILITAR
              </p>
            </div>

            {/* Body Title */}
            <div className="text-center my-8 relative z-10 space-y-3">
              <span className="text-xs font-bold tracking-widest uppercase text-slate-500 font-mono">
                OTORGA EL PRESENTE
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1e3a1e] font-serif tracking-tight">
                DIPLOMA DE VALIDEZ OFICIAL
              </h1>
              <p className="text-sm font-serif italic text-slate-600 max-w-xl mx-auto">
                Por haber cumplido satisfactoriamente con los requisitos académicos, militares y prácticas de vuelo en Roblox para la especialidad de:
              </p>
            </div>

            {/* Specialty Course Banner */}
            <div className="bg-[#1e3a1e] text-amber-200 py-3 px-6 text-center rounded-lg max-w-2xl mx-auto shadow-md relative z-10 my-6">
              <h4 className="text-base sm:text-lg font-bold font-serif tracking-wide">
                {diploma.course}
              </h4>
            </div>

            {/* Cadet Name & Rank */}
            <div className="text-center relative z-10 my-8 space-y-2">
              <p className="text-xs font-semibold uppercase text-slate-500 font-mono">OTORGADO A FAVOR DEL ELEMENTO:</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 underline decoration-emerald-800 decoration-2 underline-offset-8">
                {diploma.cadetRoblox}
              </h3>
              <p className="text-sm font-bold text-emerald-900 mt-2">
                RANGO CONFERIDO: <span className="uppercase text-slate-900 font-extrabold">{diploma.rank}</span>
              </p>
              <p className="text-xs text-slate-500">
                Discord ID: <span className="font-mono">{diploma.cadetDiscordTag}</span> ({diploma.cadetDiscordId})
              </p>
            </div>

            {/* Footer Signatures & QR Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end border-t-2 border-slate-300 pt-6 mt-8 relative z-10">
              
              {/* QR Validation Code */}
              <div className="flex flex-col items-center sm:items-start space-y-2">
                <div className="p-2 bg-white rounded border border-slate-300 shadow-sm">
                  <QRCodeSVG value={diploma.qrData} size={80} level="H" />
                </div>
                <div className="text-[10px] font-mono text-slate-600">
                  <p className="font-bold text-slate-800">FOLIO DE VERIFICACIÓN:</p>
                  <p className="text-emerald-900 font-bold">{diploma.id}</p>
                </div>
              </div>

              {/* Instructor Digital Signature */}
              <div className="text-center space-y-1">
                <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                  <span className="font-serif italic text-sm text-slate-700 font-bold">
                    {diploma.instructorName}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 uppercase">{diploma.instructorName}</p>
                <p className="text-[10px] font-semibold text-slate-600">{diploma.instructorRank}</p>
                <p className="text-[9px] text-emerald-800 font-mono">FIRMA DIGITAL OAUTH2 VALIDADA</p>
              </div>

              {/* Official Seal Badge */}
              <div className="flex flex-col items-center sm:items-end text-center sm:text-right space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-950 text-amber-300 flex items-center justify-center font-serif text-xs font-bold border-2 border-amber-400 shadow-md">
                  FAM
                </div>
                <p className="text-xs font-bold text-slate-900">BASE AÉREA NO. 1</p>
                <p className="text-[10px] text-slate-600">FECHA: {diploma.issueDate}</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
