import React, { useState } from 'react';
import {
  Utensils, Search, Sparkles, Plus, Check, Info, Flame,
  Leaf, Clock, ArrowRight, ShieldCheck, Heart
} from 'lucide-react';
import { MenuItem, MenuCategory } from '../types/restaurant';
import { sound } from '../utils/audio';

interface DigitalMenuProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem, notes?: string) => void;
}

export const DigitalMenu: React.FC<DigitalMenuProps> = ({ items, onAddToCart }) => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<'all' | 'popular' | 'veggie' | 'spicy' | 'glutenFree'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category check
    if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
      return false;
    }
    // Tag check
    if (filterTag === 'popular' && !item.isPopular) return false;
    if (filterTag === 'veggie' && !item.isVeggie) return false;
    if (filterTag === 'spicy' && !item.isSpicy) return false;
    if (filterTag === 'glutenFree' && !item.isGlutenFree) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchIng = item.ingredients?.some((ing) => ing.toLowerCase().includes(q));
      return matchName || matchDesc || matchIng;
    }
    return true;
  });

  return (
    <section id="menu" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
              <Utensils className="w-3.5 h-3.5" />
              <span>Carta Digital & Menú de Salón</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Nuestra <span className="text-orange-500">Carta Completa</span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar plato, cheddar, masa..."
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-2 overflow-x-auto">
          {[
            { id: 'todos', label: 'Todo el Menú' },
            { id: 'burgers', label: 'Smash Burgers (5)' },
            { id: 'pizzas', label: 'Pizzas al Barro (4)' },
            { id: 'picadas', label: 'Papas & Picadas (3)' },
            { id: 'bebidas', label: 'Tragos & Cervezas (4)' },
            { id: 'postres', label: 'Postres a la Leña (2)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as MenuCategory)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'bg-stone-900 text-stone-400 border border-stone-800 hover:text-stone-200 hover:border-stone-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Dietary / Preference Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-8 text-xs">
          <span className="text-stone-500 font-semibold mr-1">Filtrar por:</span>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'popular', label: '⭐ Más Vendidos' },
            { id: 'veggie', label: '🌱 100% Veggie' },
            { id: 'spicy', label: '🌶️ Picante Suave' },
            { id: 'glutenFree', label: '🌾 Apto Celíacos' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTag(tag.id as any)}
              className={`px-3 py-1 rounded-lg border transition-all ${
                filterTag === tag.id
                  ? 'bg-stone-800 text-amber-300 border-amber-500/60 font-bold'
                  : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-300'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className="group relative bg-stone-900 border border-stone-800 hover:border-stone-700 rounded-3xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                {/* Image and Badges */}
                <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
                  />

                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {item.badge && (
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-950/80 backdrop-blur text-[10px] font-bold text-amber-400 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                    {item.isVeggie && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        Veggie
                      </span>
                    )}
                  </div>

                  {item.cookingTime && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur text-[10px] font-semibold text-stone-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{item.cookingTime}</span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-orange-400 transition-colors uppercase leading-snug mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-stone-400 leading-relaxed line-clamp-3 mb-3">
                      {item.description}
                    </p>

                    {/* Expand details toggle */}
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold mb-3 flex items-center gap-1 transition-colors"
                    >
                      <Info className="w-3 h-3" />
                      <span>{isExpanded ? 'Ocultar ingredientes' : '+ Ver ingredientes y maridaje'}</span>
                    </button>

                    {/* Expandable details drawer */}
                    {isExpanded && (
                      <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-300 space-y-2 mb-3 animate-fade-in">
                        <div>
                          <strong className="text-stone-400 block mb-1">Ingredientes & Elaboración:</strong>
                          <ul className="list-disc list-inside space-y-0.5 text-stone-400">
                            {item.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        {item.pairingSuggestion && (
                          <div className="pt-2 border-t border-stone-800/80 text-amber-300">
                            <strong>Maridaje sugerido:</strong> {item.pairingSuggestion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price & Action footer */}
                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-display text-2xl font-black text-white">
                        ${item.price}
                      </span>
                      <span className="text-[11px] font-sans font-bold text-amber-400 ml-1">$U</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/59899887766?text=Hola%20Brasa%20%26%20L%C3%BApulo!%20Quiero%20pedir:%20${encodeURIComponent(item.name)}%20(%24${item.price}%20%24U)`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
                        title="Pedir directo a WhatsApp"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => {
                          sound.playChime();
                          onAddToCart(item);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pedir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
