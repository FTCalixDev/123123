import React, { useState, useEffect } from 'react';
import { Flame, ArrowRight, ShoppingBag } from 'lucide-react';
import { Promo } from '../types/restaurant';
import { sound } from '../utils/audio';

interface HeroPromosProps {
  promos: Promo[];
  onOrderPromo: (promo: Promo) => void;
}

export const HeroPromos: React.FC<HeroPromosProps> = ({ promos, onOrderPromo }) => {
  const activePromos = (promos || []).filter((p) => p.active !== false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (activePromos.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activePromos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activePromos.length]);

  if (activePromos.length === 0) return null;
  const safeIdx = activeSlide % activePromos.length;
  const currentPromo = activePromos[safeIdx];

  return (
    <section id="promos" className="pt-6 sm:pt-8 pb-12">
      {/* Hero Showcase Container */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-800 bg-stone-900 shadow-2xl">
        {/* Visual Background with dramatic gradient overlay */}
        <div
          className="relative min-h-[480px] sm:min-h-[520px] flex items-center p-6 sm:p-12 lg:p-16 bg-cover bg-center transition-all duration-700 ease-out"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(12, 10, 9, 0.96) 0%, rgba(12, 10, 9, 0.85) 50%, rgba(12, 10, 9, 0.35) 100%), url(${currentPromo.image})`,
          }}
        >
          {/* Ambient ember glow */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Slide Content */}
          <div className="relative z-10 max-w-2xl space-y-4 sm:space-y-6">
            {/* Promo Kicker */}
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{currentPromo.pill} · {currentPromo.discount}</span>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase text-white tracking-tight leading-[1.05]">
                {currentPromo.title}
              </h1>
              <p className="text-amber-400 font-semibold text-sm sm:text-base mt-2">
                {currentPromo.subtitle}
              </p>
            </div>

            {/* Description */}
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              {currentPromo.description}
            </p>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-display text-4xl sm:text-5xl font-black text-amber-400 ember-glow tabular-nums">
                ${currentPromo.priceNow} <span className="text-sm font-sans font-bold text-stone-400">$U</span>
              </span>
              <span className="text-lg sm:text-xl text-stone-500 line-through tabular-nums">
                ${currentPromo.priceOld} $U
              </span>
              <span className="text-xs text-emerald-400 font-bold">
                · Ahorrás ${currentPromo.priceOld - currentPromo.priceNow} $U
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  sound.playChime();
                  onOrderPromo(currentPromo);
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Pedir Promo al Carrito</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Quiero%20pedir%20la%20promo:%20${encodeURIComponent(currentPromo.title)}%20por%20%24${currentPromo.priceNow}%20%24U`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700/80 text-sm font-semibold transition-all hover:border-orange-500/50"
              >
                <span>Pedir por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Carousel Slide Selector Tabs */}
        <div className="bg-stone-950/95 border-t border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Promociones Vigentes:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {activePromos.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveSlide(idx)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  safeIdx === idx
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 border border-orange-500'
                    : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
                }`}
              >
                <span>0{idx + 1}. {p.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800/80 flex items-center gap-4 hover:border-orange-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-display font-black text-xl shrink-0">
            01
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-base uppercase tracking-wide">
              100% Blend Angus Fresco
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Picado diario y aplastado en plancha de hierro fundido al momento.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800/80 flex items-center gap-4 hover:border-orange-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-display font-black text-xl shrink-0">
            02
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-base uppercase tracking-wide">
              Horno de Barro a 420°C
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Masa madre con 48hs de fermentación natural y piso crocante a la leña.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/70 border border-stone-800/80 flex items-center gap-4 hover:border-orange-500/40 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-display font-black text-xl shrink-0">
            03
          </div>
          <div>
            <h4 className="font-display font-bold text-white text-base uppercase tracking-wide">
              8 Canillas Artesanales
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Barriles frescos rotativos tirados a -2.8°C para consumir o llevar en growler.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
