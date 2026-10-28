import React, { useState } from 'react';
import { DiscordEmbedData, EmbedField } from '../types';
import { INITIAL_EMBED_PRESETS, ASSETS } from '../data/mockData';
import { Sparkles, Plus, Trash2, Copy, Check, Send, Code, Image as ImageIcon, Palmtree, UserCheck, ShieldCheck, Terminal } from 'lucide-react';

export const EmbedGenerator: React.FC = () => {
  const [embedData, setEmbedData] = useState<DiscordEmbedData>(INITIAL_EMBED_PRESETS.orden_del_dia);
  const [selectedPreset, setSelectedPreset] = useState<string>('orden_del_dia');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const handleApplyPreset = (key: string) => {
    if (INITIAL_EMBED_PRESETS[key]) {
      setEmbedData(INITIAL_EMBED_PRESETS[key]);
      setSelectedPreset(key);
    }
  };

  const handleAddField = () => {
    const newField: EmbedField = {
      id: Date.now().toString(),
      name: 'Campo Nuevo',
      value: 'Detalle militar o requerimiento en Roblox.',
      inline: true,
    };
    setEmbedData((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const handleUpdateField = (id: string, key: keyof EmbedField, value: any) => {
    setEmbedData((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    }));
  };

  const handleRemoveField = (id: string) => {
    setEmbedData((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== id),
    }));
  };

  const handleCopyCode = (format: 'json' | 'python' | 'nodejs') => {
    let snippet = '';
    if (format === 'json') {
      snippet = JSON.stringify({ embeds: [embedData] }, null, 2);
    } else if (format === 'python') {
      snippet = `embed = discord.Embed(
    title="${embedData.title.replace(/"/g, '\\"')}",
    description="${embedData.description.replace(/"/g, '\\"')}",
    color=${embedData.color.replace('#', '0x')}
)
embed.set_author(name="${embedData.authorName}")
${embedData.thumbnail ? `embed.set_thumbnail(url="${embedData.thumbnail}")` : ''}
${embedData.image ? `embed.set_image(url="${embedData.image}")` : ''}
${embedData.fields.map(f => `embed.add_field(name="${f.name}", value="${f.value}", inline=${f.inline ? 'True' : 'False'})`).join('\n')}
embed.set_footer(text="${embedData.footerText}")
await ctx.send(embed=embed)`;
    } else if (format === 'nodejs') {
      snippet = `const embed = new EmbedBuilder()
  .setTitle("${embedData.title.replace(/"/g, '\\"')}")
  .setDescription("${embedData.description.replace(/"/g, '\\"')}")
  .setColor("${embedData.color}")
  .setAuthor({ name: "${embedData.authorName}" })
  ${embedData.thumbnail ? `.setThumbnail("${embedData.thumbnail}")` : ''}
  ${embedData.image ? `.setImage("${embedData.image}")` : ''}
  ${embedData.fields.length > 0 ? `.addFields(${JSON.stringify(embedData.fields.map(f => ({ name: f.name, value: f.value, inline: f.inline })), null, 2)})` : ''}
  .setFooter({ text: "${embedData.footerText}" });

await message.channel.send({ embeds: [embed] });`;
    }

    navigator.clipboard.writeText(snippet);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleSendWebhook = () => {
    setWebhookStatus('sending');
    setTimeout(() => {
      setWebhookStatus('success');
      setTimeout(() => setWebhookStatus(null), 3000);
    }, 800);
  };

  const militaryColors = [
    { label: 'Verde Olivo FAM', hex: '#1e3a1e' },
    { label: 'Azul Fuerza Aérea', hex: '#1a365d' },
    { label: 'Dorado Honor', hex: '#d97706' },
    { label: 'Rojo Alerta DEFCON', hex: '#991b1b' },
    { label: 'Negro Táctico', hex: '#111827' },
    { label: 'Gris Metal Stealth', hex: '#374151' },
  ];

  return (
    <div className="space-[#1E293B] min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      
      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none w-1/3">
          <img src={ASSETS.famBaseHero} alt="FAM Background" className="w-full h-full object-cover" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Módulo 1: Creador & Gestor de Anuncios Militares</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Generator de Embeds Corporativos FAM
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Diseña avisos institucionales, boletines de ascenso y órdenes del día con la paleta de colores oficial, escudos en alta resolución y formato de campos de Discord.
          </p>

          {/* Preset Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Plantillas FAM:</span>
            <button
              onClick={() => handleApplyPreset('orden_del_dia')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedPreset === 'orden_del_dia'
                  ? 'bg-emerald-800/80 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              🛩️ Orden del Día
            </button>
            <button
              onClick={() => handleApplyPreset('ascenso_oficial')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedPreset === 'ascenso_oficial'
                  ? 'bg-amber-800/80 text-white border-amber-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              🎖️ Ascenso Oficial
            </button>
            <button
              onClick={() => handleApplyPreset('convocatoria_reclutamiento')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedPreset === 'convocatoria_reclutamiento'
                  ? 'bg-blue-800/80 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              📋 Convocatoria EMA
            </button>
            <button
              onClick={() => handleApplyPreset('alerta_defcon')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                selectedPreset === 'alerta_defcon'
                  ? 'bg-red-900/80 text-white border-red-500 shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              🚨 Alerta DEFCON
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls, Right Live Discord Preview */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Editor Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Contenido Principal del Embed
            </h3>

            {/* Title & Author */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título del Anuncio</label>
                <input
                  type="text"
                  value={embedData.title}
                  onChange={(e) => setEmbedData({ ...embedData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Autor / Rango Institucional</label>
                <input
                  type="text"
                  value={embedData.authorName}
                  onChange={(e) => setEmbedData({ ...embedData, authorName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción / Texto Principal (Soporta Markdown)</label>
              <textarea
                rows={3}
                value={embedData.description}
                onChange={(e) => setEmbedData({ ...embedData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Color Lateral del Embed (Hex)</label>
              <div className="flex flex-wrap items-center gap-2">
                {militaryColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => setEmbedData({ ...embedData, color: col.hex })}
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border font-mono transition-all ${
                      embedData.color.toLowerCase() === col.hex.toLowerCase()
                        ? 'border-emerald-400 text-white bg-slate-800 shadow-sm'
                        : 'border-slate-800 text-slate-400 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: col.hex }} />
                    <span>{col.label}</span>
                  </button>
                ))}
                <input
                  type="color"
                  value={embedData.color}
                  onChange={(e) => setEmbedData({ ...embedData, color: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 bg-slate-950 cursor-pointer p-0.5"
                />
              </div>
            </div>
          </div>

          {/* Media Links Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              Imágenes y Miniaturas (Escudo FAM)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Thumbnail (Miniatura Superior)</label>
                <input
                  type="text"
                  value={embedData.thumbnail}
                  onChange={(e) => setEmbedData({ ...embedData, thumbnail: e.target.value })}
                  placeholder="URL de la imagen o escudo..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Imagen Banner de Fondo</label>
                <input
                  type="text"
                  value={embedData.image}
                  onChange={(e) => setEmbedData({ ...embedData, image: e.target.value })}
                  placeholder="URL de banner o foto táctica..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Pie de Página (Footer)</label>
              <input
                type="text"
                value={embedData.footerText}
                onChange={(e) => setEmbedData({ ...embedData, footerText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Custom Fields Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                Campos Personalizados (Fields)
              </h3>
              <button
                onClick={handleAddField}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Campo</span>
              </button>
            </div>

            <div className="space-y-3">
              {embedData.fields.map((field, index) => (
                <div key={field.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-500">Campo #{index + 1}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.inline}
                          onChange={(e) => handleUpdateField(field.id, 'inline', e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <span>En línea (Inline)</span>
                      </label>
                      <button
                        onClick={() => handleRemoveField(field.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        title="Eliminar campo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre del campo (ej. Fecha)"
                      value={field.name}
                      onChange={(e) => handleUpdateField(field.id, 'name', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Valor / Detalle"
                      value={field.value}
                      onChange={(e) => handleUpdateField(field.id, 'value', e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
              {embedData.fields.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-2">
                  No hay campos adicionales. Haz clic en "Agregar Campo" para añadir detalles adicionales.
                </p>
              )}
            </div>
          </div>

          {/* Export Code Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2 border-b border-slate-800 pb-3">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Exportar Código para tu Bot de Discord
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => handleCopyCode('json')}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-all"
              >
                {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar JSON Discord</span>
              </button>

              <button
                onClick={() => handleCopyCode('python')}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-all"
              >
                {copiedFormat === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Python (.py)</span>
              </button>

              <button
                onClick={() => handleCopyCode('nodejs')}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg transition-all"
              >
                {copiedFormat === 'nodejs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Node.js (.js)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Pixel-Perfect Live Discord Preview Card */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-1">
            <span>VISTA PREVIA EN VIVO (DISCORD DARK MODE)</span>
            <span className="text-emerald-400">CANAL: #anuncios-fam</span>
          </div>

          {/* Discord Mock Shell */}
          <div className="bg-[#313338] rounded-xl p-4 sm:p-5 border border-slate-700/60 shadow-2xl font-sans text-slate-200 space-y-3">
            
            {/* Discord Message Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-emerald-950 border border-emerald-600/50">
                <img src={ASSETS.famEmblem} alt="Bot Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm hover:underline cursor-pointer">FAM Bot Oficial</span>
                  <span className="bg-[#5865F2] text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">BOT</span>
                  <span className="text-xs text-slate-400 ml-1">Hoy a las {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Discord Embed Box */}
                <div className="mt-2 bg-[#2b2d31] rounded-lg overflow-hidden border border-[#1e1f22] flex max-w-full">
                  {/* Left Color Strip */}
                  <div
                    className="w-1 shrink-0 transition-colors"
                    style={{ backgroundColor: embedData.color || '#1e3a1e' }}
                  />

                  {/* Embed Content Body */}
                  <div className="p-3.5 space-y-3 flex-1 min-w-0">
                    
                    {/* Author Row */}
                    {embedData.authorName && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        {embedData.authorIcon && (
                          <img src={embedData.authorIcon} alt="Author" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span>{embedData.authorName}</span>
                      </div>
                    )}

                    {/* Header + Thumbnail Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        {embedData.title && (
                          <h4 className="font-bold text-base text-white hover:underline cursor-pointer leading-snug break-words">
                            {embedData.title}
                          </h4>
                        )}
                        {embedData.description && (
                          <p className="text-xs text-[#dbdee1] leading-relaxed whitespace-pre-line break-words">
                            {embedData.description}
                          </p>
                        )}
                      </div>

                      {/* Thumbnail Image */}
                      {embedData.thumbnail && (
                        <div className="w-14 h-14 rounded overflow-hidden shrink-0 bg-slate-900 border border-slate-700/50">
                          <img src={embedData.thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Fields Grid */}
                    {embedData.fields.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {embedData.fields.map((field) => (
                          <div
                            key={field.id}
                            className={field.inline ? 'col-span-1' : 'col-span-full'}
                          >
                            <div className="text-xs font-bold text-white mb-0.5">{field.name}</div>
                            <div className="text-xs text-[#dbdee1] whitespace-pre-line">{field.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Big Image Banner */}
                    {embedData.image && (
                      <div className="rounded overflow-hidden mt-2 border border-[#1e1f22] max-h-56 bg-slate-900">
                        <img src={embedData.image} alt="Embed Banner" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Footer Row */}
                    <div className="flex items-center gap-2 text-[11px] text-[#949ba4] pt-1 border-t border-slate-800/40">
                      {embedData.footerIcon && (
                        <img src={embedData.footerIcon} alt="Footer Icon" className="w-4 h-4 rounded-full object-cover" />
                      )}
                      <span>{embedData.footerText}</span>
                      {embedData.timestamp && (
                        <>
                          <span>•</span>
                          <span>{new Date().toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Webhook Sender Test Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              Probar Envió a Webhook de Discord
            </div>
            <p className="text-xs text-slate-400">
              Pega la URL de Webhook de un canal de Discord para probar el anuncio instantáneamente.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={handleSendWebhook}
                disabled={webhookStatus === 'sending'}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
              >
                {webhookStatus === 'sending' ? (
                  <span>Enviando...</span>
                ) : webhookStatus === 'success' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>¡Enviado!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
