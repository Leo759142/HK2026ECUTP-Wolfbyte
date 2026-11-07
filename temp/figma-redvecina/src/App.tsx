import React, { useState, useEffect } from 'react';
import { 
  NeighborhoodService, 
  SolidarityFavor, 
  HumanitarianAlert, 
  User 
} from './types';
import { storage, STORAGE_CHANGE_EVENT } from './services/storage';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ServicesDirectory } from './components/services/ServicesDirectory';
import { FavorsWall } from './components/favors/FavorsWall';
import { HumanitarianBoard } from './components/emergency/HumanitarianBoard';
import { CommunityMap } from './components/map/CommunityMap';
import { UserProfileView } from './components/profile/UserProfileView';
import { AuthModal } from './components/auth/AuthModal';
import { ThreeClickPublishModal } from './components/publish/ThreeClickPublishModal';
import { NeighborGuideModal } from './components/tutorial/NeighborGuideModal';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { Plus, Radio, HelpCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'services' | 'favors' | 'emergency' | 'map' | 'profile'>('services');
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(storage.isEmergencyMode());
  
  // Datasets
  const [services, setServices] = useState<NeighborhoodService[]>(storage.getServices());
  const [favors, setFavors] = useState<SolidarityFavor[]>(storage.getFavors());
  const [alerts, setAlerts] = useState<HumanitarianAlert[]>(storage.getAlerts());
  const [currentNeighborhood, setCurrentNeighborhood] = useState<string>(storage.getCurrentNeighborhood());

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // Load and refresh state on changes
  const refreshAllData = () => {
    setCurrentUser(storage.getCurrentUser());
    setIsEmergencyMode(storage.isEmergencyMode());
    setServices(storage.getServices());
    setFavors(storage.getFavors());
    setAlerts(storage.getAlerts());
    setCurrentNeighborhood(storage.getCurrentNeighborhood());
  };

  useEffect(() => {
    const handleStorageUpdate = () => {
      refreshAllData();
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageUpdate);

    // If first time visit, trigger guide
    if (!storage.hasSeenTutorial()) {
      setIsTutorialOpen(true);
    }

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageUpdate);
    };
  }, []);

  const handleToggleEmergencyMode = (enabled: boolean) => {
    storage.setEmergencyMode(enabled);
    setIsEmergencyMode(enabled);
    if (enabled) {
      setActiveTab('emergency');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans pb-20 md:pb-10 selection:bg-teal-600 selection:text-white">
      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Persistent Offline Status and Queue Indicator */}
      <OfflineIndicator />

      {/* Main Responsive Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        isEmergencyMode={isEmergencyMode}
        onToggleEmergencyMode={handleToggleEmergencyMode}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
      />

      {/* Emergency Global Alert Strip if Active */}
      {isEmergencyMode && activeTab !== 'emergency' && (
        <div 
          onClick={() => setActiveTab('emergency')}
          className="bg-rose-700 text-white px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-rose-800 transition flex items-center justify-between"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span>
                <strong>Modo Emergencia Vecinal Activo:</strong> Se están coordinando recursos críticos y reportes vulnerables en tu barrio.
              </span>
            </span>
            <span className="underline shrink-0 font-bold">Ver Tablero &rarr;</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'services' && (
          <ServicesDirectory
            services={services}
            currentUser={currentUser}
            onOpenPublish={() => setIsPublishOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'favors' && (
          <FavorsWall
            favors={favors}
            currentUser={currentUser}
            onOpenPublish={() => setIsPublishOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'emergency' && (
          <HumanitarianBoard
            alerts={alerts}
            currentUser={currentUser}
            isEmergencyMode={isEmergencyMode}
            onToggleEmergencyMode={handleToggleEmergencyMode}
            onOpenPublish={() => setIsPublishOpen(true)}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'map' && (
          <CommunityMap
            services={services}
            favors={favors}
            alerts={alerts}
            currentNeighborhood={currentNeighborhood}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            currentUser={currentUser}
            services={services}
            favors={favors}
            alerts={alerts}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onRefresh={refreshAllData}
          />
        )}
      </main>

      {/* Desktop Floating Action Button for 3-Click Publish */}
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <button
          onClick={() => setIsPublishOpen(true)}
          className="px-5 py-3 rounded-full bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xl flex items-center gap-2 transition-all active:scale-95 border-2 border-white ring-4 ring-teal-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Publicar en 3 Clics</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenPublish={() => setIsPublishOpen(true)}
        isEmergencyMode={isEmergencyMode}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onUserChange={(newUser) => {
          setCurrentUser(newUser);
          refreshAllData();
        }}
      />

      <ThreeClickPublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        currentUser={currentUser}
        onSuccess={refreshAllData}
      />

      <NeighborGuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}
