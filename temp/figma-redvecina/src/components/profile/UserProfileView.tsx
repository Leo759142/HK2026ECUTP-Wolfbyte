import React from 'react';
import { User, NeighborhoodService, SolidarityFavor, HumanitarianAlert } from '../../types';
import { storage } from '../../services/storage';
import { 
  Award, 
  MapPin, 
  Phone, 
  Shield, 
  Wrench, 
  UserCheck, 
  HeartHandshake, 
  RotateCcw, 
  LogOut, 
  CheckCircle2, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: User;
  services: NeighborhoodService[];
  favors: SolidarityFavor[];
  alerts: HumanitarianAlert[];
  onOpenAuth: () => void;
  onOpenTutorial: () => void;
  onRefresh: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  services,
  favors,
  alerts,
  onOpenAuth,
  onOpenTutorial,
  onRefresh,
}) => {
  const myServices = services.filter((s) => s.userId === currentUser.id);
  const myFavors = favors.filter((f) => f.userId === currentUser.id);
  const myAlerts = alerts.filter((a) => a.authorId === currentUser.id);

  const handleResetData = () => {
    if (confirm('¿Restablecer datos demo iniciales de la comunidad?')) {
      storage.resetDemoData();
      onRefresh();
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'coordinador') return 'Coordinador Barrial / Líder Comunal';
    if (role === 'oficio') return `Oficio Especialista (${currentUser.tradeSpecialty || 'General'})`;
    return 'Vecino Ciudadano';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-stone-200 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-stone-900">
                  {currentUser.name}
                </h1>
                {currentUser.verifiedNeighbor && (
                  <span title="Vecino verificado">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-teal-800 mt-0.5">
                {getRoleLabel(currentUser.role)}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.neighborhood}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {currentUser.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Solidarity Points Badge */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-amber-950 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-amber-950 tracking-tight">
                {currentUser.solidarityPoints}
              </div>
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Pts. de Buena Vecindad
              </div>
            </div>
          </div>
        </div>

        {currentUser.bio && (
          <p className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-600 leading-relaxed italic">
            "{currentUser.bio}"
          </p>
        )}

        {/* Action strip */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuth}
              className="py-1.5 px-3 rounded-lg border border-teal-700 text-teal-800 hover:bg-teal-50 text-xs font-semibold transition"
            >
              Cambiar de Perfil o Registrar Nuevo
            </button>

            <button
              onClick={onOpenTutorial}
              className="py-1.5 px-3 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium transition flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              Ver Guía del Buen Vecino
            </button>
          </div>

          <button
            onClick={handleResetData}
            className="py-1.5 px-3 rounded-lg text-xs text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar datos demo
          </button>
        </div>
      </div>

      {/* Summary of User Activities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* My Favors */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-amber-600" />
              Mis Favores ({myFavors.length})
            </h3>
          </div>

          {myFavors.length > 0 ? (
            <div className="space-y-2.5">
              {myFavors.map((f) => (
                <div key={f.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <div className="font-semibold text-stone-900 line-clamp-1">{f.title}</div>
                  <div className="text-[10px] text-stone-500 mt-0.5 capitalize">
                    {f.type} · Estado: {f.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No has publicado favores aún.</p>
          )}
        </div>

        {/* My Services */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-teal-700" />
              Mis Oficios ({myServices.length})
            </h3>
          </div>

          {myServices.length > 0 ? (
            <div className="space-y-2.5">
              {myServices.map((s) => (
                <div key={s.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <div className="font-semibold text-stone-900 line-clamp-1">{s.title}</div>
                  <div className="text-[10px] text-teal-700 font-bold mt-0.5">
                    {s.vistoBuenoCount} Vistos Buenos Vecinales
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No has publicado oficios aún.</p>
          )}
        </div>

        {/* My Alerts */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-600" />
              Alertas Reportadas ({myAlerts.length})
            </h3>
          </div>

          {myAlerts.length > 0 ? (
            <div className="space-y-2.5">
              {myAlerts.map((a) => (
                <div key={a.id} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                  <div className="font-semibold text-stone-900 line-clamp-1">{a.title}</div>
                  <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                    Urgencia {a.urgency} · {a.resolved ? 'Resuelto' : 'Activo'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 italic">No tienes alertas emitidas.</p>
          )}
        </div>
      </div>
    </div>
  );
};
