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
