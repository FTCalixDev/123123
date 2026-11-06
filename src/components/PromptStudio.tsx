import React, { useState, useRef } from 'react';
import {
  Sparkles, Video, Image as ImageIcon, Wand2, Sliders, Play,
  RefreshCw, Check, AlertCircle, Upload, X, Send, Eye, ShieldAlert
} from 'lucide-react';
import { AspectRatio, VideoDuration, VideoResolution, GenerationMode, GeneratedVideo, StylePreset, CameraMotionPreset } from '../types/video';
import { STYLE_PRESETS, CAMERA_PRESETS, SAMPLE_REFERENCE_IMAGES, SHOWCASE_VIDEOS } from '../data/presets';

interface PromptStudioProps {
  onVideoGenerated: (video: GeneratedVideo) => void;
  onPreviewSample: (sample: any) => void;
  initialPrompt?: string;
  initialStyle?: string;
  initialCamera?: string;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
  onVideoGenerated,
  onPreviewSample,
  initialPrompt = '',
  initialStyle = '',
  initialCamera = '',
}) => {
  const [mode, setMode] = useState<GenerationMode>('text-to-video');
  const [prompt, setPrompt] = useState(initialPrompt || 'Un majestuoso leopardo de las nieves caminando sobre una cresta rocosa en el Himalaya durante una suave tormenta de nieve al atardecer, luz dorada.');
  const [negativePrompt, setNegativePrompt] = useState('borroso, baja calidad, artefactos, glitch, distorsión, texto, marcas de agua');
  const [showNegative, setShowNegative] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [duration, setDuration] = useState<VideoDuration>('10s');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle || 'cinematic');
  const [selectedCamera, setSelectedCamera] = useState<string>(initialCamera || 'dynamic');

  // Image-to-video state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading & Generation states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaidKeyError, setIsPaidKeyError] = useState(false);

  // Sync initial props if changed
  React.useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (initialStyle) {
      const match = STYLE_PRESETS.find(s => s.name.toLowerCase() === initialStyle.toLowerCase() || s.id === initialStyle);
      if (match) setSelectedStyle(match.id);
    }
    if (initialCamera) {
      const match = CAMERA_PRESETS.find(c => c.name.toLowerCase() === initialCamera.toLowerCase() || c.id === initialCamera);
      if (match) setSelectedCamera(match.id);
    }
  }, [initialPrompt, initialStyle, initialCamera]);

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setSelectedImage(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Enhance prompt with Gemini 3.8 Flash
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setErrorMessage(null);

    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const cameraObj = CAMERA_PRESETS.find(c => c.id === selectedCamera);

    try {
      const res = await fetch('/api/prompt/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style: styleObj ? styleObj.name : 'Cine fotorrealista',
          cameraMotion: cameraObj ? cameraObj.name : 'Dinámico suave'
        }),
      });

      const data = await res.json();
      if (res.ok && data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      } else {
        setErrorMessage(data.error || 'No se pudo mejorar el prompt automáticamente.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error de red al conectar con el asistente de prompts.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Quick random inspiration
  const handleQuickInspiration = () => {
    const inspirations = [
      'Una pequeña criatura mágica luminiscente volando entre hongos gigantes en un bosque nocturno de Pandora, partículas de polvo flotante bioluminiscente.',
      'Un tren de vapor futurista levitando sobre rieles de luz azul a través de un cañón desértico rojo al amanecer, humo denso dispersándose con el viento.',
      'Primer plano cinematográfico de una gota de lluvia cayendo en cámara lenta y refractando un arcoíris antes de chocar contra una hoja verde esmeralda.',
      'Toma aérea con dron siguiendo a un surfista cabalgando una ola tubular gigante en Tahití durante la puesta de sol dorada, rocío de agua iluminado por el contraluz.',
      'Metrópolis submarina con cúpulas de cristal donde nadan ballenas mecánicas gigantes entre arrecifes de coral bioluminiscentes de colores vivos.'
    ];
    const random = inspirations[Math.floor(Math.random() * inspirations.length)];
    setPrompt(random);
  };

  // Video generation handler
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Por favor ingresa una descripción para tu video.');
      return;
    }
    if (mode === 'image-to-video' && !selectedImage) {
      setErrorMessage('Por favor selecciona o sube una imagen inicial para animar.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(5);
    setStatusMessage('Conectando con gemini-omni-1.2-flash (Veo)...');
    setErrorMessage(null);
    setIsPaidKeyError(false);

    // Simulate steady progress steps for user feedback during the API call
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 25) {
          setStatusMessage('Analizando instrucciones cinemáticas y física de escena...');
          return prev + 3;
        } else if (prev < 55) {
          setStatusMessage('Calculando coherencia temporal y movimiento de cámara...');
          return prev + 2;
        } else if (prev < 85) {
          setStatusMessage('Renderizando cuadros de video y aplicando gradación de color...');
          return prev + 1;
        } else if (prev < 95) {
          setStatusMessage('Finalizando codificación MP4...');
          return prev + 0.5;
        }
        return prev;
      });
    }, 1200);

    const styleObj = STYLE_PRESETS.find(s => s.id === selectedStyle);
    const cameraObj = CAMERA_PRESETS.find(c => c.id === selectedCamera);

    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode,
          imageData: selectedImage,
          imageMimeType: imageMime,
          aspectRatio,
          duration,
          resolution,
          style: styleObj ? styleObj.promptModifier : '',
          cameraMotion: cameraObj ? cameraObj.promptModifier : ''
        }),
      });

      clearInterval(progressInterval);
      const data = await response.json();

      if (response.ok && data.success && data.videoUrl) {
        setGenerationProgress(100);
        setStatusMessage('¡Video generado con éxito!');

        const newVideo: GeneratedVideo = {
          id: data.interactionId || `vid-${Date.now()}`,
          url: data.videoUrl,
          prompt: data.prompt || prompt,
          negativePrompt,
          mode,
          aspectRatio,
          duration,
          resolution,
          style: styleObj?.name,
          cameraMotion: cameraObj?.name,
          sourceImage: selectedImage || undefined,
          createdAt: data.createdAt || new Date().toISOString(),
        };

        onVideoGenerated(newVideo);
      } else {
        clearInterval(progressInterval);
        setIsPaidKeyError(Boolean(data.isPaidKeyIssue || response.status === 403));
        setErrorMessage(data.error || 'No se pudo generar el video con el modelo.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Error generating video:', err);
      setErrorMessage(err.message || 'Error de conexión con el servidor.');
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  // Provide fallback sample demonstration in case user wants to test the player without a paid key
  const handleTryDemoSample = () => {
    const sample = SHOWCASE_VIDEOS[0];
    const demoVideo: GeneratedVideo = {
      id: `demo-${Date.now()}`,
      url: sample.videoUrl,
      prompt: prompt || sample.prompt,
      mode,
      aspectRatio,
      duration,
      resolution,
      style: STYLE_PRESETS.find(s => s.id === selectedStyle)?.name || 'Cine Fotorrealista',
      cameraMotion: CAMERA_PRESETS.find(c => c.id === selectedCamera)?.name || 'Dron',
      createdAt: new Date().toISOString(),
      isDemo: true
    };
    onVideoGenerated(demoVideo);
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setMode('text-to-video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              mode === 'text-to-video'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Texto a Video (T2V)</span>
          </button>

          <button
            onClick={() => setMode('image-to-video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              mode === 'image-to-video'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagen a Video (I2V)</span>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickInspiration}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Inspiración Rápida</span>
          </button>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-sm">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Mode: Image to Video initial frame selector */}
        {mode === 'image-to-video' && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-400" />
                <span>Fotograma Inicial (Imagen a animar)</span>
              </label>
              {selectedImage && (
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Quitar imagen</span>
                </button>
              )}
            </div>

            {selectedImage ? (
              <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-rose-500/50 group">
                <img src={selectedImage} alt="Referencia inicial" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] text-white font-medium">Lista para animar</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/40 hover:bg-zinc-950/80"
                >
                  <Upload className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                  <p className="text-xs font-semibold text-zinc-200">
                    Haz clic para subir una foto o ilustración desde tu equipo
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-1">Soporta PNG, JPG o WebP (hasta 10MB)</p>
                </div>

                {/* Preset sample images */}
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium block mb-2">O prueba una imagen de muestra:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {SAMPLE_REFERENCE_IMAGES.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => {
                          setSelectedImage(sample.url);
                          setPrompt(sample.suggestedPrompt);
                        }}
                        className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 cursor-pointer transition-all flex items-center gap-2 group"
                      >
                        <img src={sample.url} alt={sample.title} className="w-10 h-10 rounded-lg object-cover" />
                        <span className="text-xs text-zinc-300 group-hover:text-white font-medium truncate">{sample.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt Input Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-rose-400" />
              <span>Prompt de Dirección Cinematográfica</span>
            </label>

            {/* AI Prompt Enhancer button */}
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !prompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500/20 to-rose-500/20 hover:from-indigo-500/30 hover:to-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Usa Gemini 3.8 Flash para expandir tu prompt con iluminación y lentes de cine"
            >
              <Sparkles className={`w-3.5 h-3.5 text-rose-400 ${isEnhancing ? 'animate-spin' : ''}`} />
              <span>{isEnhancing ? 'Optimizando con Gemini...' : 'Mejorar con IA ✨'}</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe la escena, sujeto, iluminación, movimiento y emoción deseada..."
              className="w-full p-4 rounded-2xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-zinc-500 text-sm leading-relaxed resize-none transition-colors"
            />
            <div className="absolute bottom-3 right-3 text-[11px] text-zinc-500 font-mono">
              {prompt.length} caracteres
            </div>
          </div>

          {/* Toggle Negative Prompt */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 font-medium"
            >
              <span>{showNegative ? '− Ocultar prompt negativo' : '+ Agregar prompt negativo (evitar defectos)'}</span>
            </button>

            {showNegative && (
              <div className="mt-2 animate-fade-in">
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Elementos a evitar (ej. borroso, baja calidad, artefactos)"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500 text-xs text-zinc-300 placeholder-zinc-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cinematography Controls Grid */}
        <div className="mt-7 pt-6 border-t border-zinc-800/80 space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Parámetros de Cámara y Formato</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Relación de Aspecto</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    aspectRatio === '16:9'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="w-3.5 h-2 border border-current rounded-[2px]"></span>
                  <span>16:9 Cine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    aspectRatio === '9:16'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/40'
                  }`}
                >
                  <span className="w-2 h-3.5 border border-current rounded-[2px]"></span>
                  <span>9:16 Shorts</span>
                </button>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Duración de Video</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['3s', '5s', '10s', '15s'] as VideoDuration[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                      duration === d
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/40'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Resolución de Salida</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['360p', '720p', '1080p'] as VideoResolution[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                      resolution === r
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                        : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/40'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Style Presets */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Estilo Visual Cinematográfico</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedStyle === style.id
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                  title={style.description}
                >
                  <span>{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Camera Motion Presets */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Movimiento de Cámara</label>
            <div className="flex flex-wrap gap-2">
              {CAMERA_PRESETS.map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={() => setSelectedCamera(cam.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedCamera === cam.id
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800/60 hover:text-zinc-200'
                  }`}
                  title={cam.description}
                >
                  <span>{cam.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error / Alert notice */}
        {errorMessage && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 space-y-2 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-semibold text-rose-100 mb-0.5">
                  {isPaidKeyError ? 'Modelo de Video Requiere Clave con Facturación Habilitada' : 'Aviso de Generación'}
                </strong>
                <span>{errorMessage}</span>
                {isPaidKeyError && (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    El modelo <code className="text-rose-300">gemini-omni-1.2-flash</code> (Veo) está activo para cuentas con facturación configurada en Google AI Studio (Settings &gt; Secrets). Puedes también probar la reproducción de demostración a continuación:
                  </p>
                )}
              </div>
            </div>

            {isPaidKeyError && (
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleTryDemoSample}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium border border-rose-500/30 transition-colors flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-rose-300" />
                  <span>Probar Visualizador con Video de Muestra</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Button & Progress */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 flex flex-col gap-3">
          {isGenerating ? (
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-rose-400 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
                <span className="font-mono text-rose-400 font-bold">{Math.round(generationProgress)}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-zinc-500 text-center">
                La síntesis temporal y física de video con IA toma aproximadamente 30-90 segundos. Por favor espera...
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:from-rose-600 hover:via-rose-700 hover:to-amber-600 text-white font-bold text-sm sm:text-base transition-all shadow-xl shadow-rose-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              <span>Generar Video con Veo (gemini-omni-1.2-flash)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
