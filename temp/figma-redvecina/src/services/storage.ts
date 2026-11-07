import { 
  User, 
  NeighborhoodService, 
  SolidarityFavor, 
  HumanitarianAlert, 
  OfflineAction,
  NeighborReview 
} from '../types';
import { DEMO_USERS, INITIAL_SERVICES, INITIAL_FAVORS, INITIAL_ALERTS } from '../data/mockInitialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'redvecina_current_user',
  USERS: 'redvecina_users',
  SERVICES: 'redvecina_services',
  FAVORS: 'redvecina_favors',
  ALERTS: 'redvecina_alerts',
  EMERGENCY_MODE: 'redvecina_emergency_mode',
  OFFLINE_QUEUE: 'redvecina_offline_queue',
  NEIGHBORHOOD: 'redvecina_current_neighborhood',
  TUTORIAL_SEEN: 'redvecina_tutorial_seen',
};

// Custom event name for storage changes across components
export const STORAGE_CHANGE_EVENT = 'redvecina_data_changed';

function emitChange(reason: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { reason } }));
  }
}

class NeighborhoodStorageService {
  constructor() {
    this.initData();
  }

  private initData() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      // Default to Doña Rosa (vecino role)
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FAVORS)) {
      localStorage.setItem(STORAGE_KEYS.FAVORS, JSON.stringify(INITIAL_FAVORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ALERTS)) {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMERGENCY_MODE)) {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_MODE, 'false');
    }
    if (!localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE)) {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEIGHBORHOOD)) {
      localStorage.setItem(STORAGE_KEYS.NEIGHBORHOOD, 'Surco - La Capullana');
    }
  }

  // Current User Management
  getCurrentUser(): User {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading current user', e);
    }
    return DEMO_USERS[0];
  }

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    // Also ensure this user is in the known users list
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    emitChange('user_switched');
  }

  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading users', e);
    }
    return DEMO_USERS;
  }

  registerUser(newUser: Omit<User, 'id' | 'solidarityPoints' | 'verifiedNeighbor'>): User {
    const user: User = {
      ...newUser,
      id: `user-${Date.now()}`,
      solidarityPoints: 50, // Bono de bienvenida
      verifiedNeighbor: true,
    };
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(user);
    emitChange('user_registered');
    return user;
  }

  // Emergency Mode
  isEmergencyMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.EMERGENCY_MODE) === 'true';
  }

  setEmergencyMode(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_MODE, enabled ? 'true' : 'false');
    emitChange('emergency_mode_toggled');
  }

  // Neighborhood selection
  getCurrentNeighborhood(): string {
    return localStorage.getItem(STORAGE_KEYS.NEIGHBORHOOD) || 'Surco - La Capullana';
  }

  setCurrentNeighborhood(name: string): void {
    localStorage.setItem(STORAGE_KEYS.NEIGHBORHOOD, name);
    emitChange('neighborhood_changed');
  }

  // Tutorial tracking
  hasSeenTutorial(): boolean {
    return localStorage.getItem(STORAGE_KEYS.TUTORIAL_SEEN) === 'true';
  }

  setTutorialSeen(seen: boolean = true): void {
    localStorage.setItem(STORAGE_KEYS.TUTORIAL_SEEN, seen ? 'true' : 'false');
  }

  // Services & "Visto Bueno Vecinal"
  getServices(): NeighborhoodService[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading services', e);
    }
    return INITIAL_SERVICES;
  }

  addService(serviceData: Omit<NeighborhoodService, 'id' | 'vistoBuenoCount' | 'reviews' | 'createdAt'>): NeighborhoodService {
    const service: NeighborhoodService = {
      ...serviceData,
      id: `srv-${Date.now()}`,
      vistoBuenoCount: 1, // Auto-visto bueno inicial
      reviews: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}`,
        type: 'create_service',
        payload: service,
        timestamp: Date.now(),
      });
    }

    const services = this.getServices();
    services.unshift(service);
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    emitChange('service_added');
    return service;
  }

  giveVistoBueno(serviceId: string, review?: { comment: string; workDone: string; rating: number }): boolean {
    const user = this.getCurrentUser();
    const services = this.getServices();
    const service = services.find(s => s.id === serviceId);
    if (!service) return false;

    // Check if user already reviewed
    const alreadyReviewed = service.reviews.some(r => r.reviewerId === user.id);
    if (alreadyReviewed && !review) {
      return false; // Can't just spam visto bueno without review if already done
    }

    service.vistoBuenoCount += 1;

    if (review) {
      const newReview: NeighborReview = {
        id: `rev-${Date.now()}`,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerNeighborhood: user.neighborhood,
        date: 'Hoy',
        comment: review.comment,
        rating: review.rating,
        workDone: review.workDone,
      };
      service.reviews.unshift(newReview);
    }

    // Reward both provider and reviewer with solidarity points
    user.solidarityPoints += 10;
    this.setCurrentUser(user);

    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    emitChange('visto_bueno_added');
    return true;
  }

  // Favors Wall (Economía Solidaria)
  getFavors(): SolidarityFavor[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading favors', e);
    }
    return INITIAL_FAVORS;
  }

  addFavor(favorData: Omit<SolidarityFavor, 'id' | 'status' | 'createdAt'>): SolidarityFavor {
    const favor: SolidarityFavor = {
      ...favorData,
      id: `fav-${Date.now()}`,
      status: 'abierto',
      createdAt: 'Hace un momento',
    };

    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}`,
        type: 'create_favor',
        payload: favor,
        timestamp: Date.now(),
      });
    }

    const favors = this.getFavors();
    favors.unshift(favor);
    localStorage.setItem(STORAGE_KEYS.FAVORS, JSON.stringify(favors));
    emitChange('favor_added');
    return favor;
  }

  acceptFavor(favorId: string, offerMessage?: string): boolean {
    const user = this.getCurrentUser();
    const favors = this.getFavors();
    const favor = favors.find(f => f.id === favorId);
    if (!favor) return false;

    favor.status = 'en_curso';
    favor.acceptedBy = {
      userId: user.id,
      userName: user.name,
      message: offerMessage || '¡Hola vecino! Me sumo para ayudarte con mucho gusto.',
      acceptedAt: 'Hace unos minutos',
    };

    // Solidarity points for helping
    user.solidarityPoints += 25;
    this.setCurrentUser(user);

    localStorage.setItem(STORAGE_KEYS.FAVORS, JSON.stringify(favors));
    emitChange('favor_accepted');
    return true;
  }

  completeFavor(favorId: string, thankYouMessage: string): boolean {
    const favors = this.getFavors();
    const favor = favors.find(f => f.id === favorId);
    if (!favor) return false;

    favor.status = 'completado';
    favor.thankYouMessage = thankYouMessage;

    // Grant extra points for completing a chain of favors
    const currentUser = this.getCurrentUser();
    currentUser.solidarityPoints += 30;
    this.setCurrentUser(currentUser);

    localStorage.setItem(STORAGE_KEYS.FAVORS, JSON.stringify(favors));
    emitChange('favor_completed');
    return true;
  }

  // Humanitarian Alerts
  getAlerts(): HumanitarianAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading alerts', e);
    }
    return INITIAL_ALERTS;
  }

  addAlert(alertData: Omit<HumanitarianAlert, 'id' | 'resolved' | 'createdAt'>): HumanitarianAlert {
    const user = this.getCurrentUser();
    const alert: HumanitarianAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      resolved: false,
      officialValidation: user.role === 'coordinador',
      createdAt: 'Hace un momento',
    };

    if (!navigator.onLine) {
      this.enqueueOfflineAction({
        id: `offline-${Date.now()}`,
        type: 'create_alert',
        payload: alert,
        timestamp: Date.now(),
      });
    }

    const alerts = this.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    emitChange('alert_added');
    return alert;
  }

  toggleAlertResolved(alertId: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.resolved = !alert.resolved;
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    emitChange('alert_updated');
  }

  toggleAlertOfficialValidation(alertId: string): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.officialValidation = !alert.officialValidation;
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    emitChange('alert_updated');
  }

  offerResourceToAlert(alertId: string, resourceDescription: string): void {
    const user = this.getCurrentUser();
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.resourcesProvided.push(`${resourceDescription} (Aportado por ${user.name})`);
    user.solidarityPoints += 40;
    this.setCurrentUser(user);

    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    emitChange('resource_offered');
  }

  // Offline Sync Management
  getOfflineQueue(): OfflineAction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error reading offline queue', e);
    }
    return [];
  }

  enqueueOfflineAction(action: OfflineAction): void {
    const queue = this.getOfflineQueue();
    queue.push(action);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    emitChange('offline_queue_updated');
  }

  flushOfflineQueue(): number {
    const queue = this.getOfflineQueue();
    const count = queue.length;
    if (count === 0) return 0;

    // In a real backend this would post to an API. Here we reconcile and clear.
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    emitChange('offline_queue_flushed');
    return count;
  }

  // Reset to initial mock dataset (useful for testing and demoing)
  resetDemoData(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEMO_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    localStorage.setItem(STORAGE_KEYS.FAVORS, JSON.stringify(INITIAL_FAVORS));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(INITIAL_ALERTS));
    localStorage.setItem(STORAGE_KEYS.EMERGENCY_MODE, 'false');
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    emitChange('all_reset');
  }
}

export const storage = new NeighborhoodStorageService();
