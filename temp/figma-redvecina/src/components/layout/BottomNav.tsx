import React from 'react';
import { Wrench, HeartHandshake, ShieldAlert, Map, User, Plus } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'services' | 'favors' | 'emergency' | 'map' | 'profile';
  onTabChange: (tab: 'services' | 'favors' | 'emergency' | 'map' | 'profile') => void;
  onOpenPublish: () => void;
  isEmergencyMode: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenPublish,
  isEmergencyMode,
}) => {
  return (
    <>
      {/* Floating Action Button (FAB) for 3-Click Publish */}
      <div className="fixed bottom-18 right-4 z-40 md:hidden">
        <button
          onClick={onOpenPublish}
          className="w-14 h-14 rounded-full bg-teal-700 text-white shadow-xl flex items-center justify-center hover:bg-teal-800 active:scale-95 transition-all border-2 border-white ring-4 ring-teal-500/20"
          aria-label="Publicar en 3 clics"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Bottom Bar for Mobile Ergonomics */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1">
        <div className="grid grid-cols-5 items-center h-14">
          <button
            onClick={() => onTabChange('services')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'services' ? 'text-teal-800 font-bold' : 'text-stone-500'
            }`}
          >
            <Wrench className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Oficios</span>
          </button>

          <button
            onClick={() => onTabChange('favors')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'favors' ? 'text-amber-700 font-bold' : 'text-stone-500'
            }`}
          >
            <HeartHandshake className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Favores</span>
          </button>

          <button
            onClick={() => onTabChange('emergency')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors relative ${
              activeTab === 'emergency' 
                ? 'text-rose-700 font-bold' 
                : isEmergencyMode 
                ? 'text-rose-600 font-bold' 
                : 'text-stone-500'
            }`}
          >
            <ShieldAlert className={`w-5 h-5 ${isEmergencyMode ? 'animate-pulse text-rose-600' : ''}`} />
            <span className="text-[10px] mt-1 tracking-tight">Ayuda</span>
            {isEmergencyMode && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'map' ? 'text-teal-800 font-bold' : 'text-stone-500'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Mapa</span>
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              activeTab === 'profile' ? 'text-teal-800 font-bold' : 'text-stone-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Perfil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
