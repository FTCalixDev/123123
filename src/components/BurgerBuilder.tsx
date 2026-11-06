import React, { useState } from 'react';
import { Sparkles, ShoppingBag, Plus, Minus, Check, Flame, RefreshCw } from 'lucide-react';
import { sound } from '../utils/audio';

interface BurgerBuilderProps {
  onAddCustomBurger: (burger: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    customNotes: string;
    image: string;
  }) => void;
}

export const BurgerBuilder: React.FC<BurgerBuilderProps> = ({ onAddCustomBurger }) => {
  // Config state
  const [bun, setBun] = useState<'papa' | 'brioche' | 'singluten'>('papa');
  const [patties, setPatties] = useState<number>(2);
  const [pattyType, setPattyType] = useState<'angus' | 'veggie'>('angus');
  const [cheeses, setCheeses] = useState<string[]>(['cheddar']);
  const [toppings, setToppings] = useState<string[]>(['panceta', 'cebolla_chapa']);
  const [sauces, setSauces] = useState<string[]>(['salsa_brasa']);
  const [customName, setCustomName] = useState<string>('Smash Master Custom');

  // Base price calculation
  const basePrice = 280; // Bun + 1 patty
  const extraPattiesPrice = (patties - 1) * 90;
  const cheesePrice = cheeses.length * 30;
  const toppingsPrice = toppings.length * 35;
  const totalPrice = basePrice + extraPattiesPrice + cheesePrice + toppingsPrice;

  // Toggle selection helpers
  const toggleCheese = (id: string) => {
    if (cheeses.includes(id)) {
      if (cheeses.length > 1) setCheeses(cheeses.filter((c) => c !== id));
    } else {
      setCheeses([...cheeses, id]);
    }
  };

  const toggleTopping = (id: string) => {
    if (toppings.includes(id)) {
      setToppings(toppings.filter((t) => t !== id));
    } else {
      setToppings([...toppings, id]);
    }
  };

  const toggleSauce = (id: string) => {
    if (sauces.includes(id)) {
      if (sauces.length > 1) setSauces(sauces.filter((s) => s !== id));
    } else {
      setSauces([...sauces, id]);
    }
  };

  const handleAddToCart = () => {
    sound.playChime();
    const details = [
      `Pan: ${bun === 'papa' ? 'Pan de Papa' : bun === 'brioche' ? 'Pan Brioche' : 'Pan Sin Gluten'}`,
      `${patties}x Medallón ${pattyType === 'angus' ? 'Angus Smash (110g c/u)' : 'Veggie de Hongos'}`,
      `Quesos: ${cheeses.join(', ')}`,
      `Toppings: ${toppings.join(', ')}`,
      `Salsas: ${sauces.join(', ')}`,
      'Incluye papas rústicas'
    ].join(' • ');

    onAddCustomBurger({
      id: `custom-smash-${Date.now()}`,
      name: customName || 'Smash Personalizada',
      price: totalPrice,
      quantity: 1,
      customNotes: details,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    });
  };

  return (
    <section id="burger-builder" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Laboratorio Smash Interactivo</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Diseñá tu Propia <span className="text-orange-500">Smash Burger</span>
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm max-w-md">
            Elegí tus ingredientes paso a paso. Mirá cómo se apila en tiempo real y agregala a tu pedido directo a la cocina.
          </p>
        </div>

        {/* Builder Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (8 cols) */}
          <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
            {/* 1. Tipo de Pan */}
            <div>
              <label className="text-xs font-bold uppercase text-stone-400 tracking-wider block mb-2.5">
                1. Selección de Pan Artesanal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'papa', label: 'Pan de Papa', desc: 'Esponjoso & mantecoso' },
                  { id: 'brioche', label: 'Brioche Dorado', desc: 'Toque dulce tostado' },
                  { id: 'singluten', label: 'Sin Gluten', desc: 'Apto celíacos' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBun(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      bun === item.id
                        ? 'bg-orange-500/20 text-orange-200 border-orange-500 shadow-sm'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Medallones Smash */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase text-stone-400 tracking-wider">
                  2. Medallones Smash a la Plancha
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPattyType('angus')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      pattyType === 'angus' ? 'bg-orange-600 text-white' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    100% Angus
                  </button>
                  <button
                    onClick={() => setPattyType('veggie')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                      pattyType === 'veggie' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    Veggie Hongos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 1, label: 'Simple (110g)', price: '$280' },
                  { count: 2, label: 'Doble (220g)', price: '+$90' },
                  { count: 3, label: 'Triple (330g)', price: '+$180' },
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setPatties(item.count)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      patties === item.count
                        ? 'bg-orange-500/20 text-orange-200 border-orange-500 shadow-sm'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-amber-400 font-semibold mt-0.5">{item.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Quesos Fundentes */}
            <div>
              <label className="text-xs font-bold uppercase text-stone-400 tracking-wider block mb-2.5">
                3. Quesos Fundentes (+ $30 c/u)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'cheddar', label: 'Cheddar Americano' },
                  { id: 'provoleta', label: 'Provoleta a la Chapa' },
                  { id: 'suizo', label: 'Suizo Emmental' },
                  { id: 'azul', label: 'Azul Fundido' },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => toggleCheese(q.id)}
                    className={`p-2.5 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-between text-left transition-all min-w-0 ${
                      cheeses.includes(q.id)
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <span className="truncate">{q.label}</span>
                    {cheeses.includes(q.id) && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Toppings & Agregados */}
            <div>
              <label className="text-xs font-bold uppercase text-stone-400 tracking-wider block mb-2.5">
                4. Toppings & Ingredientes Crocantes (+ $35 c/u)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'panceta', label: 'Panceta Ahumada' },
                  { id: 'cebolla_chapa', label: 'Cebolla Plancha' },
                  { id: 'cebolla_crispy', label: 'Cebolla Crispy' },
                  { id: 'pepinillos', label: 'Pepinillos' },
                  { id: 'jalapenos', label: 'Jalapeños' },
                  { id: 'huevo', label: 'Huevo Plancha' },
                  { id: 'champignones', label: 'Hongos Manteca' },
                  { id: 'rucula', label: 'Rúcula Salvaje' },
                ].map((top) => (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopping(top.id)}
                    className={`p-2.5 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-between text-left transition-all min-w-0 ${
                      toppings.includes(top.id)
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-sm'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <span className="truncate">{top.label}</span>
                    {toppings.includes(top.id) && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Salsas Especiales */}
            <div>
              <label className="text-xs font-bold uppercase text-stone-400 tracking-wider block mb-2.5">
                5. Salsas de la Casa (Gratis)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'salsa_brasa', label: 'Secreta Brasa' },
                  { id: 'alioli_asado', label: 'Alioli Asado' },
                  { id: 'barbacoa', label: 'Barbacoa Bourbon' },
                  { id: 'mayo_trufa', label: 'Mayo Trufada' },
                  { id: 'miel_picante', label: 'Miel Picante' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSauce(s.id)}
                    className={`p-2 rounded-xl border text-[11px] sm:text-xs font-medium flex items-center justify-between text-left transition-all min-w-0 ${
                      sauces.includes(s.id)
                        ? 'bg-stone-800 text-stone-100 border-orange-500/50'
                        : 'bg-stone-950 text-stone-500 border-stone-800'
                    }`}
                  >
                    <span className="truncate">{s.label}</span>
                    {sauces.includes(s.id) && <Check className="w-3 h-3 text-orange-400 shrink-0 ml-1" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Stack & Order Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between sticky top-24 shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                <span className="text-xs font-bold uppercase text-orange-400 tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  <span>Tu Creación</span>
                </span>
                <span className="text-xs text-stone-400 font-medium">Incluye Papas Rústicas</span>
              </div>

              {/* Name your burger */}
              <div className="mt-4">
                <label className="text-[11px] text-stone-400 font-semibold block mb-1">Nombre de tu Burger:</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-bold text-sm focus:border-orange-500 focus:outline-none"
                  placeholder="Ej. La Furia de Tacuarembó"
                />
              </div>

              {/* Visual Layer Simulator */}
              <div className="my-6 p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex flex-col items-center gap-1.5 py-8 min-h-[260px] justify-center relative overflow-hidden">
                {/* Top bun */}
                <div className="w-44 h-9 rounded-t-full bg-gradient-to-b from-amber-600 to-amber-700 shadow-md flex items-center justify-center text-[10px] text-amber-200 font-black uppercase tracking-wider border-b-2 border-amber-800">
                  Pan {bun.toUpperCase()}
                </div>

                {/* Sauces layer */}
                {sauces.length > 0 && (
                  <div className="w-36 h-2 rounded-full bg-orange-600/80 animate-pulse"></div>
                )}

                {/* Toppings layers */}
                {toppings.map((top) => (
                  <div
                    key={top}
                    className="w-40 py-0.5 rounded-full bg-stone-800 border border-orange-500/40 text-[9px] text-center font-bold text-orange-200 capitalize"
                  >
                    {top.replace('_', ' ')}
                  </div>
                ))}

                {/* Patties & Cheeses */}
                {Array.from({ length: patties }).map((_, i) => (
                  <React.Fragment key={i}>
                    {/* Cheese melt */}
                    <div className="w-44 h-2.5 rounded bg-amber-400/90 shadow-sm border-t border-amber-300"></div>
                    {/* Smash patty */}
                    <div className="w-42 h-5 rounded-md bg-stone-900 border-2 border-stone-950 text-[10px] text-center text-stone-400 font-bold flex items-center justify-center shadow-inner">
                      Smash Patty #{i + 1} (110g)
                    </div>
                  </React.Fragment>
                ))}

                {/* Bottom bun */}
                <div className="w-44 h-6 rounded-b-2xl bg-gradient-to-t from-amber-700 to-amber-600 shadow-md flex items-center justify-center text-[9px] text-amber-300 font-bold uppercase border-t border-amber-800">
                  Base Tostada con Manteca
                </div>
              </div>

              {/* Summary tags */}
              <div className="space-y-1.5 text-xs text-stone-300 bg-stone-950 p-3.5 rounded-xl border border-stone-800/80">
                <div className="flex justify-between">
                  <span className="text-stone-400">Medallones:</span>
                  <span className="font-bold text-white">{patties}x {pattyType === 'angus' ? 'Angus' : 'Veggie'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Quesos seleccionados:</span>
                  <span className="font-medium text-amber-300">{cheeses.length} variedades</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Toppings agregados:</span>
                  <span className="font-medium text-orange-300">{toppings.length} ingredientes</span>
                </div>
              </div>
            </div>

            {/* Price & Add to Order CTA */}
            <div className="pt-6 border-t border-stone-800 mt-6 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs uppercase font-bold text-stone-400">Total Burger:</span>
                <span className="font-display text-4xl font-black text-amber-400 ember-glow">
                  ${totalPrice} <span className="text-sm font-sans font-bold text-stone-400">$U</span>
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-6 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar mi Creación al Pedido</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
