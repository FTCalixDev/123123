import React, { useState } from 'react';
import { Sparkles, X, Beer, Utensils, Check, ArrowRight, RefreshCw, Flame } from 'lucide-react';
import { SommelierRecommendation } from '../types/restaurant';
import { sound } from '../utils/audio';

interface AiSommelierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComboToCart: (beerName: string, dishName: string) => void;
}

export const AiSommelierModal: React.FC<AiSommelierModalProps> = ({
  isOpen,
  onClose,
  onAddComboToCart,
}) => {
  const [preference, setPreference] = useState('');
  const [selectedDish, setSelectedDish] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<SommelierRecommendation | null>(null);

  if (!isOpen) return null;

  const handleAskSommelier = async (customText?: string) => {
    const textToSubmit = customText || preference;
    if (!textToSubmit.trim()) return;

    sound.playChime();
    setIsLoading(true);
    setRecommendation(null);

    try {
      const res = await fetch('/api/ai/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPreference: textToSubmit,
          selectedDish: selectedDish || undefined,
        }),
      });
      const data = await res.json();
      if (data.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-stone-950/80 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Maestro Cervecero IA</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Sommelier & Asesor de Maridaje
          </h2>
          <p className="text-xs text-stone-400 leading-relaxed">
            Contale al sommelier de Brasa & Lúpulo qué sabor tenés ganas de probar o qué estado de ánimo tenés, y te recomendará el maridaje perfecto entre nuestras 8 canillas y la carta de horno a leña.
          </p>
        </div>

        {/* Input & Quick Presets */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              placeholder="Ej. Quiero algo bien picante o con mucho queso cheddar..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-xs placeholder-stone-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              onClick={() => handleAskSommelier()}
              disabled={isLoading || !preference.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Consultar'}
            </button>
          </div>

          {/* Quick Idea Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              'Algo con queso bien cremoso y una IPA',
              'Pizza con miel picante al horno de barro',
              'Quiero una cerveza dulce y suave',
              'Picada caliente para compartir entre 3',
            ].map((idea, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setPreference(idea);
                  handleAskSommelier(idea);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-950 text-stone-400 border border-stone-800 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation Result Card */}
        {recommendation && (
          <div className="p-5 rounded-2xl bg-stone-950 border border-amber-500/30 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  Maridaje Recomendado
                </span>
                <h3 className="font-display text-xl font-black text-white uppercase mt-0.5">
                  {recommendation.dishName} + {recommendation.beerName}
                </h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20 shrink-0">
                Match Perfecto
              </span>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans bg-stone-900/60 p-3 rounded-xl border border-stone-800/80">
              "{recommendation.whyItWorks}"
            </p>

            {/* Tasting notes */}
            {recommendation.tastingNotes && (
              <div className="flex flex-wrap gap-1.5">
                {recommendation.tastingNotes.map((note, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900 text-stone-300 border border-stone-800 font-medium"
                  >
                    ✓ {note}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400 font-medium">
                Servir a: <strong className="text-white">{recommendation.servingTemp}</strong>
              </span>

              <button
                onClick={() => {
                  sound.playChime();
                  onAddComboToCart(recommendation.beerName, recommendation.dishName);
                  onClose();
                }}
                className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Agregar Maridaje al Carrito</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
