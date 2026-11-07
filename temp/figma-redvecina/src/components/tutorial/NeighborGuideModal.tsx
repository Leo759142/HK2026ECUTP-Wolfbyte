import React, { useState } from 'react';
import { X, Wrench, HeartHandshake, ShieldAlert, Smartphone, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { storage } from '../../services/storage';

interface NeighborGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NeighborGuideModal: React.FC<NeighborGuideModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: '1. Servicios de Proximidad con Visto Bueno',
      subtitle: 'Economía Local Confiable',
      icon: Wrench,
      iconBg: 'bg-teal-100 text-teal-800',
      description:
        'Encuentra gasfiteros, electricistas, cerrajeros y cuidadores que viven en tus mismas cuadras. Cada profesional cuenta con el "Visto Bueno Vecinal", recomendaciones directas y testimonios reales de vecinos de confianza para que nunca contrates a ciegas.',
      highlights: [
        'Avalado por recomendaciones vecinales verificadas',
        'Contacto directo por WhatsApp o llamada',
        'Tarifas justas y cercanía sin costo de transporte',
      ],
    },
    {
      title: '2. Cadena de Favores & Red de Solidaridad',
      subtitle: 'Economía Solidaria sin Dinero',
      icon: HeartHandshake,
      iconBg: 'bg-amber-100 text-amber-800',
      description:
        'Resuelve necesidades cotidianas de forma comunitaria y gratuita: pide prestada una escalera o taladro, dona cajas de mudanza, ofrece acompañar al médico a un abuelito o enseña una habilidad a cambio de otra. ¡Cada favor cumplido suma a la reputación vecinal!',
      highlights: [
        'Préstamo de herramientas y ayuda temporal',
        'Donación de materiales, libros y alimentos',
        'Cadena de gratitud: ¡Hoy por ti, mañana por mí!',
      ],
    },
    {
      title: '3. Tablero de Ayuda Humanitaria en Emergencias',
      subtitle: 'Coordinación Inmediata frente a Crisis',
      icon: ShieldAlert,
      iconBg: 'bg-rose-100 text-rose-800',
      description:
        'Durante sismos, inundaciones o cortes de agua imprevistos, la app se transforma en un centro de comando barrial. Reporta vecinos vulnerables aislados, ubica centros de acopio y ollas comunes, y ofrece recursos críticos como agua o botiquines.',
      highlights: [
        'Niveles de urgencia: Crítica (rojo), Alta (naranja) y Media',
        'Validación oficial por Coordinadores Barriales',
        'Mapeo de centros de acopio y refugios comunitarios',
      ],
    },
    {
      title: '4. Publicar en 3 Clics y Modo Sin Conexión (PWA)',
      subtitle: 'Diseñado para Todos los Vecinos',
      icon: Smartphone,
      iconBg: 'bg-sky-100 text-sky-800',
      description:
        'Con el botón flotante (+) publicas en menos de 30 segundos. Además, como es una PWA (Aplicación Web Progresiva), puedes agregarla a tu pantalla de inicio y seguir usándola y publicando reportes incluso cuando se cae internet.',
      highlights: [
        'Solo 3 toques para pedir u ofrecer ayuda',
        'Guarda publicaciones offline y las sincroniza al volver la red',
        'Instalable en cualquier celular sin gastar memoria',
      ],
    },
  ];

  const current = steps[currentStep];
  const IconComponent = current.icon;

  const handleFinish = () => {
    storage.setTutorialSeen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Guía del Buen Vecino
            </span>
            <span className="text-stone-400">·</span>
            <span className="text-xs text-stone-300">Paso {currentStep + 1} de {steps.length}</span>
          </div>
          <button
            onClick={handleFinish}
            className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition"
            aria-label="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center gap-3.5 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${current.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-teal-700 tracking-wide block uppercase">
                {current.subtitle}
              </span>
              <h3 className="text-lg font-bold text-stone-900 leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          <p className="text-stone-600 text-xs sm:text-sm leading-relaxed mb-4">
            {current.description}
          </p>

          {/* Highlights checklist */}
          <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/80 mb-6 space-y-2">
            {current.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-8 bg-teal-700' : 'w-2 bg-stone-300'
                }`}
                aria-label={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-100">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                currentStep === 0
                  ? 'text-stone-300 cursor-not-allowed'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
              >
                ¡Comenzar a explorar!
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
