export { ServicioRepoLocal } from './servicio.local';
export { RecomendacionRepoLocal } from './recomendacion.local';
export { FavorRepoLocal, FavorConfirmacionRepoLocal } from './favor.local';
export { AlertaRepoLocal, EmergenciaRepoLocal, RecursoCriticoRepoLocal } from './emergencia.local';

import { ServicioRepoLocal } from './servicio.local';
import { RecomendacionRepoLocal } from './recomendacion.local';
import { FavorRepoLocal, FavorConfirmacionRepoLocal } from './favor.local';
import { AlertaRepoLocal, EmergenciaRepoLocal, RecursoCriticoRepoLocal } from './emergencia.local';

export const repos = {
	servicios: new ServicioRepoLocal(),
	recomendaciones: new RecomendacionRepoLocal(),
	favores: new FavorRepoLocal(),
	favorConfirmaciones: new FavorConfirmacionRepoLocal(),
	alertas: new AlertaRepoLocal(),
	emergencias: new EmergenciaRepoLocal(),
	recursosCriticos: new RecursoCriticoRepoLocal()
};

export type Repos = typeof repos;

export * from './alerta-confirmacion.repository';
export * from './alerta-oficial.repository';
export * from './alerta.repository';
export * from './anuncio.repository';
export * from './bloqueo.repository';
export * from './emergencia.repository';
export * from './favor-confirmacion.repository';
export * from './favor.repository';
export * from './grupo.repository';
export * from './insignia.repository';
export * from './membresia.repository';
export * from './punto-apoyo.repository';
export * from './recomendacion-evento.repository';
export * from './recurso-critico.repository';
export * from './reporte-moderacion.repository';
export * from './reputacion-evento.repository';
export * from './servicio.repository';
export * from './sync-cola.repository';
export * from './sync-estado.repository';
export * from './sync-politica.repository';
export * from './usuario.repository';
export * from './zona.repository';
