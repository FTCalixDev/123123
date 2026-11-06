import React, { useState } from 'react';
import { Flame, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { MenuItem } from '../types/restaurant';
import { sound } from '../utils/audio';

interface SpecialtiesCarouselProps {
  onAddToCart: (item: MenuItem) => void;
}

export const SpecialtiesCarousel: React.FC<SpecialtiesCarouselProps> = ({ onAddToCart }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const specialties: MenuItem[] = [
    {
      id: 'triple-fuego-jalapeno',
      name: 'Triple Fuego & Jalapeño',
      category: 'burgers',
      price: 460,
      description: 'Triple medallón smash con provolone fundido al soplete, panceta ahumada a la leña, alioli de morrones asados y jalapeños en pan brioche.',
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&w=800&q=80',
      badge: 'Top 1 Ventas',
      ingredients: ['3x Medallón Smash (300g)', 'Cheddar & Provolone', 'Panceta ahumada', 'Jalapeños', 'Alioli de morrones asados', 'Papas rústicas'],
      pairingSuggestion: 'Tap 5: Hazy Neipa Bruma Tropical'
    },
    {
      id: 'pizza-pepperoni-miel-picante',
      name: 'Pepperoni & Miel Picante',
      category: 'pizzas',
      price: 550,
      description: 'Muzzarella gratinada a 420°C sobre piso de piedra refractaria, láminas de pepperoni curado crocante y miel tibia infusionada con ajíes secos.',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
      badge: 'Horno de Barro a Leña',
      ingredients: ['Masa madre fermentada 48hs', 'Salsa pomodoro casera', 'Muzzarella abundante', 'Pepperoni curado', 'Miel tibia infusionada (8 porciones)'],
      pairingSuggestion: 'Tap 7: Red IPA Fuego Criollo'
    },
    {
      id: 'tabla-cervecera-caliente',
      name: 'Gran Tabla Cervecera Caliente',
      category: 'picadas',
      price: 790,
      description: 'Bastones de muzzarella apanada, aros de cebolla a la cerveza, pollo crispy, salchichas ahumadas, papas rústicas y trío de salsas caseras.',
      image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
      badge: 'Para Compartir (3-4 pers)',
      ingredients: ['Bastones de muzzarella', 'Pollo crispy', 'Aros de cebolla', 'Papas rústicas', 'Dip barbacoa bourbon', 'Dip alioli ajo asado', 'Dip cheddar caliente'],
      pairingSuggestion: 'Tap 1: Furia Citra IPA'
    }
  ];

  const current = specialties[selectedIdx];

  return (
    <section id="especialidades" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">
              <Flame className="w-3.5 h-3.5" />
              <span>Platos Insignia de la Casa</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Especialidades de <span className="text-amber-400">Tacuarembó</span>
            </h2>
          </div>
          <p className="text-stone-400 text-xs sm:text-sm max-w-md">
            Tocá cualquier tarjeta para ponerla en primer plano y ver sus ingredientes o pedirla con un clic.
          </p>
        </div>

        {/* 3D Stack Carousel */}
        <div className="flex flex-col lg:flex-row items-center gap-6 justify-center">
          {specialties.map((item, idx) => {
            const isSelected = selectedIdx === idx;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIdx(idx)}
                className={`cursor-pointer transition-all duration-500 rounded-3xl overflow-hidden border relative flex flex-col justify-end p-6 ${
                  isSelected
                    ? 'w-full lg:w-[42%] h-[400px] border-orange-500 shadow-2xl shadow-orange-500/20 scale-100 z-10'
                    : 'w-full lg:w-[28%] h-[320px] border-stone-800 opacity-60 hover:opacity-90 scale-95 hover:scale-98'
                }`}
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(12, 10, 9, 0.98) 15%, rgba(12, 10, 9, 0.45) 60%, rgba(12, 10, 9, 0.1) 100%), url(${item.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-orange-600 text-white font-black text-[11px] uppercase tracking-wider">
                    {item.badge}
                  </span>
                  <h3 className="font-display text-2xl font-bold uppercase text-white">
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-display text-2xl font-black text-amber-400">
                      ${item.price} <span className="text-xs font-sans text-stone-400">$U</span>
                    </span>

                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sound.playChime();
                          onAddToCart(item);
                        }}
                        className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Pedir al Carrito</span>
                      </button>
                    )}
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
