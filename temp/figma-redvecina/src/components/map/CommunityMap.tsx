import React, { useState } from 'react';
import { NeighborhoodService, SolidarityFavor, HumanitarianAlert } from '../../types';
import { 
  MapPin, 
  Wrench, 
  HeartHandshake, 
  AlertTriangle, 
  ThumbsUp, 
  Phone, 
  MessageCircle, 
  Navigation, 
  X, 
  Layers,
  Sparkles
} from 'lucide-react';

interface CommunityMapProps {
  services: NeighborhoodService[];
  favors: SolidarityFavor[];
  alerts: HumanitarianAlert[];
  currentNeighborhood: string;
}

type MapFilter = 'all' | 'services' | 'favors' | 'alerts';

export const CommunityMap: React.FC<CommunityMapProps> = ({
  services,
  favors,
  alerts,
  currentNeighborhood,
}) => {
  const [filter, setFilter] = useState<MapFilter>('all');
  const [selectedPin, setSelectedPin] = useState<{
    id: string;
    type: 'service' | 'favor' | 'alert';
    data: any;
  } | null>(null);

  return (
    <div className="space-y-4">
      {/* Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-stone-900">
              Mapa de Proximidad Barrial
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            {currentNeighborhood} · Visualiza oficios, favores y puntos de auxilio a distancia caminable
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todos ({services.length + favors.length + alerts.length})
          </button>
          <button
            onClick={() => setFilter('services')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              filter === 'services'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-teal-800 hover:bg-teal-50'
            }`}
          >
            Oficios ({services.length})
          </button>
          <button
            onClick={() => setFilter('favors')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              filter === 'favors'
                ? 'bg-amber-500 text-amber-950 shadow-xs font-bold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Favores ({favors.length})
          </button>
          <button
            onClick={() => setFilter('alerts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              filter === 'alerts'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Alertas ({alerts.length})
          </button>
        </div>
      </div>

      {/* Interactive Map Visual Area */}
      <div className="relative w-full h-[440px] rounded-2xl overflow-hidden border border-stone-200 bg-[#f4f3ef] shadow-inner select-none">
        {/* Background Street Grid Simulation */}
        <svg className="absolute inset-0 w-full h-full stroke-stone-300 stroke-1" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#e7e5e4" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Main Avenues / Calles */}
          <line x1="0" y1="200" x2="100%" y2="200" stroke="#d6d3d1" strokeWidth="24" strokeLinecap="round" />
          <line x1="280" y1="0" x2="280" y2="100%" stroke="#d6d3d1" strokeWidth="24" strokeLinecap="round" />
          <line x1="0" y1="340" x2="100%" y2="340" stroke="#e2e8f0" strokeWidth="16" />
          <line x1="560" y1="0" x2="560" y2="100%" stroke="#e2e8f0" strokeWidth="16" />

          {/* Central Park Area */}
          <rect x="230" y="150" width="180" height="130" rx="20" fill="#dcfce7" stroke="#86efac" strokeWidth="2" />
          <circle cx="320" cy="215" r="14" fill="#bbf7d0" />
        </svg>

        {/* Street Labels */}
        <div className="absolute top-[182px] left-6 text-[10px] font-bold text-stone-600 tracking-wider uppercase pointer-events-none bg-white/70 px-1.5 py-0.5 rounded">
          Av. Las Gardenias
        </div>
        <div className="absolute top-6 left-[288px] text-[10px] font-bold text-stone-600 tracking-wider uppercase pointer-events-none bg-white/70 px-1.5 py-0.5 rounded rotate-90 origin-top-left">
          Calle Los Fresnos
        </div>
        <div className="absolute top-[225px] left-[250px] text-[11px] font-bold text-emerald-800 pointer-events-none">
          Parque Las Flores (Punto Seguro)
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-stone-200 text-[10px] space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal-600 shrink-0" />
            <span className="font-semibold text-stone-700">Oficios Recomendados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
            <span className="font-semibold text-stone-700">Favores Solidarios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
            <span className="font-semibold text-stone-700">Alertas Humanitarias</span>
          </div>
        </div>

        {/* SERVICE PINS */}
        {(filter === 'all' || filter === 'services') &&
          services.map((srv) => (
            <button
              key={srv.id}
              onClick={() => setSelectedPin({ id: srv.id, type: 'service', data: srv })}
              style={{
                top: `${srv.coordinates.y}%`,
                left: `${srv.coordinates.x}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
              title={`${srv.title} (${srv.providerName})`}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-teal-700 text-white shadow-lg flex items-center justify-center border-2 border-white group-hover:scale-125 transition-transform">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-stone-900 text-[9px] font-black rounded-full px-1 border border-white">
                  {srv.vistoBuenoCount}
                </div>
              </div>
            </button>
          ))}

        {/* FAVOR PINS */}
        {(filter === 'all' || filter === 'favors') &&
          favors.map((fav) => (
            <button
              key={fav.id}
              onClick={() => setSelectedPin({ id: fav.id, type: 'favor', data: fav })}
              style={{
                top: `${fav.coordinates.y}%`,
                left: `${fav.coordinates.x}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
              title={fav.title}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-amber-950 shadow-lg flex items-center justify-center border-2 border-white group-hover:scale-125 transition-transform">
                <HeartHandshake className="w-4 h-4 font-bold" />
              </div>
            </button>
          ))}

        {/* ALERT PINS */}
        {(filter === 'all' || filter === 'alerts') &&
          alerts.map((alt) => (
            <button
              key={alt.id}
              onClick={() => setSelectedPin({ id: alt.id, type: 'alert', data: alt })}
              style={{
                top: `${alt.coordinates.y}%`,
                left: `${alt.coordinates.x}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
              title={alt.title}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-rose-600 text-white shadow-xl flex items-center justify-center border-2 border-white animate-bounce">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="absolute -inset-1 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
              </div>
            </button>
          ))}

        {/* Pop-up detail card for selected pin */}
        {selectedPin && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-30 bg-white rounded-2xl p-4 shadow-xl border border-stone-200 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedPin.type === 'service' && (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                    Oficio Vecinal
                  </span>
                )}
                {selectedPin.type === 'favor' && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Favor Solidario
                  </span>
                )}
                {selectedPin.type === 'alert' && (
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                    Alerta de Emergencia
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">
                {selectedPin.data.title}
              </h4>
              <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                {selectedPin.data.description}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1 font-medium text-stone-800">
                <MapPin className="w-3 h-3 text-stone-400" />
                A ~{selectedPin.data.distanceBlocks || 2} cuadras
              </span>

              {selectedPin.type === 'service' && (
                <span className="font-bold text-teal-700 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {selectedPin.data.vistoBuenoCount} avales
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
