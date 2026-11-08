/* Datos de demostración: un sector con vecinos, servicios, favores y grupos de apoyo.
 * Se cargan una sola vez (o al tocar "Reiniciar datos de demostración"). */
import { db, load, save } from './storage';

const DIA = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;
const hace = (ms) => Date.now() - ms;

const SECTOR_ID = 's-jardines';
export const USUARIO_DEMO_ID = 'u-rosa';

function vecino(id, firstName, lastName, manzana, dias, extra = {}) {
  return {
    id,
    firstName,
    lastName,
    manzana,
    phone: `5190000${String(Math.abs(id.length * 7919 + manzana.charCodeAt(0) * 31)).padStart(4, '0')}`,
    sectorId: SECTOR_ID,
    verified: true,
    showFullName: false,
    createdAt: hace(dias * DIA),
    updatedAt: Date.now(),
    ...extra,
  };
}

export function ensureSeed() {
  if (load('seeded', false)) return;

  save('sectors', [
    {
      id: SECTOR_ID,
      name: 'Los Jardines · Sector 3',
      manzanas: ['A', 'B', 'C', 'D', 'E', 'F'],
      guardianIds: ['u-carmen'],
      createdAt: hace(200 * DIA),
    },
    {
      id: 's-alameda',
      name: 'La Alameda · Sector 4',
      manzanas: ['A', 'B', 'C', 'D'],
      guardianIds: [],
      createdAt: hace(120 * DIA),
    },
  ]);

  save('users', [
    vecino(USUARIO_DEMO_ID, 'Rosa', 'Mendoza', 'B', 36),
    vecino('u-carmen', 'Carmen', 'Rojas', 'C', 210, { inviteAnswered: 'aceptada' }),
    vecino('u-luis', 'Luis', 'Quispe', 'D', 180, { showFullName: true }),
    vecino('u-marco', 'Marco', 'Salas', 'F', 150),
    vecino('u-hugo', 'Hugo', 'Paredes', 'E', 90),
    vecino('u-elena', 'Elena', 'Huamán', 'A', 75),
    vecino('u-jorge', 'Jorge', 'Torres', 'C', 160),
    vecino('u-ana', 'Ana', 'Mamani', 'B', 140),
    vecino('u-mariela', 'Mariela', 'Flores', 'F', 100),
    vecino('u-pedro', 'Pedro', 'Castillo', 'A', 130),
  ]);

  const servicio = (id, ownerId, data) => ({
    id,
    ownerId,
    clase: 'servicio',
    status: 'disponible',
    hidden: false,
    showFullName: false,
    foto: null,
    createdAt: hace(60 * DIA),
    updatedAt: Date.now(),
    ...data,
  });

  save('services', [
    servicio('s-luis', 'u-luis', {
      titulo: 'Gasfitero',
      categoria: 'gasfiteria',
      descripcion: 'Arreglo fugas, termas y desagües. 12 años de experiencia en el barrio.',
      horario: 'Lun–Sáb, 8am–6pm',
      precio: 'S/ 30',
      showFullName: true,
      baseVistos: 16,
      baseTags: { puntual: 8, precio: 7, limpio: 5, volveria: 4 },
    }),
    servicio('s-marco', 'u-marco', {
      titulo: 'Gasfitero',
      categoria: 'gasfiteria',
      descripcion: 'Instalación de caños, inodoros y lavaderos.',
      horario: 'Lun–Vie, 9am–5pm',
      precio: 'S/ 35',
      baseVistos: 12,
      baseTags: { limpio: 6, rapido: 5 },
    }),
    servicio('s-hugo', 'u-hugo', {
      titulo: 'Gasfitería y termas',
      categoria: 'gasfiteria',
      descripcion: 'Mantenimiento de termas eléctricas y a gas.',
      horario: 'Todos los días, 7am–8pm',
      precio: 'S/ 40',
      baseVistos: 9,
      baseTags: { amable: 5 },
    }),
    servicio('s-elena', 'u-elena', {
      titulo: 'Desatoros',
      categoria: 'gasfiteria',
      descripcion: 'Desatoro de desagües con equipo.',
      horario: 'Lun–Sáb, 8am–4pm',
      baseVistos: 5,
      baseTags: { volveria: 3 },
    }),
    servicio('s-pedro', 'u-pedro', {
      titulo: 'Electricista',
      categoria: 'electricidad',
      descripcion: 'Instalaciones, tableros y cortocircuitos.',
      horario: 'Lun–Sáb, 8am–6pm',
      precio: 'S/ 40',
      baseVistos: 10,
      baseTags: { puntual: 6, precio: 4 },
    }),
    servicio('s-jorge', 'u-jorge', {
      titulo: 'Carpintero',
      categoria: 'carpinteria',
      descripcion: 'Muebles a medida y reparación de puertas.',
      horario: 'Lun–Vie, 8am–5pm',
      baseVistos: 6,
      baseTags: { limpio: 4 },
    }),
    servicio('s-carmen', 'u-carmen', {
      titulo: 'Costurera',
      categoria: 'costura',
      descripcion: 'Arreglos de ropa, basta y cierres en el día.',
      horario: 'Lun–Sáb, 9am–7pm',
      precio: 'S/ 5',
      baseVistos: 14,
      baseTags: { rapido: 8, precio: 6 },
    }),
    servicio('s-mariela', 'u-mariela', {
      titulo: 'Profesora',
      categoria: 'clases',
      descripcion: 'Clases de matemática para colegio y Excel básico.',
      horario: 'Tardes, 3pm–7pm',
      precio: 'S/ 20 la hora',
      baseVistos: 7,
      baseTags: { amable: 5 },
    }),
    servicio('s-ana', 'u-ana', {
      titulo: 'Paseo de mascotas',
      categoria: 'mascotas',
      descripcion: 'Paseo de perros por el parque, mañanas.',
      horario: 'Lun–Vie, 7am–10am',
      precio: 'S/ 10',
      baseVistos: 8,
      baseTags: { puntual: 5 },
    }),
    servicio('s-ana-pan', 'u-ana', {
      clase: 'producto',
      titulo: 'Panes caseros',
      categoria: 'comida',
      descripcion: 'Pan de yema y ciabatta recién horneados. Pedidos hasta las 6pm.',
      horario: 'Todos los días',
      precio: 'S/ 0.50 c/u',
      baseVistos: 11,
      baseTags: { precio: 6, volveria: 5 },
    }),
    // Publicación sospechosa ya reportada 3 veces: aparece en el Panel del Guardián.
    servicio('s-sospechoso', 'u-marco', {
      clase: 'producto',
      titulo: 'Celular nuevo',
      categoria: 'otros',
      descripcion: 'Vendo celular nuevo a S/ 50, pago adelantado.',
      horario: '—',
      precio: 'S/ 50',
      hidden: true,
      baseVistos: 0,
    }),
  ]);

  save('recommendations', [
    { id: 'r1', serviceId: 's-luis', userId: 'u-carmen', tags: ['puntual', 'precio'], comment: 'Llegó en 20 minutos y cobró justo.', createdAt: hace(9 * DIA) },
    { id: 'r2', serviceId: 's-luis', userId: 'u-pedro', tags: ['limpio'], comment: 'Me arregló la terma, muy limpio.', createdAt: hace(4 * DIA) },
    { id: 'r3', serviceId: 's-carmen', userId: 'u-ana', tags: ['rapido'], comment: 'Me hizo la basta en una hora.', createdAt: hace(2 * DIA) },
  ]);

  // Rosa le escribió a Luis por WhatsApp: al entrar verá "¿Te atendió Luis?".
  save('contacts', [{ id: 'c1', serviceId: 's-luis', userId: USUARIO_DEMO_ID, answered: false, createdAt: hace(1 * DIA) }]);

  const favor = (id, ownerId, tipo, titulo, detalles, extra = {}) => ({
    id,
    ownerId,
    tipo,
    titulo,
    detalles,
    foto: null,
    status: 'disponible',
    hidden: false,
    takerId: null,
    reservedAt: null,
    ownerConfirmed: false,
    takerConfirmed: false,
    createdAt: hace(30 * MIN),
    updatedAt: Date.now(),
    ...extra,
  });

  save('favors', [
    favor('f-escalera', 'u-jorge', 'presto', 'Escalera de 3 metros', { duracion: '1 día', condicion: 'Devolverla limpia, por favor 🙏' }, { createdAt: hace(10 * MIN) }),
    favor('f-ladrillos', 'u-ana', 'regalo', '20 ladrillos y una bolsa de cemento', { estado: 'Sobrante', cantidad: '20 ladrillos, 1 bolsa' }, { createdAt: hace(60 * MIN) }),
    favor('f-excel', 'u-mariela', 'intercambio', 'Clases de Excel a cambio de clases de pan', { ofrezco: 'Clases de Excel (2 horas)', busco: 'Que me enseñen a hacer pan' }, { createdAt: hace(3 * 60 * MIN) }),
    favor('f-taladro', 'u-pedro', 'pido', 'Un taladro prestado para colgar una repisa', { clase: 'Favor', cuando: 'Hoy' }, { createdAt: hace(45 * MIN) }),
    favor('f-olla', USUARIO_DEMO_ID, 'presto', 'Olla grande para 30 personas', { duracion: 'Unas horas', condicion: '' }, { createdAt: hace(2 * DIA) }),
    // Favores ya cerrados → alimentan el Balance de Ayni.
    favor('f-ropero', 'u-pedro', 'pido', 'Ayuda para cargar un ropero', { clase: 'Favor', cuando: 'Hoy' }, { status: 'cerrado', takerId: USUARIO_DEMO_ID, ownerConfirmed: true, takerConfirmed: true, closedAt: hace(5 * DIA), createdAt: hace(6 * DIA) }),
    favor('f-perro', USUARIO_DEMO_ID, 'pido', 'Que me cuiden al perro una tarde', { clase: 'Favor', cuando: 'Esta semana' }, { status: 'cerrado', takerId: 'u-mariela', ownerConfirmed: true, takerConfirmed: true, closedAt: hace(12 * DIA), createdAt: hace(13 * DIA) }),
    favor('f-carretilla', 'u-jorge', 'presto', 'Carretilla', { duracion: '1 día' }, { status: 'cerrado', takerId: 'u-ana', ownerConfirmed: true, takerConfirmed: true, closedAt: hace(20 * DIA), createdAt: hace(21 * DIA) }),
    favor('f-arena', 'u-jorge', 'regalo', 'Media cubeta de arena fina', { estado: 'Sobrante', cantidad: 'Media cubeta' }, { status: 'cerrado', takerId: 'u-pedro', ownerConfirmed: true, takerConfirmed: true, closedAt: hace(30 * DIA), createdAt: hace(31 * DIA) }),
  ]);

  save('reports', [
    { id: 'rep1', col: 'services', targetId: 's-sospechoso', userId: 'u-ana', reason: 'Parece estafa', createdAt: hace(3 * 60 * MIN) },
    { id: 'rep2', col: 'services', targetId: 's-sospechoso', userId: 'u-pedro', reason: 'Parece estafa', createdAt: hace(2 * 60 * MIN) },
    { id: 'rep3', col: 'services', targetId: 's-sospechoso', userId: 'u-jorge', reason: 'Información falsa', createdAt: hace(60 * MIN) },
  ]);

  // Directorio de servicios y grupos de apoyo para emergencias.
  const grupo = (id, emoji, name, meta, recurso, manzana, contacto) => ({ id, emoji, name, meta, recurso, manzana, contacto, sectorId: SECTOR_ID, createdAt: hace(90 * DIA) });
  save('groups', [
    grupo('g-bomberos', '🚒', 'Bomberos voluntarios', 'Compañía cercana · a 8 cuadras', null, 'A', { tipo: 'tel', valor: '116' }),
    grupo('g-posta', '🏥', 'Posta médica', 'Abierta 24 h · a 6 cuadras', 'salud', 'E', { tipo: 'tel', valor: '106' }),
    grupo('g-enfermera', '🩺', 'Enfermera vecina (Carmen)', 'Primeros auxilios · Mz. C', 'salud', 'C', { tipo: 'wa', valor: '51900001234' }),
    grupo('g-olla', '🍲', 'Olla común Los Jardines', 'Mz. F · almuerzos solidarios', 'comida', 'F', { tipo: 'wa', valor: '51900002345' }),
    grupo('g-agua1', '💧', 'Punto de agua · Parque', 'Cisterna comunitaria', 'agua', 'D', { tipo: 'wa', valor: '51900003456' }),
    grupo('g-agua2', '💧', 'Punto de agua · Mz. A', 'Bidones disponibles', 'agua', 'A', { tipo: 'wa', valor: '51900003457' }),
    grupo('g-albergue', '🏫', 'Albergue · Colegio N.° 3045', 'Capacidad 80 personas', 'refugio', 'E', { tipo: 'tel', valor: '105' }),
    grupo('g-generador', '🔌', 'Generador vecinal', 'Carga de celulares · Mz. B', 'energia', 'B', { tipo: 'wa', valor: '51900004567' }),
    grupo('g-traslado', '🚐', 'Movilidad solidaria', '4 vecinos con auto', 'traslado', 'C', { tipo: 'wa', valor: '51900005678' }),
    grupo('g-brigada', '🧰', 'Brigada vecinal de rescate', '6 voluntarios activos', null, 'D', { tipo: 'wa', valor: '51900006789' }),
    grupo('g-mascotas', '🐾', 'Rescate de mascotas', '2 voluntarios · Mz. A', null, 'A', { tipo: 'wa', valor: '51900007890' }),
  ]);

  save('emergencies', []);
  save('needs', []);
  save('seeded', true);
}

export function reiniciarDemo() {
  db.reset();
  ensureSeed();
}
