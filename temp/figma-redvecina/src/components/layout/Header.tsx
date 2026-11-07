import React from 'react';
import { User } from '../../types';
import { Radio, Download, User as UserIcon, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface HeaderProps {
  activeTab: 'services' | 'favors' | 'emergency' | 'map' | 'profile';
  onTabChange: (tab: 'services' | 'favors' | 'emergency' | 'map' | 'profile') => void;
  currentUser: User;
  isEmergencyMode: boolean;
  onToggleEmergencyMode: (enabled: boolean) => void;
  onOpenAuth: () => void;
  onOpenTutorial: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  isEmergencyMode,
  onToggleEmergencyMode,
  onOpenAuth,
  onOpenTutorial,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-4 sm:px-6 h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onTabChange('services')}
          className="text-lg sm:text-xl font-bold tracking-tight text-teal-900 whitespace-nowrap shrink-0 flex items-center gap-2 group text-left"
        >
          <span className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-black text-sm group-hover:bg-teal-800 transition">
            RV
          </span>
          <span>RedVecina</span>
        </button>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-semibold text-stone-600">
          <button
            onClick={() => onTabChange('services')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'services'
                ? 'text-teal-900 font-bold border-b-2 border-teal-800'
                : 'hover:text-stone-900 border-b-2 border-transparent'
            }`}
          >
            Directorio de Oficios
          </button>

          <button
            onClick={() => onTabChange('favors')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'favors'
                ? 'text-amber-900 font-bold border-b-2 border-amber-500'
                : 'hover:text-stone-900 border-b-2 border-transparent'
            }`}
          >
            Cadena de Favores
          </button>

          <button
            onClick={() => onTabChange('emergency')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'emergency'
                ? 'text-rose-700 font-bold border-b-2 border-rose-600'
                : isEmergencyMode
                ? 'text-rose-600 font-bold animate-pulse'
                : 'hover:text-stone-900 border-b-2 border-transparent'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            Tablero Humanitario
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'map'
                ? 'text-teal-900 font-bold border-b-2 border-teal-800'
                : 'hover:text-stone-900 border-b-2 border-transparent'
            }`}
          >
            Mapa Barrial
          </button>
        </nav>

        {/* Zone 3: Actions (Tutorial, PWA Install, Profile Switcher) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenTutorial}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition hidden sm:flex items-center gap-1 text-xs font-medium"
            title="Guía del Buen Vecino"
          >
            <HelpCircle className="w-4 h-4 text-teal-700" />
            <span className="hidden lg:inline">Guía</span>
          </button>

          {isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-600 text-teal-800 hover:bg-teal-50 text-xs font-bold transition whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
          )}

          {/* User Profile / Role Trigger */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full border border-stone-200 hover:border-teal-400 bg-stone-50 hover:bg-white transition text-left"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-stone-900 truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-teal-700 font-semibold uppercase tracking-wider">
                {currentUser.role}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
