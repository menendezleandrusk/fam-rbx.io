import React, { useState } from 'react';
import { ASSETS, BOT_COMMANDS } from '../data/mockData';
import { Terminal, Send, HelpCircle, CheckCircle2, ShieldAlert, Award, Sparkles, Copy } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  isBot: boolean;
  timestamp: string;
  text?: string;
  embed?: {
    title: string;
    description: string;
    color: string;
    fields?: { name: string; value: string }[];
    footer?: string;
  };
}

export const BotSimulator: React.FC = () => {
  const [inputCommand, setInputCommand] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'Coronel_Ordonez#0001',
      avatar: ASSETS.famEmblem,
      isBot: false,
      timestamp: 'Hoy a las 18:00',
      text: '!ayuda',
    },
    {
      id: 'm-2',
      sender: 'FAM Bot Oficial',
      avatar: ASSETS.famEmblem,
      isBot: true,
      timestamp: 'Hoy a las 18:00',
      embed: {
        title: '🛩️ COMANDOS OFICIALES — FUERZA AÉREA MEXICANA',
        description: 'Bienvenido al sistema automatizado de la FAM en Discord para Roblox. Comandos disponibles:',
        color: '#1e3a1e',
        fields: [
          { name: '!anuncio_fam <Título>', value: 'Envía un comunicado institucional con la estética oficial.' },
          { name: '!expedir_diploma <Cadete> <Curso>', value: 'Inicia la expedición con Discord OAuth2.' },
          { name: '!verificar_diploma <HASH>', value: 'Consulta la validez de un diploma en el registro militar.' },
          { name: '!mod warn / mute / kick / ban', value: 'Aplica acciones disciplinarias y registra en auditoría.' },
        ],
        footer: 'Sistema Oficial FAM Roblox • Honor, Valor y Lealtad',
      },
    },
  ]);

  const handleRunCommand = (cmdText: string) => {
    if (!cmdText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'Tú (Instructor FAM)',
      avatar: ASSETS.famEmblem,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: cmdText,
    };

    let botReplyEmbed: ChatMessage['embed'];

    const lower = cmdText.toLowerCase();
    if (lower.startsWith('!ayuda')) {
      botReplyEmbed = {
        title: '🛩️ SISTEMA DE AYUDA MILITAR FAM',
        description: 'Utiliza los botones rápidos arriba para probar los módulos interactivos.',
        color: '#1e3a1e',
        fields: BOT_COMMANDS.map((c) => ({ name: c.command, value: `${c.description} (Permiso: ${c.rankRequired})` })),
      };
    } else if (lower.startsWith('!verificar')) {
      botReplyEmbed = {
        title: '✅ CERTIFICADO MILITAR VÁLIDO EN REGISTRO FAM',
        description: 'El certificado ingresado corresponde a un registro legítimo otorgado por la Escuela Militar de Aviación.',
        color: '#16a34a',
        fields: [
          { name: 'Cadete Receptora', value: 'Roblox_Cadete_Alpha' },
          { name: 'Especialidad', value: 'Piloto Aviador de Caza y Combate (F-5E Tiger II)' },
          { name: 'Folio Hash', value: '`FAM-CERT-2026-9A81B`' },
        ],
        footer: 'Verificado mediante Firma Digital Discord OAuth2',
      };
    } else if (lower.startsWith('!expedir_diploma')) {
      botReplyEmbed = {
        title: '📜 EXPEDICIÓN DE DIPLOMA INICIADA',
        description: 'Se ha enviado un enlace seguro con **Discord OAuth2** al instructor para autenticar sus permisos e ingresar los datos del cadete.',
        color: '#d97706',
        fields: [
          { name: 'Estado Auth', value: '🔐 Autenticado mediante Discord OAuth2' },
          { name: 'Instructor', value: 'Coronel Rafael G. Ordóñez' },
        ],
        footer: 'Redirigiendo a Portal de Diplomas Web...',
      };
    } else if (lower.startsWith('!ascenso')) {
      botReplyEmbed = {
        title: '🎖️ BOLETÍN OFICIAL DE ASCENSO',
        description: 'El Alto Mando de la Fuerza Aérea Mexicana promueve al elemento en Roblox y Discord.',
        color: '#d97706',
        fields: [
          { name: 'Elemento Promovido', value: 'Roblox: Cadete_Aviador99' },
          { name: 'Nuevo Rango', value: '**Capitán Segundo C.P.A.**' },
        ],
        footer: 'Asignación de rol automática completada',
      };
    } else {
      botReplyEmbed = {
        title: '🛩️ COMANDO EJECUTADO CORRECTAMENTE',
        description: `El comando \`${cmdText}\` fue procesado con éxito por el núcleo del FAM Bot.`,
        color: '#1e3a1e',
        fields: [
          { name: 'Respuesta del Servidor', value: 'Operación militar procesada sin novedades.' },
        ],
        footer: 'Fuerza Aérea Mexicana • Discord & Roblox',
      };
    }

    const botMsg: ChatMessage = {
      id: `b-${Date.now()}`,
      sender: 'FAM Bot Oficial',
      avatar: ASSETS.famEmblem,
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      embed: botReplyEmbed,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputCommand('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-1">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Simulador Interactivo de Discord Bot</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Consola de Pruebas de Comandos FAM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prueba cómo responden los comandos del bot en un canal de Discord real.
          </p>
        </div>

        {/* Quick Command Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleRunCommand('!ayuda')}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700"
          >
            !ayuda
          </button>
          <button
            onClick={() => handleRunCommand('!verificar_diploma FAM-CERT-2026-9A81B')}
            className="px-3 py-1.5 text-xs font-semibold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg transition-colors border border-emerald-800"
          >
            !verificar_diploma
          </button>
          <button
            onClick={() => handleRunCommand('!expedir_diploma @Cadete "Piloto Caza"')}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-950 hover:bg-amber-900 text-amber-300 rounded-lg transition-colors border border-amber-800"
          >
            !expedir_diploma
          </button>
          <button
            onClick={() => handleRunCommand('!ascenso @Cadete "Capitán Segundo"')}
            className="px-3 py-1.5 text-xs font-semibold bg-blue-950 hover:bg-blue-900 text-blue-300 rounded-lg transition-colors border border-blue-800"
          >
            !ascenso
          </button>
        </div>
      </div>

      {/* Discord Shell Simulation Container */}
      <div className="max-w-7xl mx-auto bg-[#313338] border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[650px]">
        
        {/* Discord Top Channel Header Bar */}
        <div className="bg-[#2b2d31] px-4 py-3 border-b border-[#1e1f22] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-lg font-bold">#</span>
            <span className="text-white font-bold text-sm">comandos-fam-bot</span>
            <span className="text-slate-500 text-xs hidden sm:inline">| Canal oficial de comandos y transmisiones militares</span>
          </div>
          <span className="text-xs text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            BOT CONECTADO
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 hover:bg-[#2e3035] p-2 rounded-lg transition-colors">
              <img src={msg.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700" />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{msg.sender}</span>
                  {msg.isBot && (
                    <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">BOT</span>
                  )}
                  <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                </div>

                {msg.text && (
                  <p className="text-sm text-[#dbdee1] font-mono">{msg.text}</p>
                )}

                {msg.embed && (
                  <div className="mt-2 bg-[#2b2d31] rounded-lg border border-[#1e1f22] flex max-w-2xl overflow-hidden shadow-md">
                    <div className="w-1 shrink-0" style={{ backgroundColor: msg.embed.color }} />
                    <div className="p-3.5 space-y-2 flex-1">
                      <h4 className="font-bold text-sm text-white">{msg.embed.title}</h4>
                      <p className="text-xs text-[#dbdee1]">{msg.embed.description}</p>

                      {msg.embed.fields && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.embed.fields.map((f, idx) => (
                            <div key={idx} className="bg-slate-900/40 p-2 rounded">
                              <div className="text-[11px] font-bold text-white">{f.name}</div>
                              <div className="text-xs text-[#dbdee1]">{f.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {msg.embed.footer && (
                        <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">{msg.embed.footer}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Discord Input Bar */}
        <div className="p-4 bg-[#2b2d31] border-t border-[#1e1f22]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCommand(inputCommand);
            }}
            className="flex items-center gap-2 bg-[#383a40] rounded-lg px-4 py-2"
          >
            <input
              type="text"
              placeholder="Enviar mensaje a #comandos-fam-bot (Escribe !ayuda, !verificar, etc)..."
              value={inputCommand}
              onChange={(e) => setInputCommand(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-slate-400 font-mono"
            />
            <button
              type="submit"
              className="text-emerald-400 hover:text-emerald-300 p-1 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
