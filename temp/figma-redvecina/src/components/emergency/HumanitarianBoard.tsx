import React, { useState } from 'react';
import { HumanitarianAlert, AlertUrgency, User } from '../../types';
import { storage } from '../../services/storage';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Users, 
  Package, 
  Heart, 
  Radio, 
  X, 
  ShieldCheck,
  Send,
  Droplet,
  Flame,
  LifeBuoy
} from 'lucide-react';

interface HumanitarianBoardProps {
  alerts: HumanitarianAlert[];
  currentUser: User;
  isEmergencyMode: boolean;
  onToggleEmergencyMode: (enabled: boolean) => void;
  onOpenPublish: () => void;
  onRefresh: () => void;
}

export const HumanitarianBoard: React.FC<HumanitarianBoardProps> = ({
  alerts,
  currentUser,
  isEmergencyMode,
  onToggleEmergencyMode,
  onOpenPublish,
  onRefresh,
}) => {
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  // Offer resource modal
  const [offeringAlertId, setOfferingAlertId] = useState<string | null>(null);
  const [resourceDescription, setResourceDescription] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isCoordinator = currentUser.role === 'coordinador';

  const filteredAlerts = alerts.filter((alert) => {
    if (!showResolved && alert.resolved) return false;
    if (filterUrgency !== 'all' && alert.urgency !== filterUrgency) return false;
    return true;
  });

  const handleOfferResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringAlertId || !resourceDescription.trim()) return;

    storage.offerResourceToAlert(offeringAlertId, resourceDescription.trim());
    setToastMessage('¡Aporte de recurso registrado! Gracias por proteger a tu barrio.');
    setTimeout(() => setToastMessage(null), 4000);
    setOfferingAlertId(null);
    setResourceDescription('');
    onRefresh();
  };

  const handleToggleValidation = (alertId: string) => {
    storage.toggleAlertOfficialValidation(alertId);
    onRefresh();
  };

  const handleToggleResolved = (alertId: string) => {
    storage.toggleAlertResolved(alertId);
    onRefresh();
  };

  const selectedAlertForResource = alerts.find(a => a.id === offeringAlertId);

  return (
    <div className="space-y-6">
      {/* Emergency Mode Banner */}
      <div className={`rounded-2xl p-5 sm:p-7 shadow-lg transition-all ${
        isEmergencyMode 
          ? 'bg-gradient-to-br from-rose-950 via-rose-900 to-stone-900 text-white ring-2 ring-rose-500' 
          : 'bg-gradient-to-br from-stone-900 via-rose-950 to-stone-950 text-white'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isEmergencyMode ? 'bg-rose-500 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {isEmergencyMode ? 'MODO EMERGENCIA ACTIVO' : 'TABLERO DE AYUDA HUMANITARIA'}
              </span>
              <span className="text-xs text-stone-300">Monitoreo 24/7</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
              Gestión de Emergencias y Recursos Críticos
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/90 mt-2 leading-relaxed">
              Coordinación geolocalizada para socorrer vecinos vulnerables, adultos mayores incomunicados, distribución de agua potable y puntos de acopio frente a crisis.
            </p>
          </div>

          {/* Coordinator Switch */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2 bg-black/30 p-3.5 rounded-xl border border-white/10">
            <div className="text-xs font-semibold text-stone-300">
              Estado de Alerta Barrial:
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleEmergencyMode(!isEmergencyMode)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isEmergencyMode
                    ? 'bg-rose-600 text-white shadow-md animate-pulse'
                    : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {isEmergencyMode ? 'Desactivar Alarma' : 'Activar Modo Emergencia'}
              </button>

              <button
                onClick={onOpenPublish}
                className="py-1.5 px-3 rounded-lg text-xs font-bold bg-white text-stone-900 hover:bg-stone-100 flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 text-rose-600" />
                Reportar Urgencia
              </button>
            </div>

            {!isCoordinator && (
              <span className="text-[10px] text-stone-400">
                * Todos los vecinos pueden activar la vista de emergencia para soporte solidario.
              </span>
            )}
          </div>
        </div>

        {/* Quick Emergency Centers Strip */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Punto de Agua Potable</div>
              <div className="text-[11px] text-stone-300">Glorieta Parque Central (Cisterna)</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Olla Común San Martín</div>
              <div className="text-[11px] text-stone-300">Local Comunal Mz B Lote 8</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Puesto de Primeros Auxilios</div>
              <div className="text-[11px] text-stone-300">Dra. Valeria Ponce (Médico de guardia)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          <button
            onClick={() => setFilterUrgency('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterUrgency === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Todas las alertas
          </button>
          <button
            onClick={() => setFilterUrgency('critica')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterUrgency === 'critica'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            🔴 Críticas
          </button>
          <button
            onClick={() => setFilterUrgency('alta')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterUrgency === 'alta'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            🟠 Altas
          </button>
          <button
            onClick={() => setFilterUrgency('media')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterUrgency === 'media'
                ? 'bg-yellow-600 text-white shadow-xs'
                : 'text-yellow-700 hover:bg-yellow-50'
            }`}
          >
            🟡 Medias
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
          />
          <span>Mostrar casos atendidos / resueltos</span>
        </label>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const isCritical = alert.urgency === 'critica';
          const isHigh = alert.urgency === 'alta';
          const isResolved = alert.resolved;

          return (
            <div
              key={alert.id}
              className={`rounded-2xl border p-5 transition-all bg-white shadow-xs ${
                isResolved
                  ? 'border-stone-200 opacity-70 bg-stone-50/50'
                  : isCritical
                  ? 'border-rose-400 ring-1 ring-rose-300'
                  : isHigh
                  ? 'border-amber-300'
                  : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  {/* Urgency Badge and Official Validation */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      Urgencia {alert.urgency}
                    </span>

                    {alert.officialValidation ? (
                      <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        Validación Oficial de Emergencia
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-500 italic">
                        Reportado por vecino (en verificación)
                      </span>
                    )}

                    {isResolved && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Atendido / Resuelto
                      </span>
                    )}

                    <span className="text-xs text-stone-400">· {alert.createdAt}</span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    {alert.title}
                  </h3>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Location & People Affected */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                    <span className="flex items-center gap-1.5 font-medium text-stone-800">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {alert.locationReference}
                    </span>
                    {alert.peopleAffected && alert.peopleAffected > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-stone-500" />
                        Afecta a ~{alert.peopleAffected} personas
                      </span>
                    )}
                    <span>Reportado por: <strong>{alert.authorName}</strong></span>
                  </div>

                  {/* Needed Resources vs Provided Resources */}
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80">
                      <span className="font-bold text-stone-900 block mb-1.5 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-rose-600" />
                        Recursos Críticos Requeridos:
                      </span>
                      <ul className="space-y-1 text-stone-600">
                        {alert.resourcesNeeded.map((res, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span>{res}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/80">
                      <span className="font-bold text-teal-950 block mb-1.5 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-teal-600" />
                        Recursos Aportados por Vecinos:
                      </span>
                      {alert.resourcesProvided.length > 0 ? (
                        <ul className="space-y-1 text-teal-900">
                          {alert.resourcesProvided.map((res, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>{res}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-stone-400 italic">
                          Aún sin aportes registrados. Sé el primero en sumar.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions column */}
                <div className="flex md:flex-col gap-2 shrink-0 pt-2 md:pt-0">
                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => setOfferingAlertId(alert.id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Aportar Recursos
                    </button>
                  )}

                  {isCoordinator && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleValidation(alert.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          alert.officialValidation
                            ? 'bg-stone-100 text-stone-700 border-stone-300'
                            : 'bg-teal-700 text-white border-teal-700'
                        }`}
                      >
                        {alert.officialValidation ? 'Quitar Validación' : 'Validar Oficialmente'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleResolved(alert.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          alert.resolved
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-700 text-white border-emerald-700'
                        }`}
                      >
                        {alert.resolved ? 'Reabrir Alerta' : 'Marcar Atendido'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center bg-white">
          <ShieldCheck className="w-10 h-10 text-teal-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No hay alertas activas de este nivel en este momento
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            El vecindario se encuentra en calma. Si observas un corte imprevisto o a un vecino en vulnerabilidad, repórtalo de inmediato.
          </p>
        </div>
      )}

      {/* Offer Resource Modal */}
      {offeringAlertId && selectedAlertForResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                  Ayuda Humanitaria
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Aportar Recursos Críticos
                </h3>
              </div>
              <button
                onClick={() => setOfferingAlertId(null)}
                className="p-1 rounded-full text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfferResource} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                <span className="font-semibold block text-stone-900">
                  Caso: {selectedAlertForResource.title}
                </span>
                <span className="text-[11px] text-stone-500">
                  Lugar: {selectedAlertForResource.locationReference}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ¿Qué recurso o apoyo puedes llevar o aportar? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1 bidón de agua hervida de 10L, 2 frazadas limpias..."
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="text-[11px] text-stone-500">
                Se registrará tu nombre ({currentUser.name}) y teléfono para que el coordinador o la familia pueda recibir el apoyo.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setOfferingAlertId(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
