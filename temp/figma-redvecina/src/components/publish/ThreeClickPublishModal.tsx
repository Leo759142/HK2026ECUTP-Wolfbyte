import React, { useState } from 'react';
import { User, ServiceCategory, FavorCategory, AlertUrgency, AlertCategory } from '../../types';
import { storage } from '../../services/storage';
import { 
  X, 
  Wrench, 
  HeartHandshake, 
  AlertTriangle, 
  Check, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  WifiOff, 
  Send 
} from 'lucide-react';

interface ThreeClickPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess: () => void;
}

type PublishType = 'oficio' | 'favor' | 'alerta';

export const ThreeClickPublishModal: React.FC<ThreeClickPublishModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<PublishType>('favor');

  // Fields for Favor
  const [favorType, setFavorType] = useState<'necesito' | 'ofrezco'>('necesito');
  const [favorCategory, setFavorCategory] = useState<FavorCategory>('herramientas');
  const [favorTitle, setFavorTitle] = useState('');
  const [favorDescription, setFavorDescription] = useState('');

  // Fields for Oficio
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('gasfiteria');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceExp, setServiceExp] = useState(5);
  const [serviceEmergency, setServiceEmergency] = useState(true);

  // Fields for Alert
  const [alertCategory, setAlertCategory] = useState<AlertCategory>('adulto_vulnerable');
  const [alertUrgency, setAlertUrgency] = useState<AlertUrgency>('alta');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [alertLocation, setAlertLocation] = useState(currentUser.streetAddress || 'Calle Principal');
  const [alertResourceInput, setAlertResourceInput] = useState('');

  // Location & Proximity (Step 3)
  const [neighborhood, setNeighborhood] = useState(currentUser.neighborhood);
  const [distanceBlocks, setDistanceBlocks] = useState(2);
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOpen) return null;

  // Preset fast chips for 1-tap fill
  const applyFavorPreset = (presetTitle: string, presetCat: FavorCategory, pType: 'necesito' | 'ofrezco') => {
    setFavorTitle(presetTitle);
    setFavorCategory(presetCat);
    setFavorType(pType);
    setFavorDescription(`Publicado por ${currentUser.name} para coordinar entre vecinos del barrio.`);
  };

  const applyAlertPreset = (presetTitle: string, presetCat: AlertCategory, urg: AlertUrgency) => {
    setAlertTitle(presetTitle);
    setAlertCategory(presetCat);
    setAlertUrgency(urg);
    setAlertDescription('Reporte de auxilio vecinal urgente para coordinación de recursos críticos.');
  };

  const handleFinishPublish = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'favor') {
      storage.addFavor({
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        userAvatar: currentUser.avatar,
        neighborhood,
        type: favorType,
        category: favorCategory,
        title: favorTitle || (favorType === 'necesito' ? 'Necesito ayuda solidaria' : 'Ofrezco ayuda al barrio'),
        description: favorDescription || 'Coordinación directa con vecinos.',
        urgency: 'media',
        distanceBlocks,
        coordinates: { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 60) + 20 },
      });
    } else if (type === 'oficio') {
      storage.addService({
        userId: currentUser.id,
        providerName: currentUser.name,
        providerPhone: currentUser.phone,
        providerAvatar: currentUser.avatar,
        neighborhood,
        category: serviceCategory,
        title: serviceTitle || `Servicio de ${serviceCategory}`,
        description: serviceDescription || 'Servicio honesto garantizado por recomendación de vecinos.',
        experienceYears: Number(serviceExp) || 3,
        emergencyAvailable: serviceEmergency,
        distanceBlocks,
        coordinates: { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 60) + 20 },
      });
    } else if (type === 'alerta') {
      const resourcesNeeded = alertResourceInput
        ? alertResourceInput.split(',').map(s => s.trim()).filter(Boolean)
        : ['Agua potable', 'Apoyo voluntario'];

      storage.addAlert({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        neighborhood,
        title: alertTitle || 'Alerta de apoyo humanitario vecinal',
        description: alertDescription || 'Situación que requiere apoyo de la red comunitaria.',
        urgency: alertUrgency,
        category: alertCategory,
        locationReference: alertLocation || 'Barrio central',
        peopleAffected: 1,
        resourcesNeeded,
        resourcesProvided: [],
        officialValidation: currentUser.role === 'coordinador',
        coordinates: { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 60) + 20 },
      });
    }

    onSuccess();
    onClose();
    // Reset state
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header with 3-Click Progress */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Publicar en 3 Clics
              </span>
              {!isOnline && (
                <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> Modo Offline
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              {step === 1 && 'Clic 1: ¿Qué deseas publicar?'}
              {step === 2 && 'Clic 2: Detalle rápido'}
              {step === 3 && 'Clic 3: Ubicación y Confirmar'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="grid grid-cols-3 h-1.5 bg-stone-100">
          <div className="bg-teal-600 h-full" />
          <div className={`${step >= 2 ? 'bg-teal-600' : 'bg-transparent'} h-full transition-colors`} />
          <div className={`${step === 3 ? 'bg-teal-600' : 'bg-transparent'} h-full transition-colors`} />
        </div>

        <div className="p-6">
          {/* STEP 1: SELECT TYPE */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Elige el canal según el objetivo de tu publicación:
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setType('favor');
                    setStep(2);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                    type === 'favor'
                      ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500'
                      : 'border-stone-200 hover:border-amber-400 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-stone-900">
                      Cadena de Favores Solidaria (Sin Dinero)
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Pide o presta herramientas, pide apoyo temporal, dona ropa/enseres o comparte habilidades.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('oficio');
                    setStep(2);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                    type === 'oficio'
                      ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600'
                      : 'border-stone-200 hover:border-teal-400 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-stone-900">
                      Oficio / Servicio Local de Proximidad
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Ofrece tu trabajo (gasfitería, electricidad, cerrajería, cuidados) y acumula Visto Bueno Vecinal.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('alerta');
                    setStep(2);
                  }}
                  className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                    type === 'alerta'
                      ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500'
                      : 'border-stone-200 hover:border-rose-400 hover:bg-stone-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-stone-900">
                      Alerta Humanitaria / Situación Crítica
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Reporta vecinos vulnerables aislados, necesidad de agua, acopio vecinal u ollas comunes.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FAST DETAILS & PRESETS */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Type: Favor Solidario */}
              {type === 'favor' && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setFavorType('necesito')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                        favorType === 'necesito'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Necesito un favor
                    </button>
                    <button
                      type="button"
                      onClick={() => setFavorType('ofrezco')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                        favorType === 'ofrezco'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Ofrezco ayuda / Préstamo
                    </button>
                  </div>

                  {/* Fast chip presets */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                      Plantillas rápidas de 1 toque:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyFavorPreset('Presto taladro percutor por el día', 'herramientas', 'ofrezco')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 transition"
                      >
                        🔧 Prestar taladro
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFavorPreset('Necesito escalera alta para cambiar luminaria', 'herramientas', 'necesito')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 transition"
                      >
                        🪜 Pedir escalera
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFavorPreset('Acompaño a adulto mayor a posta de salud', 'ayuda_temporal', 'ofrezco')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 transition"
                      >
                        👵 Acompañar abuelito
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFavorPreset('Dono cajas de mudanza en buen estado', 'donacion', 'ofrezco')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-amber-50 hover:border-amber-300 text-stone-700 transition"
                      >
                        📦 Donar cajas
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Título del Favor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Presto escalera telescópica o necesito ayuda para mover sofá"
                      value={favorTitle}
                      onChange={(e) => setFavorTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Categoría
                      </label>
                      <select
                        value={favorCategory}
                        onChange={(e) => setFavorCategory(e.target.value as FavorCategory)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="herramientas">Herramientas</option>
                        <option value="ayuda_temporal">Ayuda Temporal</option>
                        <option value="donacion">Donación / Enseres</option>
                        <option value="habilidades">Intercambio Habilidades</option>
                        <option value="movilidad">Movilidad Solidaria</option>
                        <option value="alimentos_botiquin">Alimentos / Botiquín</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Urgencia
                      </label>
                      <div className="text-xs text-stone-500 py-2">Solidario regular</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Detalle adicional (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explica brevemente horarios disponibles o detalles..."
                      value={favorDescription}
                      onChange={(e) => setFavorDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              )}

              {/* Type: Oficio */}
              {type === 'oficio' && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Categoría de Oficio *
                    </label>
                    <select
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value as ServiceCategory)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="gasfiteria">Gasfitería & Fugas</option>
                      <option value="electricidad">Electricidad & Tableros</option>
                      <option value="cerrajeria">Cerrajería 24/7</option>
                      <option value="carpinteria">Carpintería & Muebles</option>
                      <option value="cuidados">Cuidado Adultos & Mascotas</option>
                      <option value="clases">Clases & Refuerzo</option>
                      <option value="costura">Costura & Arreglos</option>
                      <option value="tecnologia">Soporte Celulares & PC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Título de tu Servicio *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gasfitería rápida y desatoros con garantía de barrio"
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Descripción de lo que realizas
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Trabajos que atiendes, disponibilidad, garantía vecinal..."
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-stone-200 bg-stone-50">
                    <div>
                      <div className="text-xs font-bold text-stone-800">
                        ¿Disponible para emergencias barriales?
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Aparecerás prioritario si ocurre un corte o avería crítica
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={serviceEmergency}
                      onChange={(e) => setServiceEmergency(e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Type: Alerta Humanitaria */}
              {type === 'alerta' && (
                <div className="space-y-3.5">
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-xs text-rose-800">
                    <strong>Tablero Humanitario:</strong> Esta publicación notificará a los coordinadores y vecinos para activar soporte prioritario.
                  </div>

                  {/* Preset fast chips */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                      Plantillas de emergencia rápida:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyAlertPreset('Adulto mayor aislado sin agua potable en piso alto', 'adulto_vulnerable', 'critica')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-900 transition"
                      >
                        🚨 Anciano sin agua
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlertPreset('Olla Común vecinal requiere balón de gas y víveres', 'olla_comun', 'alta')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 transition"
                      >
                        🍲 Olla común sin insumos
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAlertPreset('Punto de recarga y botiquín abierto en parque', 'centro_acopio', 'media')}
                        className="text-xs px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 transition"
                      >
                        📦 Centro de acopio
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Situación / Título de la Alerta *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Filtración grave o familia necesita agua y abrigo"
                      value={alertTitle}
                      onChange={(e) => setAlertTitle(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nivel de Urgencia
                      </label>
                      <select
                        value={alertUrgency}
                        onChange={(e) => setAlertUrgency(e.target.value as AlertUrgency)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white font-semibold text-stone-800"
                      >
                        <option value="critica">🔴 Crítica (Inmediata)</option>
                        <option value="alta">🟠 Alta (Próximas horas)</option>
                        <option value="media">🟡 Media (En el día)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Dirección exacta / Ref
                      </label>
                      <input
                        type="text"
                        placeholder="Calle y número de casa"
                        value={alertLocation}
                        onChange={(e) => setAlertLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Recursos o ayuda requerida (separados por coma)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 2 Bidones de agua, Frazadas, Voluntario con linterna"
                      value={alertResourceInput}
                      onChange={(e) => setAlertResourceInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Atrás
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
                >
                  Confirmar ubicación
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION & PUBLISH */}
          {step === 3 && (
            <form onSubmit={handleFinishPublish} className="space-y-4">
              <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>Zona de Proximidad y Radio Barrial</span>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Barrio / Cuadrante
                  </label>
                  <input
                    type="text"
                    required
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Radio de visibilidad estimado: {distanceBlocks} cuadras a la redonda
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={distanceBlocks}
                    onChange={(e) => setDistanceBlocks(Number(e.target.value))}
                    className="w-full accent-teal-700"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>Misma cuadra (1)</span>
                    <span>Cerca (3-4)</span>
                    <span>Todo el distrito (8)</span>
                  </div>
                </div>
              </div>

              {/* Author preview */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-100 bg-white text-xs">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div>
                  <div className="font-semibold text-stone-900">
                    Publicando como: {currentUser.name}
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Contacto: {currentUser.phone}
                  </div>
                </div>
              </div>

              {!isOnline && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Estás sin conexión. Tu publicación se guardará localmente en el dispositivo y se compartirá automáticamente con los vecinos cuando regrese la red.
                  </span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Modificar datos
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  ¡Publicar en el Barrio!
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
