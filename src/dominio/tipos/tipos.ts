export type IsoDateTime = string;
export type UUID = string;

export const ROLES_PLATAFORMA = ['usuario', 'admin'] as const;
export type RolPlataforma = (typeof ROLES_PLATAFORMA)[number];

export const IDIOMAS = ['es', 'en', 'qu'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const TIPOS_GRUPO = ['manzana', 'barrio', 'comite_emergencia', 'interes'] as const;
export type TipoGrupo = (typeof TIPOS_GRUPO)[number];

export const ROLES_MEMBRESIA = ['vecino', 'referente', 'emprendedor', 'coordinador'] as const;
export type RolMembresia = (typeof ROLES_MEMBRESIA)[number];

export const ESTADOS_MEMBRESIA = ['activa', 'suspendida'] as const;
export type EstadoMembresia = (typeof ESTADOS_MEMBRESIA)[number];

export const CATEGORIAS_SERVICIO = [
	'gasfiteria',
	'carpinteria',
	'electricidad',
	'cerrajeria',
	'clases',
	'paseo_mascotas',
	'comida',
	'costura',
	'reparaciones',
	'cuidado',
	'otro'
] as const;
export type CategoriaServicio = (typeof CATEGORIAS_SERVICIO)[number];

export const TIPOS_RECOMENDACION = ['visto_bueno', 'retiro'] as const;
export type TipoRecomendacionEvento = (typeof TIPOS_RECOMENDACION)[number];

export const TIPOS_FAVOR = ['oferta', 'necesidad'] as const;
export type TipoFavor = (typeof TIPOS_FAVOR)[number];

export const CATEGORIAS_FAVOR = [
	'prestamo_herramienta',
	'ayuda_temporal',
	'donacion',
	'trueque_habilidad',
	'movilidad',
	'otro'
] as const;
export type CategoriaFavor = (typeof CATEGORIAS_FAVOR)[number];

export const ESTADOS_FAVOR = ['abierto', 'en_curso', 'cerrado', 'cancelado'] as const;
export type EstadoFavor = (typeof ESTADOS_FAVOR)[number];

export const ROLES_EN_FAVOR = ['solicitante', 'ayudante'] as const;
export type RolEnFavor = (typeof ROLES_EN_FAVOR)[number];

export const METODOS_CONFIRMACION = ['qr', 'boton'] as const;
export type MetodoConfirmacion = (typeof METODOS_CONFIRMACION)[number];

export const TIPOS_EMERGENCIA = [
	'lluvias_inundacion',
	'sismo',
	'huaico',
	'incendio',
	'otro'
] as const;
export type TipoEmergencia = (typeof TIPOS_EMERGENCIA)[number];

// Tipos que reporta el usuario (UI) - usados en la interfaz
export const TIPOS_ALERTA = [
	'persona_vulnerable',
	'zona_inundada',
	'via_bloqueada',
	'sin_servicios_basicos',
	'riesgo_estructural',
	'otro'
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

// Mapeo explícito entre desastre (API/RB) y alerta (reporte ciudadano)
export const MAPEO_DESASTRES_ALERTA: Record<TipoEmergencia, TipoAlerta> = {
	'lluvias_inundacion': 'zona_inundada',
	'sismo': 'riesgo_estructural',
	'huaico': 'zona_inundada',
	'incendio': 'persona_vulnerable',
	'otro': 'otro'
} as const;

export const MAPEO_ALERTA_DESASTRES: Record<TipoAlerta, TipoEmergencia> = {
	'persona_vulnerable': 'incendio',
	'zona_inundada': 'lluvias_inundacion',
	'via_bloqueada': 'otro',
	'sin_servicios_basicos': 'otro',
	'riesgo_estructural': 'sismo',
	'otro': 'otro'
} as const;

export const TIPOS_PUNTO_APOYO = [
	'comando',
	'bomberos',
	'posta_salud',
	'refugio',
	'punto_reunion',
	'olla_comun',
	'policia',
	'otro'
] as const;
export type TipoPuntoApoyo = (typeof TIPOS_PUNTO_APOYO)[number];

export const TIPOS_ALERTA = [
	'persona_vulnerable',
	'zona_inundada',
	'via_bloqueada',
	'sin_servicios_basicos',
	'riesgo_estructural',
	'otro'
] as const;
export type TipoAlerta = (typeof TIPOS_ALERTA)[number];

export const ESTADOS_ALERTA = [
	'sin_verificar',
	'confirmado_vecinos',
	'atendido',
	'descartado'
] as const;
export type EstadoAlerta = (typeof ESTADOS_ALERTA)[number];

export const TIPOS_RECURSO_CRITICO = [
	'agua',
	'gas',
	'medicinas',
	'refugio',
	'generador',
	'bote',
	'bomba_agua',
	'alimentos',
	'otro'
] as const;
export type TipoRecursoCritico = (typeof TIPOS_RECURSO_CRITICO)[number];

export const MODOS_RECURSO = ['ofrece', 'necesita'] as const;
export type ModoRecurso = (typeof MODOS_RECURSO)[number];

export const OBJETOS_REPORTE = ['servicio', 'favor', 'alerta', 'recurso', 'usuario'] as const;
export type ObjetoReporte = (typeof OBJETOS_REPORTE)[number];

export const MOTIVOS_REPORTE = [
	'falso',
	'ofensivo',
	'spam',
	'peligroso',
	'datos_personales',
	'otro'
] as const;
export type MotivoReporte = (typeof MOTIVOS_REPORTE)[number];

export const ESTADOS_REPORTE = ['pendiente', 'ocultado', 'descartado'] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];

export const ESTADOS_ANUNCIO = ['pendiente', 'aprobado', 'rechazado', 'pausado'] as const;
export type EstadoAnuncio = (typeof ESTADOS_ANUNCIO)[number];

export const FUENTES_REPUTACION = [
	'visto_bueno_recibido',
	'visto_bueno_retirado',
	'favor_cerrado',
	'reporte_confirmado',
	'sancion',
	'bono_emprendedor'
] as const;
export type FuenteReputacion = (typeof FUENTES_REPUTACION)[number];

export const FUENTES_ALERTA_OFICIAL = ['indeci', 'senamhi', 'igp', 'municipio', 'otro'] as const;
export type FuenteAlertaOficial = (typeof FUENTES_ALERTA_OFICIAL)[number];

export const NIVELES_ALERTA_OFICIAL = ['informativo', 'amarillo', 'naranja', 'rojo'] as const;
export type NivelAlertaOficial = (typeof NIVELES_ALERTA_OFICIAL)[number];

export const ESTADOS_ALERTA_OFICIAL = ['propuesta', 'confirmada', 'descartada'] as const;
export type EstadoAlertaOficial = (typeof ESTADOS_ALERTA_OFICIAL)[number];

export const OPERACIONES_SYNC = ['crear', 'actualizar'] as const;
export type OperacionSync = (typeof OPERACIONES_SYNC)[number];

export const ESTADOS_SYNC_COLA = ['pendiente', 'enviando', 'aplicada', 'rechazada'] as const;
export type EstadoSyncCola = (typeof ESTADOS_SYNC_COLA)[number];

export const ESTRATEGIAS_SYNC = [
	'append_only',
	'ultima_escritura',
	'primero_gana',
	'servidor_manda'
] as const;
export type EstrategiaSync = (typeof ESTRATEGIAS_SYNC)[number];

export interface CoordenadaAprox {
	lat_aprox: number;
	lng_aprox: number;
}

export interface Zona {
	id: UUID;
	nombre: string;
	distrito: string;
	provincia: string;
	departamento: string;
	lat_centro: number;
	lng_centro: number;
	creado_en: IsoDateTime;
}

export interface Usuario {
	id: UUID;
	zona_id: UUID;
	alias: string;
	telefono: string | null;
	password_hash: string | null;
	pin_hash: string | null;
	rol_plataforma: RolPlataforma;
	idioma: Idioma;
	bloqueado: 0 | 1;
	creado_en: IsoDateTime;
	actualizado_en: IsoDateTime;
}

export interface Grupo {
	id: UUID;
	zona_id: UUID;
	padre_id: UUID | null;
	tipo: TipoGrupo;
	nombre: string;
	reglas: string;
	creado_por: UUID;
	creado_en: IsoDateTime;
}

export interface Membresia {
	grupo_id: UUID;
	usuario_id: UUID;
	rol: RolMembresia;
	estado: EstadoMembresia;
	desde: IsoDateTime;
}

export interface RolUsuarioVista {
	usuario_id: UUID;
	zona_id: UUID;
	grupo_id: UUID;
	rol: RolMembresia;
}

export interface Servicio extends CoordenadaAprox {
	id: UUID;
	usuario_id: UUID;
	zona_id: UUID;
	categoria: CategoriaServicio;
	titulo: string;
	descripcion: string;
	foto?: string | null;
	es_emprendimiento: 0 | 1;
	activo: 0 | 1;
	oculto: 0 | 1;
	creado_en: IsoDateTime;
	actualizado_en: IsoDateTime;
}

export interface RecomendacionEvento {
	id: UUID;
	servicio_id: UUID;
	usuario_id: UUID;
	tipo: TipoRecomendacionEvento;
	comentario: string | null;
	misma_zona: 0 | 1;
	dispositivo_hash: string;
	creado_en: IsoDateTime;
}

export interface VistoBuenoVigente {
	servicio_id: UUID;
	usuario_id: UUID;
	comentario: string | null;
	misma_zona: 0 | 1;
	creado_en: IsoDateTime;
}

export interface ServicioResumen {
	servicio_id: UUID;
	total_vistos_buenos: number;
	vistos_buenos_misma_zona: number;
}

export interface Insignia {
	codigo: string;
	nombre: string;
	descripcion: string;
	umbral: number;
}

export interface UsuarioInsignia {
	usuario_id: UUID;
	insignia: string;
	obtenida_en: IsoDateTime;
}

export interface Favor extends CoordenadaAprox {
	id: UUID;
	creador_id: UUID;
	ayudante_id: UUID | null;
	zona_id: UUID;
	tipo: TipoFavor;
	categoria: CategoriaFavor;
	titulo: string;
	descripcion: string;
	estado: EstadoFavor;
	agradecimiento: string | null;
	oculto: 0 | 1;
	creado_en: IsoDateTime;
	cerrado_en: IsoDateTime | null;
}

export interface FavorConfirmacion {
	id: UUID;
	favor_id: UUID;
	usuario_id: UUID;
	rol_en_favor: RolEnFavor;
	metodo: MetodoConfirmacion;
	confirmado_en: IsoDateTime;
}

export interface Emergencia {
	id: UUID;
	zona_id: UUID;
	tipo: TipoEmergencia;
	titulo: string;
	activada_por: UUID;
	activa: 0 | 1;
	inicio: IsoDateTime;
	fin: IsoDateTime | null;
}

export interface PuntoApoyo extends CoordenadaAprox {
	id: UUID;
	zona_id: UUID;
	tipo: TipoPuntoApoyo;
	nombre: string;
	telefono: string | null;
	verificado: 0 | 1;
}

export interface Alerta extends CoordenadaAprox {
	id: UUID;
	emergencia_id: UUID | null;
	usuario_id: UUID;
	zona_id: UUID;
	tipo: TipoAlerta;
	descripcion: string;
	estado: EstadoAlerta;
	oculto: 0 | 1;
	creado_en: IsoDateTime;
	actualizado_en: IsoDateTime;
}

export interface AlertaConfirmacion {
	id: UUID;
	alerta_id: UUID;
	usuario_id: UUID;
	confirmado_en: IsoDateTime;
}

export interface RecursoCritico extends CoordenadaAprox {
	id: UUID;
	emergencia_id: UUID | null;
	usuario_id: UUID;
	zona_id: UUID;
	tipo: TipoRecursoCritico;
	modo: ModoRecurso;
	detalle: string;
	disponible: 0 | 1;
	oculto: 0 | 1;
	creado_en: IsoDateTime;
}

export interface ReporteModeracion {
	id: UUID;
	reportante_id: UUID;
	grupo_id: UUID | null;
	objeto_tipo: ObjetoReporte;
	objeto_id: UUID;
	motivo: MotivoReporte;
	detalle: string | null;
	estado: EstadoReporte;
	resuelto_por: UUID | null;
	creado_en: IsoDateTime;
}

export interface Bloqueo {
	usuario_id: UUID;
	bloqueado_id: UUID;
	creado_en: IsoDateTime;
}

export interface Anuncio {
	id: UUID;
	anunciante_id: UUID;
	zona_id: UUID;
	titulo: string;
	descripcion: string;
	etiqueta: 'publicidad';
	estado: EstadoAnuncio;
	aprobado_por: UUID | null;
	inicio: IsoDateTime;
	fin: IsoDateTime | null;
	creado_en: IsoDateTime;
}

export interface ReputacionEvento {
	id: UUID;
	usuario_id: UUID;
	fuente: FuenteReputacion;
	puntos: number;
	referencia_id: UUID | null;
	creado_en: IsoDateTime;
}

export interface ReputacionVista {
	usuario_id: UUID;
	reputacion: number;
}

export interface AlertaOficial {
	id: UUID;
	fuente: FuenteAlertaOficial;
	id_externo: string;
	titulo: string;
	detalle: string | null;
	nivel: NivelAlertaOficial;
	zona_id: UUID | null;
	url_origen: string | null;
	payload: string | null;
	estado: EstadoAlertaOficial;
	emergencia_id: UUID | null;
	resuelta_por: UUID | null;
	recibida_en: IsoDateTime;
	resuelta_en: IsoDateTime | null;
}

export interface SyncCola {
	op_id: UUID;
	entidad: string;
	operacion: OperacionSync;
	payload: string;
	estado: EstadoSyncCola;
	intentos: number;
	error: string | null;
	creado_en: IsoDateTime;
}

export interface SyncEstado {
	clave: string;
	valor: string;
}

export interface SyncPolitica {
	entidad: string;
	estrategia: EstrategiaSync;
	nota: string | null;
}

// Compatibilidad con capa sync/UI existente
export interface EventoComun {
	id: string;
	usuarioId: string;
	creadoEn: Date;
}

export interface MutacionCola {
	id: string;
	accion: string;
	payload: string;
	estadoOffline: 'Pendiente de enviar' | 'Enviada';
	creadoEn: number;
	entidad?: string;
	operacion?: OperacionSync;
	intentos?: number;
	error?: string | null;
}

export function ahoraIso(): IsoDateTime {
	return new Date().toISOString();
}

export function aEventoComun<T extends { id: string; creado_en: IsoDateTime }>(
	fila: T,
	usuarioId: string
): EventoComun & T {
	return { ...fila, usuarioId, creadoEn: new Date(fila.creado_en) };
}
