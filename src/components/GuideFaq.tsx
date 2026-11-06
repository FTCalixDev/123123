import React from 'react';
import {
  Video, Sparkles, CheckCircle2, AlertCircle, Cpu, Film,
  Sliders, Ratio, Clock, Zap, Layers, Camera
} from 'lucide-react';

export const GuideFaq: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Hero Answer */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Respuesta Oficial</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            ¿Puedes generar videos? ¡Sí, absolutamente!
          </h1>

          <p className="mt-3 text-zinc-300 text-base leading-relaxed">
            A través del ecosistema de <strong>Google Gemini</strong> y su tecnología puntera de video <strong>Veo</strong> (modelo <code className="px-2 py-0.5 rounded bg-zinc-800 text-rose-300 font-mono text-sm">gemini-omni-1.2-flash</code>), esta aplicación permite generar, animar y dirigir videos cinematográficos con inteligencia artificial de última generación.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-3">
              <Film className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Texto a Video (T2V)</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Describe una escena y la IA la creará en video fluido.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-3">
              <Camera className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Imagen a Video (I2V)</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Sube cualquier fotografía o ilustración y dale movimiento natural.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-start gap-3">
              <Sliders className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Dirección de Cámara</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">Controla paneos, zooms tipo dolly, órbitas 360° y tomas de dron.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Specifications Section */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Especificaciones Técnicas del Modelo</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Modelo Oficial</span>
              <span className="font-mono text-xs text-rose-300 font-bold">gemini-omni-1.2-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Nombre Clave / Familia</span>
              <span className="text-xs text-zinc-200 font-medium">Veo / Veo Lite</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">API Utilizada</span>
              <span className="text-xs text-zinc-200 font-medium">Interactions API (@google/genai &gt;= 2.25)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Duraciones Admitidas</span>
              <span className="text-xs text-zinc-200 font-medium">3s, 5s, 10s (estándar), hasta 15s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Relaciones de Aspecto</span>
              <span className="text-xs text-zinc-200 font-medium">16:9 (Horizontal Cine) y 9:16 (Vertical)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Resoluciones de Salida</span>
              <span className="text-xs text-zinc-200 font-medium">360p, 720p HD, 1080p FHD, 4K</span>
            </div>
          </div>
        </div>
      </div>

      {/* How to use & requirements */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span>Requisitos y Clave API de Google AI Studio</span>
        </h2>

        <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Generación de Video en Tiempo Real:</strong> El modelo <code className="text-rose-300 font-mono text-xs">gemini-omni-1.2-flash</code> procesa video mediante la API de Interacciones en el servidor.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-100">Acceso a Modelos Omni / Veo:</strong> Por políticas de infraestructura de Google, los modelos de generación de video requieren una clave de API con proyecto de facturación habilitado en Google AI Studio (panel <em>Settings &gt; Secrets &gt; GEMINI_API_KEY</em>).
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Asistente de Prompts Gemini 3.8 Flash Integrado:</strong> La función <em>"Mejorar con IA"</em> de este estudio usa Gemini 3.8 Flash para transformar ideas simples en descripciones de nivel director de fotografía con iluminación y lentes específicos.
            </div>
          </div>
        </div>
      </div>

      {/* Prompting Guide */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <span>Fórmula para Escribir Prompts de Video Efectivos</span>
        </h2>

        <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
          <p className="text-zinc-400">
            A diferencia de los generadores de imágenes estáticas, los modelos de video necesitan instrucciones de <strong>movimiento, tiempo y física</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">1. Sujeto y Acción</span>
              <p className="text-xs text-zinc-300 mt-1">
                Describe qué hace el sujeto en tiempo presente (ej: "un tigre de bengala camina pausadamente sobre un tronco cubierto de musgo").
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">2. Movimiento de Cámara</span>
              <p className="text-xs text-zinc-300 mt-1">
                Define el punto de vista (ej: "dron en avance continuo", "acercamiento dolly in lento", "cámara fija con desenfoque de fondo").
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">3. Iluminación y Clima</span>
              <p className="text-xs text-zinc-300 mt-1">
                Aporta atmósfera y volumen (ej: "luz de hora dorada filtrada entre la niebla", "destellos de neón reflejados en charcos").
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">4. Velocidad y Ritmo</span>
              <p className="text-xs text-zinc-300 mt-1">
                Aclara la cadencia temporal (ej: "cámara lenta a 60fps", "movimiento hiperrealista natural", "lapso de tiempo suave").
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
