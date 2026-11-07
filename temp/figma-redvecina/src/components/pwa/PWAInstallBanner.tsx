import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed or user dismissed banner for this session
  if (isInstalled || dismissed) {
    return null;
  }

  // If neither Chromium prompt nor iOS, return null
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 text-white px-4 py-2.5 text-xs shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-700/80 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <span className="font-bold text-white">Instala RedVecina en tu móvil:</span>{' '}
              <span className="text-teal-100 hidden sm:inline">
                Funciona sin conexión a internet y abre al instante desde tu pantalla de inicio.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                onClick={install}
                className="bg-white text-teal-900 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-teal-50 transition active:scale-95 shadow-xs whitespace-nowrap"
              >
                Instalar Ahora
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap"
              >
                Instalar en iPhone
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white p-1 rounded-md"
              aria-label="Cerrar aviso de instalación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-stone-900">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-700" />
                Instalar en Safari iOS
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Para agregar RedVecina como app nativa a tu iPhone o iPad sin pasar por la App Store:
            </p>

            <ol className="space-y-3 text-xs text-stone-700">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Toca el botón <strong>Compartir</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-teal-700" /> en la barra inferior de Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Desliza hacia abajo y presiona <strong>"Agregar al inicio"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-teal-700" />.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Presiona <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full rounded-xl bg-teal-700 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
