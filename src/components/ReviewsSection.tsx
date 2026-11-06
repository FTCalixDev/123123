import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Plus, Sparkles, X } from 'lucide-react';
import { Review } from '../types/restaurant';
import { sound } from '../utils/audio';

interface ReviewsSectionProps {
  reviews: Review[];
  onAddReview: (review: { name: string; rating: number; dish: string; comment: string }) => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ reviews, onAddReview }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [dish, setDish] = useState('Smash Brasa Doble');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    sound.playChime();
    setIsSubmitting(true);
    onAddReview({ name, rating, dish, comment });
    setName('');
    setComment('');
    setIsSubmitting(false);
    setModalOpen(false);
  };

  return (
    <section id="reseñas" className="py-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-500 mb-2">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Clientes & Comunidad de Tacuarembó</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              Lo que Dicen de <span className="text-amber-400">Nuestra Brasa</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 hover:border-amber-500/50 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Dejar mi Reseña</span>
            </button>
          </div>
        </div>

        {/* Rating Overview Bar */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="font-display text-5xl font-black text-amber-400 ember-glow">
              4.9
            </div>
            <div>
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div className="text-xs text-stone-400 mt-1 font-semibold">
                Basado en más de 320 opiniones en Tacuarembó
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center sm:items-start border-t sm:border-t-0 sm:border-x border-stone-800 pt-4 sm:pt-0 sm:px-6">
            <div className="text-xs uppercase font-bold text-stone-400">Puntualidad en Delivery</div>
            <div className="text-xl font-bold text-white mt-0.5">25 a 35 min promedio</div>
          </div>

          <div className="flex flex-col justify-center items-center sm:items-start border-t sm:border-t-0 border-stone-800 pt-4 sm:pt-0">
            <div className="text-xs uppercase font-bold text-stone-400">Horno & Fuego Vivo</div>
            <div className="text-xl font-bold text-orange-400 mt-0.5">Leña 100% de Espinillo</div>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                {/* User avatar & stars */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={rev.avatar}
                      alt={rev.name}
                      className="w-9 h-9 rounded-full object-cover border border-amber-500/30"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none">{rev.name}</h4>
                      <span className="text-[10px] text-stone-500">{rev.date}</span>
                    </div>
                  </div>

                  <div className="flex text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                </div>

                {/* Dish pill */}
                <div className="text-[11px] font-semibold text-amber-400/90 bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800 inline-block">
                  {rev.dish}
                </div>

                {/* Comment */}
                <p className="text-xs text-stone-300 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>

              {rev.verified && (
                <div className="pt-3 mt-3 border-t border-stone-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cliente Verificado en Tacuarembó</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-stone-950 text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-display text-2xl font-black uppercase text-white tracking-wide">
                Compartí tu Experiencia
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Tu opinión nos ayuda a perfeccionar la plancha de hierro y el horno de leña todos los días.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                  Tu Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Martín Pereira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                  ¿Qué probaste?
                </label>
                <input
                  type="text"
                  value={dish}
                  onChange={(e) => setDish(e.target.value)}
                  placeholder="Ej. Smash Brasa Doble, Pizza Pepperoni, IPA..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                  Puntuación
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : 'text-stone-700'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 tracking-wider block mb-1">
                  Tu Comentario *
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Contanos qué te pareció el sabor, la temperatura de la cerveza o la atención..."
                  className="w-full p-3 rounded-xl bg-stone-950 border border-stone-800 text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-wider text-xs shadow-lg shadow-amber-500/25 transition-all"
              >
                Publicar Reseña ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
