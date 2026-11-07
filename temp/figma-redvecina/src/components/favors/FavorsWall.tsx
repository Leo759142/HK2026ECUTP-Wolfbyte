import React, { useState } from 'react';
import { SolidarityFavor, FavorCategory, User } from '../../types';
import { storage } from '../../services/storage';
import { 
  HeartHandshake, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  MessageCircle, 
  Sparkles, 
  Clock, 
  Award, 
  HelpCircle, 
  Send, 
  X,
  Share2
} from 'lucide-react';

interface FavorsWallProps {
  favors: SolidarityFavor[];
  currentUser: User;
  onOpenPublish: () => void;
  onRefresh: () => void;
}

export const FavorsWall: React.FC<FavorsWallProps> = ({
  favors,
  currentUser,
  onOpenPublish,
  onRefresh,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'necesito' | 'ofrezco' | 'mine'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Accept favor modal
  const [acceptingFavorId, setAcceptingFavorId] = useState<string | null>(null);
  const [volunteerMessage, setVolunteerMessage] = useState('');

  // Complete favor modal
  const [completingFavorId, setCompletingFavorId] = useState<string | null>(null);
  const [thankYouMessage, setThankYouMessage] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const categories: { key: string; label: string; icon: string }[] = [
    { key: 'all', label: 'Todas las áreas', icon: '🤝' },
    { key: 'herramientas', label: 'Herramientas', icon: '🪜' },
    { key: 'ayuda_temporal', label: 'Ayuda Temporal', icon: '🙌' },
    { key: 'donacion', label: 'Donaciones', icon: '📦' },
    { key: 'habilidades', label: 'Habilidades', icon: '💡' },
    { key: 'movilidad', label: 'Movilidad', icon: '🚲' },
    { key: 'alimentos_botiquin', label: 'Alimentos / Salud', icon: '🍎' },
  ];

  // Filtering
  const filteredFavors = favors.filter((fav) => {
    if (filterType === 'necesito' && fav.type !== 'necesito') return false;
    if (filterType === 'ofrezco' && fav.type !== 'ofrezco') return false;
    if (filterType === 'mine' && fav.userId !== currentUser.id) return false;
    if (selectedCategory !== 'all' && fav.category !== selectedCategory) return false;
    return true;
  });

  const handleAcceptFavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingFavorId) return;

    storage.acceptFavor(acceptingFavorId, volunteerMessage);
    setToastMessage('¡Te sumaste a la cadena de favores! El vecino recibirá tu aviso de apoyo.');
    setTimeout(() => setToastMessage(null), 4000);
    setAcceptingFavorId(null);
    setVolunteerMessage('');
    onRefresh();
  };

  const handleCompleteFavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFavorId) return;

    storage.completeFavor(
      completingFavorId, 
      thankYouMessage || '¡Cadena cumplida con éxito! Agradecimiento infinito a los vecinos solidarios.'
    );
    setToastMessage('¡Cadena de favores completada! La solidaridad de tu cuadra creció.');
    setTimeout(() => setToastMessage(null), 4000);
    setCompletingFavorId(null);
    setThankYouMessage('');
    onRefresh();
  };

  const getWhatsAppCoordinationLink = (phone: string, userName: string, favorTitle: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hola ${userName}, te escribo desde la Cadena de Favores de RedVecina sobre "${favorTitle}". Me gustaría coordinar contigo para apoyarnos. ¡Saludos vecinales!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const selectedFavorToAccept = favors.find(f => f.id === acceptingFavorId);
  const selectedFavorToComplete = favors.find(f => f.id === completingFavorId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-900 via-stone-900 to-teal-950 text-white p-5 sm:p-7 shadow-lg">
        <div className="max-w-3xl">
          <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">
            Economía Solidaria Barrial
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Muro Colaborativo: Cadena de Favores Sin Dinero
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 mt-2 leading-relaxed">
            Resuelve necesidades cotidianas prestando herramientas, donando lo que no usas o compartiendo tu tiempo y habilidades. Hoy por ti, mañana por mí.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10 text-xs text-amber-200">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              100% Sin dinero ni comisiones
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Award className="w-4 h-4 text-amber-400" />
              Suma puntos de reputación vecinal
            </span>
          </div>
        </div>

        {/* Filter bar inside hero */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Main Filter segmented buttons */}
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Todos los favores
            </button>
            <button
              onClick={() => setFilterType('necesito')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filterType === 'necesito'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Necesitan ayuda
            </button>
            <button
              onClick={() => setFilterType('ofrezco')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filterType === 'ofrezco'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Ofrecen apoyo
            </button>
            <button
              onClick={() => setFilterType('mine')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                filterType === 'mine'
                  ? 'bg-amber-400 text-amber-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Mis pedidos
            </button>
          </div>

          <button
            onClick={onOpenPublish}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 flex items-center gap-1.5 shadow-sm transition active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Pedir u Ofrecer Favor
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <HeartHandshake className="w-4 h-4 text-amber-700" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Favors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFavors.map((favor) => {
          const isMine = favor.userId === currentUser.id;
          const isCompleted = favor.status === 'completado';
          const isInProgress = favor.status === 'en_curso';

          return (
            <div
              key={favor.id}
              className={`rounded-2xl border shadow-xs transition-all flex flex-col justify-between overflow-hidden bg-white ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isInProgress
                  ? 'border-amber-200 bg-amber-50/20'
                  : 'border-stone-200 hover:shadow-md'
              }`}
            >
              <div className="p-5 space-y-3.5">
                {/* Header: Author & Typographic metadata */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={favor.userAvatar}
                      alt={favor.userName}
                      className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-stone-900 text-xs">
                          {favor.userName}
                        </span>
                        {isMine && (
                          <span className="text-[10px] text-teal-800 font-bold bg-teal-100 px-1.5 py-0.2 rounded">
                            Tú
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>A {favor.distanceBlocks} cuadras</span>
                        <span>·</span>
                        <span>{favor.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean unboxed type tag */}
                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider block ${
                        favor.type === 'necesito'
                          ? 'text-rose-600'
                          : 'text-teal-700'
                      }`}
                    >
                      {favor.type === 'necesito' ? '🤝 Necesita' : '🎁 Ofrece'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium capitalize">
                      {favor.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-bold text-stone-900 text-sm leading-snug">
                    {favor.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {favor.description}
                  </p>
                </div>

                {/* Status Indicator */}
                <div className="pt-1">
                  {isCompleted && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span>¡Cadena Cumplida con Éxito!</span>
                      </div>
                      {favor.thankYouMessage && (
                        <p className="text-[11px] text-emerald-700 italic">
                          "{favor.thankYouMessage}"
                        </p>
                      )}
                    </div>
                  )}

                  {isInProgress && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">En coordinación:</span>{' '}
                        <span>{favor.acceptedBy?.userName} acudió al llamado</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 py-3.5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between gap-2">
                {!isCompleted && !isMine && (
                  <button
                    type="button"
                    onClick={() => setAcceptingFavorId(favor.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
                    ¡Yo puedo ayudar!
                  </button>
                )}

                {isMine && !isCompleted && (
                  <button
                    type="button"
                    onClick={() => setCompletingFavorId(favor.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar como cumplido
                  </button>
                )}

                <a
                  href={getWhatsAppCoordinationLink(favor.userPhone, favor.userName, favor.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl border border-stone-300 hover:bg-white text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-teal-700" />
                  Coordinar
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFavors.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center bg-white">
          <HeartHandshake className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No hay favores en esta categoría o filtro
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            ¿Necesitas prestar una herramienta o te sobra algo para donar? ¡Publica y ayuda a fortalecer la red comunitaria!
          </p>
          <button
            onClick={onOpenPublish}
            className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-xl shadow-xs transition"
          >
            Publicar el primer favor
          </button>
        </div>
      )}

      {/* Accept Favor Volunteer Modal */}
      {acceptingFavorId && selectedFavorToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Solidaridad Vecinal
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Sumarte a ayudar a {selectedFavorToAccept.userName}
                </h3>
              </div>
              <button
                onClick={() => setAcceptingFavorId(null)}
                className="p-1 rounded-full text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAcceptFavor} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                <span className="font-semibold block text-stone-900">
                  Favor: {selectedFavorToAccept.title}
                </span>
                <span className="text-[11px] text-stone-500">
                  Ubicación: A {selectedFavorToAccept.distanceBlocks} cuadras en {selectedFavorToAccept.neighborhood}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mensaje de apoyo / Horario en que puedes colaborar:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej. ¡Hola vecino! Cuentas conmigo, puedo pasar hoy a las 6pm a dejarte la herramienta..."
                  value={volunteerMessage}
                  onChange={(e) => setVolunteerMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAcceptingFavorId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-amber-950 text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirmar Apoyo Solidario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Favor Modal */}
      {completingFavorId && selectedFavorToComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-emerald-800 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Cadena Cumplida
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Agradecimiento Vecinal
                </h3>
              </div>
              <button
                onClick={() => setCompletingFavorId(null)}
                className="p-1 rounded-full text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteFavor} className="p-6 space-y-4">
              <p className="text-xs text-stone-600">
                ¡Qué gran noticia! Deja un mensaje público de agradecimiento para honrar a los vecinos que te apoyaron y continuar la cadena de favores:
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Mensaje de agradecimiento
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej. ¡Muchísimas gracias a Don Carlos por prestarme la escalera! Dejó todo impecable. ¡La unión hace la fuerza!"
                  value={thankYouMessage}
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCompletingFavorId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-emerald-200" />
                  Cerrar Cadena y Agradecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
