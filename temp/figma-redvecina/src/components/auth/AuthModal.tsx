import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { storage } from '../../services/storage';
import { X, UserCheck, Shield, Sparkles, Check, Phone, MapPin, Wrench } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'register' | 'login'>('demo');
  const allUsers = storage.getUsers();

  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [neighborhood, setNeighborhood] = useState(storage.getCurrentNeighborhood());
  const [streetAddress, setStreetAddress] = useState('');
  const [role, setRole] = useState<UserRole>('vecino');
  const [tradeSpecialty, setTradeSpecialty] = useState('');
  const [bio, setBio] = useState('');

  // Login phone state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const handleSelectDemoUser = (user: User) => {
    storage.setCurrentUser(user);
    onUserChange(user);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    ];
    const avatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const registered = storage.registerUser({
      name: name.trim(),
      phone: phone.trim(),
      avatar,
      role,
      neighborhood: neighborhood.trim() || 'Surco - La Capullana',
      streetAddress: streetAddress.trim(),
      bio: bio.trim() || `Vecino activo del barrio ${neighborhood}.`,
      tradeSpecialty: role === 'oficio' ? (tradeSpecialty.trim() || 'Servicios generales') : undefined,
    });

    onUserChange(registered);
    onClose();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const matched = allUsers.find(u => u.phone.replace(/\s+/g, '').includes(loginPhone.replace(/\s+/g, '')));
    if (matched) {
      storage.setCurrentUser(matched);
      onUserChange(matched);
      onClose();
    } else {
      setLoginError('No se encontró una cuenta con ese teléfono. Puedes registrarte en 1 minuto o usar los perfiles demo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-200" />
              <h2 className="text-xl font-bold tracking-tight">Acceso a RedVecina</h2>
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              Identifícate con tu rol para interactuar con tu comunidad
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('demo')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'demo'
                ? 'border-teal-700 text-teal-900 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Perfiles Demo (1 Clic)
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-teal-700 text-teal-900 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Nuevo Registro
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-2.5 px-3 transition-colors border-b-2 ${
              activeTab === 'login'
                ? 'border-teal-700 text-teal-900 font-bold'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            Ingresar con Teléfono
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: DEMO PROFILES */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                Selecciona cualquiera de estos perfiles precargados para explorar la app desde la perspectiva de cada rol:
              </p>

              <div className="space-y-3">
                {allUsers.map((user) => {
                  const isCurrent = currentUser.id === user.id;
                  const roleBadge = 
                    user.role === 'coordinador'
                      ? 'Líder / Coordinadora Comunal'
                      : user.role === 'oficio'
                      ? `Oficio: ${user.tradeSpecialty || 'Especialista'}`
                      : 'Vecina Ciudadana';

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectDemoUser(user)}
                      className={`group cursor-pointer p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent
                          ? 'border-teal-600 bg-teal-50/60 shadow-xs'
                          : 'border-stone-200 hover:border-teal-400 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border border-stone-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-900 text-sm">{user.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-teal-800 font-medium mt-0.5">
                            {roleBadge}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {user.neighborhood} · {user.solidarityPoints} pts de solidaridad
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-3">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-medium text-teal-700 group-hover:text-teal-900 px-3 py-1.5 rounded-lg border border-teal-200 bg-white"
                          >
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>¿Deseas empezar desde cero?</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('register')}
                  className="font-semibold text-teal-700 hover:underline"
                >
                  Crear tu cuenta vecinal &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tu Nombre y Apellidos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Gutiérrez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+51 987 654 321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Barrio / Distrito *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Surco - La Capullana"
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Calle o Referencia de Vivienda
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle Las Dalias cdra 3"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ¿Cómo participarás en la comunidad? *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('vecino')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      role === 'vecino'
                        ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-teal-700 mb-1" />
                    <div className="text-xs font-bold text-stone-900">Vecino</div>
                    <div className="text-[10px] text-stone-500 leading-tight">Solidaridad y favores</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('oficio')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      role === 'oficio'
                        ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-amber-600 mb-1" />
                    <div className="text-xs font-bold text-stone-900">Oficio</div>
                    <div className="text-[10px] text-stone-500 leading-tight">Ofrecer servicios</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('coordinador')}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      role === 'coordinador'
                        ? 'border-teal-700 bg-teal-50 ring-1 ring-teal-700'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-rose-600 mb-1" />
                    <div className="text-xs font-bold text-stone-900">Coordinador</div>
                    <div className="text-[10px] text-stone-500 leading-tight">Líder emergencias</div>
                  </button>
                </div>
              </div>

              {role === 'oficio' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Especialidad u Oficio
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Gasfitero, Electricista, Costurera, Cerrajería"
                    value={tradeSpecialty}
                    onChange={(e) => setTradeSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Breve presentación para tus vecinos
                </label>
                <textarea
                  rows={2}
                  placeholder="Cuéntale a tu comunidad cómo te gustaría colaborar o qué sabes hacer..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99]"
              >
                Completar Registro y Entrar
              </button>
            </form>
          )}

          {/* TAB 3: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <p className="text-xs text-stone-600">
                Ingresa con tu número de teléfono registrado para acceder a tus publicaciones y reputación vecinal:
              </p>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Número de Celular
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 912 345 678"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PIN de 4 dígitos (Opcional para pruebas)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-300 text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-[0.99]"
              >
                Ingresar a mi cuenta
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
