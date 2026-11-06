import React, { useRef, useState, useEffect } from 'react';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2,
  Download, Copy, Check, Sparkles, Sliders, Ratio, Clock, Layers
} from 'lucide-react';
import { GeneratedVideo, ShowcaseItem } from '../types/video';

interface VideoPlayerModalProps {
  video: GeneratedVideo | ShowcaseItem | null;
  onClose: () => void;
  onUsePrompt?: (prompt: string, style?: string, camera?: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onUsePrompt,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (video) {
      setCurrentTime(0);
      setIsPlaying(true);
      // Auto-play when opened
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }, 150);
    }
  }, [video]);

  if (!video) return null;

  const videoUrl = 'videoUrl' in video ? video.videoUrl : video.url;
  const prompt = video.prompt;
  const style = 'style' in video ? video.style : undefined;
  const camera = 'camera' in video ? video.camera : ('cameraMotion' in video ? video.cameraMotion : undefined);
  const title = 'title' in video ? video.title : 'Video Generado con Veo';
  const durationLabel = 'duration' in video ? video.duration : '10s';
  const resolutionLabel = 'resolution' in video ? video.resolution : '720p';
  const isVertical = video.aspectRatio === '9:16';

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `veo-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-zinc-950/70 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Canvas Column */}
        <div className="flex-1 bg-black flex flex-col items-center justify-center relative min-h-[320px] lg:min-h-[520px] p-2">
          <div className={`relative flex items-center justify-center w-full h-full ${isVertical ? 'max-w-[340px]' : 'max-w-3xl'}`}>
            <video
              ref={videoRef}
              src={videoUrl}
              loop={isLooping}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
              className="w-full h-auto max-h-[70vh] object-contain rounded-lg cursor-pointer shadow-lg"
            />

            {/* Big center play icon overlay if paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
              >
                <Play className="w-7 h-7 ml-1" />
              </button>
            )}
          </div>

          {/* Video Control Bar */}
          <div className="w-full max-w-3xl px-4 py-2 mt-2 bg-zinc-950/70 backdrop-blur rounded-xl border border-zinc-800/80 flex flex-col gap-2">
            {/* Scrubber */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-zinc-400 w-9">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-[11px] font-mono text-zinc-400 w-9">{formatTime(duration)}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                    isLooping
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Bucle {isLooping ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Descargar</span>
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Pantalla Completa"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="w-full lg:w-96 p-5 sm:p-6 bg-zinc-900/95 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  Google Veo
                </span>
                <span className="text-xs text-zinc-400 font-mono">gemini-omni-1.2-flash</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Ratio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Relación</span>
                </div>
                <div className="font-semibold text-zinc-200">{video.aspectRatio}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Duración</span>
                </div>
                <div className="font-semibold text-zinc-200">{durationLabel}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Resolución</span>
                </div>
                <div className="font-semibold text-zinc-200">{resolutionLabel}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Estilo</span>
                </div>
                <div className="font-semibold text-zinc-200 truncate">{style || 'Estándar'}</div>
              </div>
            </div>

            {/* Prompt details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">Prompt del Director</label>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto font-sans selection:bg-rose-500/30">
                {prompt}
              </div>
            </div>

            {camera && (
              <div className="text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Cámara: </span>
                {camera}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-zinc-800/80 mt-4 flex flex-col gap-2">
            {onUsePrompt && (
              <button
                onClick={() => {
                  onUsePrompt(prompt, style, camera);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Usar este Prompt en el Estudio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
