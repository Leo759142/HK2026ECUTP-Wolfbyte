export const PLANES_USABILIDAD = {
	onboarding: {
		pasosMaximos: 5,
		permitirSaltar: true,
		recordarPreferencia: 'pod_onboarding_visto'
	},
	navegacion: {
		mobileTitle: true,
		progresoPasos: true,
		botonAtrasVisible: true,
		labelIdiomaVisible: true
	},
	feedback: {
		mensajeErrorVisible: true,
		campoErrorResaltado: true,
		toastConfirmacion: true,
		estadoVacioIlustrado: true
	},
	acceso: {
		codigoDemoVisible: true,
		maxIntentos: 5,
		bloqueoMinutos: 10,
		sesionMinutos: 10
	},
	formulario: {
		camposObligatoriosMarcados: true,
		placeholderGuia: true,
		validacionEnTiempoReal: true,
		botonDeshabilitadoMientrasInvalido: true
	},
	emergencia: {
		activacionUnClick: true,
		rolesPermitidos: ['coordinador', 'referente', 'admin'],
		notificacionInmediata: true
	},
	lista: {
		estadoVacioTexto: true,
		filtrosVisible: true,
		paginacionVisible: true,
		ordenPredeterminado: 'creado_en_desc'
	}
};

export function planOnboarding(pasos: number) {
	return Math.min(pasos, PLANES_USABILIDAD.onboarding.pasosMaximos);
}

export function planSesionMinutos() {
	return PLANES_USABILIDAD.acceso.sesionMinutos;
}

export function planRolesEmergencia() {
	return PLANES_USABILIDAD.emergencia.rolesPermitidos;
}
