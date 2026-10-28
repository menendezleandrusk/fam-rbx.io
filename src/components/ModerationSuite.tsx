import React, { useState } from 'react';
import { AuditLogItem, AutoModRule, ReactionRoleConfig } from '../types';
import { INITIAL_AUDIT_LOGS, INITIAL_AUTOMOD_RULES, REACTION_ROLES_CONFIG } from '../data/mockData';
import { Shield, AlertTriangle, UserX, VolumeX, History, Sliders, Check, Plus, Trash2, Filter } from 'lucide-react';

export const ModerationSuite: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [autoModRules, setAutoModRules] = useState<AutoModRule[]>(INITIAL_AUTOMOD_RULES);
  const [reactionRoles, setReactionRoles] = useState<ReactionRoleConfig[]>(REACTION_ROLES_CONFIG);
  
  // Mod Action Form
  const [targetUser, setTargetUser] = useState('Cadete_Spammer99#4321');
  const [actionType, setActionType] = useState<'WARN' | 'MUTE' | 'KICK' | 'BAN'>('WARN');
  const [modReason, setModReason] = useState('Insubordinación en canal de radio de la base');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const handleToggleRule = (id: string) => {
    setAutoModRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleExecuteModAction = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Ahora mismo',
      action: actionType,
      target: targetUser,
      executor: 'Comandante_Guardia#0001 (Tú)',
      reason: modReason,
      severity: actionType === 'BAN' || actionType === 'KICK' ? 'high' : 'medium',
    };
    setAuditLogs([newLog, ...auditLogs]);
    setModReason('');
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Módulo 2: Moderación, Auditoría & Roles por Reacción</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Consola de Seguridad Militar (Dyno / Carl-bot Style)
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Supervisa el cumplimiento del reglamento militar de la FAM en Discord y Roblox, configura auto-moderación en tiempo real y gestiona asignación automática de rangos.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Mod Actions & AutoMod Rules */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Quick Mod Action Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Shield className="w-4 h-4 text-emerald-400" />
              Ejecutar Sanción Disciplinaria Militar
            </h3>

            <form onSubmit={handleExecuteModAction} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Miembro a Sancionar</label>
                  <input
                    type="text"
                    required
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="Usuario#0000 o Roblox Name"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tipo de Acción</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="WARN">⚠️ Advertencia (Warn)</option>
                    <option value="MUTE">🔇 Silenciar (Mute / Timeout)</option>
                    <option value="KICK">🥾 Expulsar (Kick)</option>
                    <option value="BAN">🔨 Banear del Servidor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Motivo / Artículo Infringido</label>
                <input
                  type="text"
                  required
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  placeholder="ej. Insubordinación, Spam de enlaces Roblox..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-red-700 hover:bg-red-600 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Aplicar Sanción y Registrar en Auditoría</span>
              </button>
            </form>
          </div>

          {/* Auto-Moderation Rules Manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Filtros de Auto-Moderación (Auto-Mod)
            </h3>

            <div className="space-y-3">
              {autoModRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rule.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        Umbral: {rule.threshold}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{rule.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      rule.enabled ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Reaction Roles Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-emerald-400" />
              Roles por Reacción (Reaction Roles)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reactionRoles.map((rr) => (
                <div key={rr.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{rr.emoji}</span>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">{rr.count} asignados</span>
                  </div>
                  <div className="text-xs font-bold text-white">{rr.roleName}</div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{rr.description}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Audit Log Feed */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Registro de Auditoría en Vivo (Audit Logs)
              </h3>

              {/* Action Filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="ALL">Todos los Eventos</option>
                  <option value="DIPLOMA_ISSUED">Diplomas</option>
                  <option value="WARN">Warns</option>
                  <option value="MUTE">Mutes</option>
                  <option value="ROLE_CHANGE">Roles</option>
                </select>
              </div>
            </div>

            {/* Audit Log Timeline */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredLogs.map((log) => {
                let badgeBg = 'bg-slate-800 text-slate-300';
                if (log.action === 'DIPLOMA_ISSUED') badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                if (log.action === 'WARN') badgeBg = 'bg-amber-950 text-amber-300 border-amber-800';
                if (log.action === 'MUTE' || log.action === 'BAN' || log.action === 'KICK') badgeBg = 'bg-red-950 text-red-300 border-red-800';
                if (log.action === 'ROLE_CHANGE') badgeBg = 'bg-blue-950 text-blue-300 border-blue-800';

                return (
                  <div
                    key={log.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${badgeBg}`}>
                        {log.action}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{log.timestamp}</span>
                    </div>

                    <div className="text-xs text-slate-200">
                      <span className="font-bold text-white">Objetivo:</span> {log.target}
                    </div>

                    <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded border border-slate-800/60 font-mono">
                      "{log.reason}"
                    </div>

                    <div className="text-[11px] text-slate-500 text-right">
                      Ejecutado por: <span className="text-slate-300 font-semibold">{log.executor}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
