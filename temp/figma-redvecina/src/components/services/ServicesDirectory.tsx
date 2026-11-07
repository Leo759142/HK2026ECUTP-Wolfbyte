import React, { useState } from 'react';
import { NeighborhoodService, ServiceCategory, User } from '../../types';
import { storage } from '../../services/storage';
import { 
  Wrench, 
  Search, 
  MapPin, 
  CheckCircle, 
  MessageCircle, 
  Star, 
  ThumbsUp, 
  ShieldAlert, 
  Phone, 
  Plus, 
  Filter, 
  ChevronRight,
  Clock,
  X
} from 'lucide-react';

interface ServicesDirectoryProps {
  services: NeighborhoodService[];
  currentUser: User;
  onOpenPublish: () => void;
  onRefresh: () => void;
}

export const ServicesDirectory: React.FC<ServicesDirectoryProps> = ({
  services,
  currentUser,
  onOpenPublish,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [emergencyFilterOnly, setEmergencyFilterOnly] = useState(false);
  const [maxDistance, setMaxDistance] = useState<number>(10);

  // Visto Bueno review modal state
  const [reviewServiceId, setReviewServiceId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewWorkDone, setReviewWorkDone] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const categories: { key: string; label: string; icon: string }[] = [
    { key: 'all', label: 'Todos', icon: '🏘️' },
    { key: 'gasfiteria', label: 'Gasfitería', icon: '🚰' },
    { key: 'electricidad', label: 'Electricidad', icon: '⚡' },
    { key: 'cerrajeria', label: 'Cerrajería', icon: '🔑' },
    { key: 'carpinteria', label: 'Carpintería', icon: '🪚' },
    { key: 'cuidados', label: 'Cuidados / Salud', icon: '❤️' },
    { key: 'clases', label: 'Clases / Tareas', icon: '📚' },
  ];

  // Filtering
  const filteredServices = services.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesEmergency = !emergencyFilterOnly || s.emergencyAvailable;
    const matchesDistance = s.distanceBlocks <= maxDistance;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.title.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.providerName.toLowerCase().includes(query) ||
      s.category.toLowerCase().includes(query);

    return matchesCategory && matchesEmergency && matchesDistance && matchesSearch;
  });

  const handleGiveVistoBueno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewServiceId) return;

    const success = storage.giveVistoBueno(reviewServiceId, {
      comment: reviewComment || 'Vecino de total confianza, trabajo prolijo y honrado.',
      workDone: reviewWorkDone || 'Servicio de mantenimiento general',
      rating: reviewRating,
    });

    if (success) {
      setFeedbackNotice('¡Visto Bueno Vecinal registrado! Sumaste 10 pts de buena vecindad.');
      setTimeout(() => setFeedbackNotice(null), 4000);
      onRefresh();
    }
    setReviewServiceId(null);
    setReviewComment('');
    setReviewWorkDone('');
  };

  const getWhatsAppLink = (phone: string, providerName: string, serviceTitle: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola ${providerName}, te escribo desde la app RedVecina del barrio. Vi tu servicio recomendado "${serviceTitle}" con Visto Bueno de los vecinos. ¿Tendrías disponibilidad para consultarte? Muchas gracias.`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const selectedServiceForReview = services.find((s) => s.id === reviewServiceId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Search */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-900 via-teal-800 to-stone-900 text-white p-5 sm:p-7 shadow-lg">
        <div className="max-w-3xl">
          <span className="text-teal-300 text-xs font-bold uppercase tracking-wider">
            Economía Local de Proximidad
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Directorio de Oficios con Visto Bueno Vecinal
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
            Sin costos extra de intermediarios ni grandes traslados. Contrata a maestros y técnicos de tu misma cuadra avalados por las recomendaciones de tus propios vecinos.
          </p>

          {/* Quick Stats strip */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-teal-700/60 text-xs text-teal-200">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              100% Validado por vecinos
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
              Soporte disponible en emergencias
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-4 h-4 text-teal-400" />
              A menos de 1 km a pie
            </span>
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="¿Qué necesitas reparar o quién te puede ayudar? (gasfitería, cerrajería...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-sm"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <button
              onClick={() => setEmergencyFilterOnly(!emergencyFilterOnly)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                emergencyFilterOnly
                  ? 'bg-rose-500 text-white font-bold ring-2 ring-white/50'
                  : 'bg-white/10 hover:bg-white/20 text-teal-100 border border-white/20'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              {emergencyFilterOnly ? 'Solo Urgencias' : 'Filtro Emergencias'}
            </button>

            <button
              onClick={onOpenPublish}
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-teal-400 hover:bg-teal-300 text-teal-950 flex items-center gap-1.5 shadow-sm transition active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Ofrecer Oficio
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills (Interactive Filter Tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <ThumbsUp className="w-4 h-4 text-teal-700" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => {
          const isCurrentUserProvider = service.userId === currentUser.id;
          const reviewsCount = service.reviews.length;
          const averageRating = reviewsCount > 0
            ? (service.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1)
            : '5.0';

          return (
            <div
              key={service.id}
              className="rounded-2xl bg-white border border-stone-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3.5">
                {/* Header: Provider & Proximity */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={service.providerAvatar}
                      alt={service.providerName}
                      className="w-12 h-12 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-stone-900 text-sm">
                          {service.providerName}
                        </h3>
                        <span title="Vecino verificado">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>A {service.distanceBlocks} cuadras</span>
                        <span>·</span>
                        <span>{service.neighborhood}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visto Bueno Vecinal Counter */}
                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                      <ThumbsUp className="w-3.5 h-3.5 text-teal-600" />
                      <span>{service.vistoBuenoCount}</span>
                    </div>
                    <div className="text-[9px] uppercase font-bold text-stone-400 tracking-wider mt-0.5">
                      Visto Bueno
                    </div>
                  </div>
                </div>

                {/* Service Title & Description */}
                <div>
                  <h4 className="font-bold text-stone-900 text-sm group-hover:text-teal-800 transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Badges strip: Experience & Emergency */}
                <div className="flex items-center gap-2 pt-1 text-[11px] text-stone-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {service.experienceYears} años de experiencia
                  </span>
                  {service.emergencyAvailable && (
                    <>
                      <span>·</span>
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        Listo para Emergencias
                      </span>
                    </>
                  )}
                </div>

                {/* Reviews preview section */}
                {service.reviews.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                      <span className="font-bold text-stone-700 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        {averageRating} ({reviewsCount} testimonios)
                      </span>
                      <span>{service.reviews[0].date}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 italic line-clamp-2">
                      "{service.reviews[0].comment}"
                    </p>
                    <div className="text-[10px] text-stone-400 mt-1">
                      — {service.reviews[0].reviewerName} ({service.reviews[0].workDone})
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setReviewServiceId(service.id)}
                  className="flex-1 py-2 px-3 rounded-xl border border-teal-700 text-teal-800 hover:bg-teal-50 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Dar Visto Bueno
                </button>

                <a
                  href={getWhatsAppLink(service.providerPhone, service.providerName, service.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-teal-200" />
                  WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center bg-white">
          <Wrench className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No se encontraron oficios en este radio o categoría
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Prueba cambiando los filtros o sé el primero de tu cuadra en ofrecer tus servicios para ganar recomendaciones vecinales.
          </p>
          <button
            onClick={onOpenPublish}
            className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Publicar mi oficio ahora
          </button>
        </div>
      )}

      {/* Review Modal for "Visto Bueno Vecinal" */}
      {reviewServiceId && selectedServiceForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-teal-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Aval Vecinal
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Dar Visto Bueno a {selectedServiceForReview.providerName}
                </h3>
              </div>
              <button
                onClick={() => setReviewServiceId(null)}
                className="p-1 rounded-full text-teal-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGiveVistoBueno} className="p-6 space-y-4">
              <p className="text-xs text-stone-600">
                Tu recomendación ayudará a otros vecinos a saber si el trabajo fue de calidad, honrado y puntual.
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ¿Qué trabajo te realizó? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de válvula de agua, arreglo de cerradura..."
                  value={reviewWorkDone}
                  onChange={(e) => setReviewWorkDone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Calificación
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 ml-2">
                    {reviewRating} de 5 estrellas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Testimonio / Comentario para tus vecinos
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribe cómo fue tu experiencia con este profesional..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setReviewServiceId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Publicar Visto Bueno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
