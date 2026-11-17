import type { Idioma } from '../dominio/tipos/tipos';
import { IDIOMAS } from '../dominio/tipos/tipos';

export { IDIOMAS };
export type { Idioma };

export const DICCIONARIO_LOCAL: Record<Idioma, Record<string, string>> = {
	es: {
		'nav.inicio': 'Inicio',
		'nav.favores': 'Favores',
		'nav.mapa': 'Mapa',
		'nav.yo': 'Yo',
		'nav.ahora': 'Ahora',
		'nav.grupos': 'Grupos',
		'nav.publicar': 'Publicar',
		hola: '¡Hola',
		lema: 'Hoy por ti, mañana por mí',
		serviciosDescritos: 'Servicios recomendados por tus vecinos, favores sin dinero y apoyo cuando más se necesita.',
		buscar: '¿Qué necesitas hoy?',
		oficios: 'Oficios del barrio',
		recomendados: 'Los más recomendados',
		crearCuenta: 'Crear cuenta',
		yaTengo: 'Ya tengo cuenta',
		favores: 'Cadena de Favores',
		favoresSub: 'Sin dinero, entre vecinos',
		reportar: '¿Pasa algo grave? Reportar emergencia',
		misPublicaciones: 'Mis publicaciones',
		idioma: 'Idioma y lectura',
		enLinea: 'En línea',
		sinConexion: 'Sin conexión · Ahorrando datos. Ves lo último guardado.',
		'emergencia.titulo': 'TABLERO DE AYUDA HUMANITARIA',
		'emergencia.subtitulo': 'Recursos críticos disponibles en tu manzana',
		'emergencia.alerta_vacio': 'No hay alertas críticas reportadas en este sector.',
		'favor.estado.abierto': 'Abierto',
		'favor.estado.acordado': 'Ayuda en camino',
		'favor.estado.cerrado': 'Cerrado y confirmado',
		'favor.boton.cumplido': 'Confirmar Intercambio ("Se cumplió")',
		'offline.pendiente': 'Pendiente de enviar (Guardado en dispositivo)',
		'offline.enviado': 'Enviada con éxito al vecindario',
		'error.generico': 'Algo salió mal. El mensaje te indicará cómo corregirlo.',
		'error.permiso': 'Tu rol actual no tiene autorización para esta acción.',
		'tutorial.1.titulo': 'Hoy por ti,\nmañana por mí',
		'tutorial.1.texto': 'Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.',
		'tutorial.2.titulo': 'Pide o presta\nsin dinero',
		'tutorial.2.texto':
			'Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.',
		'tutorial.3.titulo': 'En emergencias,\nnos cuidamos',
		'tutorial.3.texto': 'Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda.',
		'access.crear': 'Crear cuenta',
		'access.ingresar': 'Ya tengo cuenta',
		'access.siguiente': 'Siguiente →',
		'access.empezar': 'Empezar',
		'access.continuar': 'Continuar',
		'access.entrar': 'Entrar a AYNI',
		'access.emergencia': 'Hay una emergencia',
		'btn.confirmar': 'Confirmar',
		'btn.cancelar': 'Cancelar',
		'btn.guardar': 'Guardar',
		'btn.editar': 'Editar',
		'btn.eliminar': 'Eliminar',
		'btn.atras': 'Atrás',
		'btn.siguiente': 'Siguiente',
		'btn.verificar': 'Verificar',
		'btn.enviar': 'Enviar',
		'btn.registrar': 'Registrar',
		'btn.entrar': 'Entrar',
		'btn.crearCuenta': 'Crear cuenta',
		'btn.yaTengo': 'Ya tengo cuenta',
		'btn.reportarEmergencia': 'Reportar emergencia',
		'btn.publicar': 'Publicar',
		'btn.verMapa': 'Ver mapa',
		'header.conectado': 'Conectado',
		'header.sinConexion': 'Sin conexión',
		'header.ayuda': 'Ayuda',
		'ayuda.titulo': 'Cómo funciona AYNI sin conexión',
		'ayuda.intro': 'AYNI es offline-first: la app abre y funciona aunque caiga el localhost o no haya señal.',
		'ayuda.puntoShell': 'Carcada de la página: el shell (logo, colores, botones) se guarda en el caché del service worker (cache-v1). Si no hay red, igual carga lo último guardado.',
		'ayuda.puntoDatos': 'Tus datos: publicaciones, favores, contactos y pedidos de ayuda viven en tu celular (localStorage), no solo en la nube. Se ven sin internet.',
		'ayuda.puntoCola': 'Cola de envío: lo que hagas sin señal queda pendiente y se envía solo al volver la conexión.',
		'ayuda.puntoApi': 'Servidor: las peticiones a /api/... intentan la red y, sin señal, usan lo caché o fallan hasta recuperar la señal.',
		'ayuda.probar': 'Prueba: activa modo sin conexión y recarga. La página sigue abriendo.',
		'ayuda.cerrar': 'Cerrar',
		'cache.titulo': 'Cuidado con el caché y los datos',
		'cache.sensibles': 'Mensajes, contactos y pedidos de ayuda quedan en este dispositivo. No uses AYNI en celulares compartidos sin cerrar sesión.',
		'cache.borrar': 'Para borrar todo: usa la opción de reiniciar datos o "Borrar datos del sitio" en tu navegador.',
		'cache.chromium': 'Chromium/Chrome: DevTools > Application > Service Workers > Unregister; Cache Storage > borrar cache-v1.',
		'cache.firefox': 'Firefox: DevTools > Almacenamiento > Service Workers > Desregistrar; Caché > borrar.',
		'cache.error': 'Si algo falla, recarga con Shift + F5 (ignora caché) o desregistra el service worker desde el navegador.',
		// ── i18n de errores · dominio ──
		'error.dominio.permiso_denegado':
			'Tu rol no cuenta con los permisos necesarios para realizar esta acción.',
		'error.dominio.membresia_inactiva':
			'Tu acceso se encuentra pendiente de aprobación o suspendido.',
		'error.dominio.red_desconectada':
			'Acción guardada localmente. Se enviará automáticamente al recuperar la señal.',
		'error.dominio.no_encontrado': '{{entidad}} no existe o no está disponible.',
		'error.dominio.validacion': 'Revisa los datos ingresados.',
		'error.dominio.conflicto': 'La operación entró en conflicto con el estado actual.',
		'error.dominio.favor.titulo_longitud':
			'El título debe tener entre {{min}} y {{max}} caracteres.',
		'error.dominio.favor.descripcion_longitud':
			'La descripción debe tener hasta {{max}} caracteres.',
		'error.dominio.favor.agradecimiento_largo':
			'El agradecimiento no puede exceder {{max}} caracteres.',
		'error.dominio.favor.ayudante_es_creador':
			'El ayudante no puede ser el creador del favor.',
		'error.dominio.favor.coordinar_no_abierto':
			'Solo se pueden coordinar favores abiertos.',
		'error.dominio.favor.cerrar_sin_en_curso':
			'Un favor solo puede cerrarse si está en curso.',
		'error.dominio.favor.cerrar_sin_ayudante':
			'El favor requiere un ayudante para cerrarse.',
		'error.dominio.favor.cancelar_ya_no': 'El favor ya no puede cancelarse.',
		'error.dominio.servicio.titulo_longitud':
			'El título debe tener entre {{min}} y {{max}} caracteres.',
		'error.dominio.servicio.descripcion_longitud':
			'La descripción debe tener hasta {{max}} caracteres.',
		'error.dominio.visto_bueno.comentario_largo':
			'El comentario no puede exceder {{max}} caracteres.',
		'error.dominio.alerta.descripcion_longitud':
			'La descripción debe tener hasta {{max}} caracteres.',
		'error.dominio.recurso.detalle_longitud':
			'El detalle debe tener hasta {{max}} caracteres.',
		'error.dominio.anuncio.titulo_longitud':
			'El título debe tener entre {{min}} y {{max}} caracteres.',
		'error.dominio.anuncio.descripcion_longitud':
			'La descripción debe tener hasta {{max}} caracteres.',
		'error.dominio.anuncio.aprobador_requerido':
			'Un anuncio aprobado requiere aprobador.',
		'error.dominio.grupo.nombre_longitud':
			'El nombre del grupo debe tener entre {{min}} y {{max}} caracteres.',
		'error.dominio.grupo.reglas_largas':
			'Las reglas no pueden exceder {{max}} caracteres.',
		// ── i18n de errores · HTTP ──
		'error.http.400': 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.',
		'error.http.401': 'Necesitas iniciar sesión para continuar.',
		'error.http.403': 'No tienes permiso para ver esta página.',
		'error.http.404': 'La página que buscas no existe o fue movida.',
		'error.http.408': 'La solicitud tardó demasiado. Intenta nuevamente.',
		'error.http.429': 'Hay muchas solicitudes. Espera un momento e inténtalo otra vez.',
		'error.http.500': 'Ocurrió un problema en el servidor.',
		'error.http.503': 'El servicio no está disponible por ahora.',
		'error.http.default': 'Ocurrió un error inesperado.',
		// ── i18n de errores · página de error ──
		'error.pagina.titulo': 'No pudimos mostrar esta página',
		'error.pagina.codigo': 'Código de error {{codigo}}',
		'error.pagina.volver': 'Volver',
		'error.pagina.inicio': 'Ir al inicio',
		'error.pagina.reintentar': 'Reintentar',
		'error.pagina.titulo_documento': 'Error {{status}} | AYNI',
		// ── i18n de errores · outbox / sync ──
		'error.outbox.motivo_default': 'El servidor no aceptó este envío.',
		'error.outbox.conflicto': 'Conflicto',
		'error.outbox.rechazada': 'Rechazada',
		// ── i18n de errores · acceso / registro ──
		'error.acceso.telefono_invalido': 'Escribe un número celular válido de 9 dígitos.',
		'error.acceso.telefono_existe':
			'Ese número ya tiene cuenta. Usa “Ya tengo cuenta” para ingresar.',
		'error.acceso.telefono_no_existe':
			'No encontramos ese número. Toca “Crear cuenta” para registrarte.',
		'error.acceso.codigo_incorrecto': 'Código incorrecto. En demo utiliza 1234.',
		'error.acceso.login_fallo': 'No se pudo iniciar sesión. Intenta nuevamente.',
		'error.acceso.nombre_requerido': 'Escribe tu nombre y apellido para continuar.',
		'error.acceso.ubicacion_requerida': 'Escribe tu dirección o referencia para continuar.',
		'error.acceso.ubicacion_no_detectada':
			'No pudimos detectar tu ubicación. Puedes escribir una referencia.',
		'error.acceso.zona_requerida': 'Elige tu manzana para terminar el registro.',
		'error.acceso.registro_fallo': 'No se pudo terminar el registro. Intenta nuevamente.',
		'error.acceso.direccion_no_consultada': 'No se pudo consultar la dirección.',
		// ── i18n de errores · favores ──
		'error.favor.sin_asignar': 'Este favor todavía no tiene una persona asignada.',
		'error.favor.confirmar_fallo': 'No se pudo confirmar el favor.',
		'error.favor.reservar_fallo': 'No se pudo reservar el favor.',
		'error.favor.cancelar_fallo': 'No se pudo cancelar la publicación.',
		// ── i18n de errores · servicios ──
		'error.servicios.visto_bueno_fallo': 'No se pudo guardar tu Visto Bueno.',
		'error.servicios.recomendacion_fallo': 'No se pudo guardar tu recomendación.',
		// ── i18n de errores · emergencia ──
		'error.emergencia.carga_fallo': 'No se pudieron cargar las alertas.',
		'error.emergencia.confirmar_fallo': 'No se pudo confirmar.',
		'error.emergencia.descartar_fallo': 'No se pudo descartar.',
		'error.emergencia.enviar_reporte_fallo': 'No se pudo enviar el reporte.',
		// ── i18n de errores · mapa ──
		'error.mapa.carga_fallo': 'No se pudo cargar el mapa.',
		// ── i18n de errores · perfil ──
		'error.perfil.foto_fallo': 'No se pudo actualizar la foto.',
		// ── i18n de errores · moderación ──
		'error.moderacion.alertas_carga_fallo': 'No se pudieron cargar las alertas oficiales.',
		'error.moderacion.alerta_actualizar_fallo':
			'No se pudo actualizar la alerta. Verifica tu rol de coordinador.',
		// ── i18n de errores · publicación ──
		'error.publicar.ubicacion_invalida': 'La ubicación aproximada no es válida.',
		'error.publicar.alerta.descripcion_vacia': 'Describe brevemente la necesidad.',
		'error.publicar.alerta.descripcion_larga': 'La descripción puede tener hasta 300 caracteres.',
		'error.publicar.alerta.tipo_invalido': 'Elige un tipo de alerta.',
		'error.publicar.titulo_longitud': 'El título debe tener entre 3 y 80 caracteres.',
		'error.publicar.descripcion_vacia': 'Agrega una descripción corta.',
		'error.publicar.descripcion_larga': 'La descripción puede tener hasta 500 caracteres.',
		'error.publicar.favor.tipo_invalido': 'Elige el tipo de favor.',
		'error.publicar.servicio.categoria_invalida': 'Elige una categoría.',
		'error.publicar.guardar_fallo': 'No se pudo guardar. Intenta de nuevo.',
		// ── i18n de errores · fotos ──
		'error.foto.limite_uno': 'Solo puedes agregar 1 imagen.',
		'error.foto.limite': 'Puedes agregar como máximo {{max}} imágenes.',
		'error.foto.carga_fallo': 'No se pudo cargar la imagen.'
	},
	en: {
		'nav.inicio': 'Home',
		'nav.favores': 'Favors',
		'nav.mapa': 'Map',
		'nav.yo': 'Me',
		'nav.ahora': 'Now',
		'nav.grupos': 'Groups',
		'nav.publicar': 'Post',
		hola: 'Hi',
		lema: 'Today for you, tomorrow for me',
		serviciosDescritos: 'Services recommended by your neighbors, favors without money and support when it is most needed.',
		buscar: 'What do you need today?',
		oficios: 'Neighborhood trades',
		recomendados: 'Most recommended',
		crearCuenta: 'Create account',
		yaTengo: 'I already have an account',
		favores: 'Chain of Favors',
		favoresSub: 'No money, between neighbors',
		reportar: 'Something serious? Report an emergency',
		misPublicaciones: 'My posts',
		idioma: 'Language & reading',
		enLinea: 'Online',
		sinConexion: 'Offline · Saving data. You are seeing the last saved info.',
		'emergencia.titulo': 'HUMANITARIAN AID BOARD',
		'emergencia.subtitulo': 'Critical resources available in your block',
		'emergencia.alerta_vacio': 'No critical alerts reported in this sector.',
		'favor.estado.abierto': 'Open',
		'favor.estado.acordado': 'Help on the way',
		'favor.estado.cerrado': 'Closed and confirmed',
		'favor.boton.cumplido': 'Confirm Exchange ("Completed")',
		'offline.pendiente': 'Pending to send (Saved on device)',
		'offline.enviado': 'Successfully sent to the neighborhood',
		'error.generico': 'Something went wrong. The message will tell you how to fix it.',
		'error.permiso': 'Your current role is not authorized for this action.',
		'tutorial.1.titulo': 'Today for you,\ntomorrow for me',
		'tutorial.1.texto': 'Find tradespeople, teachers and more, recommended by your neighbors.',
		'tutorial.2.titulo': 'Ask or lend\nwithout money',
		'tutorial.2.texto': 'Lend your ladder, give away what you have or exchange what you know.',
		'tutorial.3.titulo': 'In emergencies,\nwe care for each other',
		'tutorial.3.texto': 'When something serious happens, AYNI coordinates community help.',
		'access.crear': 'Create account',
		'access.ingresar': 'I already have an account',
		'access.siguiente': 'Next →',
		'access.empezar': 'Start',
		'access.continuar': 'Continue',
		'access.entrar': 'Enter AYNI',
		'access.emergencia': 'There is an emergency',
		'btn.confirmar': 'Confirm',
		'btn.cancelar': 'Cancel',
		'btn.guardar': 'Save',
		'btn.editar': 'Edit',
		'btn.eliminar': 'Delete',
		'btn.atras': 'Back',
		'btn.siguiente': 'Next',
		'btn.verificar': 'Verify',
		'btn.enviar': 'Send',
		'btn.registrar': 'Register',
		'btn.entrar': 'Enter',
		'btn.crearCuenta': 'Create account',
		'btn.yaTengo': 'I already have an account',
		'btn.reportarEmergencia': 'Report emergency',
		'btn.publicar': 'Post',
		'btn.verMapa': 'View map',
		'header.conectado': 'Online',
		'header.sinConexion': 'Offline',
		'header.ayuda': 'Help',
		'ayuda.titulo': 'How AYNI works offline',
		'ayuda.intro': 'AYNI is offline-first: the app opens and works even if localhost goes down or there is no signal.',
		'ayuda.puntoShell': 'Page shell: the shell (logo, colors, buttons) is cached by the service worker (cache-v1). Without network it still loads the last saved version.',
		'ayuda.puntoDatos': 'Your data: publications, favors, contacts and help requests live on your phone (localStorage), not only in the cloud. They are visible without internet.',
		'ayuda.puntoCola': 'Send queue: what you do without signal stays pending and sends alone when the connection returns.',
		'ayuda.puntoApi': 'Server: requests to /api/... try the network and, without signal, use cache or fail until you recover signal.',
		'ayuda.probar': 'Test: activate offline mode and reload. The page still opens.',
		'ayuda.cerrar': 'Close',
		'cache.titulo': 'Care with cache and data',
		'cache.sensibles': 'Messages, contacts and help requests stay on this device. Do not use AYNI on shared phones without signing out.',
		'cache.borrar': 'To clear everything: use the reset data option or "Clear site data" in your browser.',
		'cache.chromium': 'Chromium/Chrome: DevTools > Application > Service Workers > Unregister; Cache Storage > delete cache-v1.',
		'cache.firefox': 'Firefox: DevTools > Storage > Service Workers > Unregister; Cache > clear.',
		'cache.error': 'If something fails, reload with Shift + F5 (ignore cache) or unregister the service worker from the browser.',
		// ── error i18n · domain ──
		'error.dominio.permiso_denegado':
			'Your role does not have the permissions needed to perform this action.',
		'error.dominio.membresia_inactiva': 'Your access is pending approval or suspended.',
		'error.dominio.red_desconectada':
			'Action saved locally. It will be sent automatically when the signal returns.',
		'error.dominio.no_encontrado': '{{entidad}} does not exist or is not available.',
		'error.dominio.validacion': 'Check the entered data.',
		'error.dominio.conflicto': 'The operation conflicts with the current state.',
		'error.dominio.favor.titulo_longitud':
			'The title must have between {{min}} and {{max}} characters.',
		'error.dominio.favor.descripcion_longitud':
			'The description can have up to {{max}} characters.',
		'error.dominio.favor.agradecimiento_largo':
			'The acknowledgment cannot exceed {{max}} characters.',
		'error.dominio.favor.ayudante_es_creador': 'The helper cannot be the favor creator.',
		'error.dominio.favor.coordinar_no_abierto': 'Only open favors can be coordinated.',
		'error.dominio.favor.cerrar_sin_en_curso':
			'A favor can only be closed if it is in progress.',
		'error.dominio.favor.cerrar_sin_ayudante': 'The favor requires a helper to be closed.',
		'error.dominio.favor.cancelar_ya_no': 'The favor can no longer be canceled.',
		'error.dominio.servicio.titulo_longitud':
			'The title must have between {{min}} and {{max}} characters.',
		'error.dominio.servicio.descripcion_longitud':
			'The description can have up to {{max}} characters.',
		'error.dominio.visto_bueno.comentario_largo':
			'The comment cannot exceed {{max}} characters.',
		'error.dominio.alerta.descripcion_longitud':
			'The description can have up to {{max}} characters.',
		'error.dominio.recurso.detalle_longitud':
			'The detail can have up to {{max}} characters.',
		'error.dominio.anuncio.titulo_longitud':
			'The title must have between {{min}} and {{max}} characters.',
		'error.dominio.anuncio.descripcion_longitud':
			'The description can have up to {{max}} characters.',
		'error.dominio.anuncio.aprobador_requerido': 'An approved ad requires an approver.',
		'error.dominio.grupo.nombre_longitud':
			'The group name must have between {{min}} and {{max}} characters.',
		'error.dominio.grupo.reglas_largas': 'The rules cannot exceed {{max}} characters.',
		// ── error i18n · HTTP ──
		'error.http.400': 'The request is not valid. Check the data and try again.',
		'error.http.401': 'You need to sign in to continue.',
		'error.http.403': 'You do not have permission to view this page.',
		'error.http.404': 'The page you are looking for does not exist or was moved.',
		'error.http.408': 'The request took too long. Please try again.',
		'error.http.429': 'Too many requests. Wait a moment and try again.',
		'error.http.500': 'A server problem occurred.',
		'error.http.503': 'The service is not available right now.',
		'error.http.default': 'An unexpected error occurred.',
		// ── error i18n · error page ──
		'error.pagina.titulo': 'We could not display this page',
		'error.pagina.codigo': 'Error code {{codigo}}',
		'error.pagina.volver': 'Go back',
		'error.pagina.inicio': 'Go to home',
		'error.pagina.reintentar': 'Try again',
		'error.pagina.titulo_documento': 'Error {{status}} | AYNI',
		// ── error i18n · outbox / sync ──
		'error.outbox.motivo_default': 'The server did not accept this submission.',
		'error.outbox.conflicto': 'Conflict',
		'error.outbox.rechazada': 'Rejected',
		// ── error i18n · access / registration ──
		'error.acceso.telefono_invalido': 'Enter a valid 9-digit cell phone number.',
		'error.acceso.telefono_existe':
			'That number already has an account. Use "I already have an account" to sign in.',
		'error.acceso.telefono_no_existe':
			'We could not find that number. Tap "Create account" to register.',
		'error.acceso.codigo_incorrecto': 'Incorrect code. In demo mode use 1234.',
		'error.acceso.login_fallo': 'Could not sign in. Please try again.',
		'error.acceso.nombre_requerido': 'Enter your first and last name to continue.',
		'error.acceso.ubicacion_requerida': 'Enter your address or a reference to continue.',
		'error.acceso.ubicacion_no_detectada':
			'We could not detect your location. You can enter a reference.',
		'error.acceso.zona_requerida': 'Choose your block to finish registration.',
		'error.acceso.registro_fallo': 'Could not finish registration. Please try again.',
		'error.acceso.direccion_no_consultada': 'Could not look up the address.',
		// ── error i18n · favors ──
		'error.favor.sin_asignar': 'This favor does not have an assigned person yet.',
		'error.favor.confirmar_fallo': 'Could not confirm the favor.',
		'error.favor.reservar_fallo': 'Could not reserve the favor.',
		'error.favor.cancelar_fallo': 'Could not cancel the publication.',
		// ── error i18n · services ──
		'error.servicios.visto_bueno_fallo': 'Could not save your approval.',
		'error.servicios.recomendacion_fallo': 'Could not save your recommendation.',
		// ── error i18n · emergency ──
		'error.emergencia.carga_fallo': 'Could not load the alerts.',
		'error.emergencia.confirmar_fallo': 'Could not confirm.',
		'error.emergencia.descartar_fallo': 'Could not dismiss.',
		'error.emergencia.enviar_reporte_fallo': 'Could not send the report.',
		// ── error i18n · map ──
		'error.mapa.carga_fallo': 'Could not load the map.',
		// ── error i18n · profile ──
		'error.perfil.foto_fallo': 'Could not update the photo.',
		// ── error i18n · moderation ──
		'error.moderacion.alertas_carga_fallo': 'Could not load the official alerts.',
		'error.moderacion.alerta_actualizar_fallo':
			'Could not update the alert. Check your coordinator role.',
		// ── error i18n · publishing ──
		'error.publicar.ubicacion_invalida': 'The approximate location is not valid.',
		'error.publicar.alerta.descripcion_vacia': 'Briefly describe the need.',
		'error.publicar.alerta.descripcion_larga': 'The description can have up to 300 characters.',
		'error.publicar.alerta.tipo_invalido': 'Choose an alert type.',
		'error.publicar.titulo_longitud': 'The title must have between 3 and 80 characters.',
		'error.publicar.descripcion_vacia': 'Add a short description.',
		'error.publicar.descripcion_larga': 'The description can have up to 500 characters.',
		'error.publicar.favor.tipo_invalido': 'Choose the favor type.',
		'error.publicar.servicio.categoria_invalida': 'Choose a category.',
		'error.publicar.guardar_fallo': 'Could not save. Try again.',
		// ── error i18n · photos ──
		'error.foto.limite_uno': 'You can only add 1 image.',
		'error.foto.limite': 'You can add at most {{max}} images.',
		'error.foto.carga_fallo': 'Could not load the image.'
	},
	qu: {
		'nav.inicio': 'Wasi',
		'nav.favores': 'Aynikuna',
		'nav.mapa': 'Saywit`i',
		'nav.yo': 'Ñuqa',
		'nav.ahora': 'Kunan',
		'nav.grupos': 'Grupo/ayllukuna',
		'nav.publicar': 'Postay',
		hola: 'Hay, allinllachu?',
		lema: 'Kunanqa qampaq, qhipapas ñuqapaq',
		serviciosDescritos: 'Serviciokunata recomendasqa vecinoykipura, mana qullqiyuqta aynikunam, chaymi aswan much`uypacha kachkan.',
		buscar: 'Imam kaypi munanki?',
		oficios: 'Vecinomasip yankinakunanku',
		recomendados: 'Astawan recomendasqa',
		crearCuenta: 'Cuenta ruray',
		yaTengo: 'Ña cuentayuqmi kani',
		favores: 'Aynikunap tink`iynin',
		favoresSub: 'Mana qullqiñiq, yankinanchik',
		reportar: 'Sasam ima kuskaykipichu? Reportasunchik',
		misPublicaciones: 'Postaykuna',
		idioma: 'Simi ñawiriypas',
		enLinea: 'Lineapim',
		sinConexion: 'Mana lineapim · Datata waqaychachkanwa. Ñawpaq infokunata qhawasunkim.',
		'emergencia.titulo': 'MUSYANA (EMERGENCIA)',
		'emergencia.subtitulo': 'Suministrokunata chay manzanapi kachkan',
		'emergencia.alerta_vacio': 'Manam kanchu alerts kay pacha.',
		'favor.estado.abierto': 'Kichasqa',
		'favor.estado.acordado': 'Yanapanapaq',
		'favor.estado.cerrado': 'Wichqasqa',
		'favor.boton.cumplido': 'Llamk`asqa (Wichqasqa)',
		'offline.pendiente': 'Ñawpaqta ruwanapaq',
		'offline.enviado': 'Enviasqa',
		'error.generico': 'Pantay kachkan',
		'error.permiso': 'Permisota manam kankichu.',
		'tutorial.1.titulo': 'Kunan qanpaq,\npaqarin ñuqapaq',
		'tutorial.1.texto': 'Llaqtamasiykikunam qhawachisqankuna llamkayninkunata tariy.',
		'tutorial.2.titulo': 'Mańakuy utaq quykuy\nqullqillan',
		'tutorial.2.texto': 'Yachaykikunata rantinakuy utaq yanapay.',
		'tutorial.3.titulo': 'Sasachakuypi,\nukhunchik qhawakusun',
		'tutorial.3.texto': 'Hatun sasachakuy kaptin AYNI yanapakuyninta kamachin.',
		'access.crear': 'Cuenta ruray',
		'access.ingresar': 'Cuentayuq kani',
		'access.siguiente': 'Qhipa →',
		'access.empezar': 'Qallariy',
		'access.continuar': 'Qatiy',
		'access.entrar': 'AYNI-man yaykuy',
		'access.emergencia': 'Huk emergencia kachkan',
		'btn.confirmar': 'Llamkkasqa',
		'btn.cancelar': 'Manachay',
		'btn.guardar': 'Waqaychay',
		'btn.editar': 'Utichiy',
		'btn.eliminar': 'Wikchuy',
		'btn.atras': 'Ñawpaq',
		'btn.siguiente': 'Qhipa',
		'btn.verificar': 'Allichiy',
		'btn.enviar': 'Enviay',
		'btn.registrar': 'Registray',
		'btn.entrar': 'Yaykuy',
		'btn.crearCuenta': 'Cuenta ruway',
		'btn.yaTengo': 'Cuentaniyuq kani',
		'btn.reportarEmergencia': 'Musyana reportay',
		'btn.publicar': 'Publicay',
		'btn.verMapa': 'Saywit`ita qhawachiy',
		'header.conectado': 'Lineapim',
		'header.sinConexion': 'Mana lineapim',
		'header.ayuda': 'Yanapay',
		'ayuda.titulo': 'Cómo funciona AYNI sin conexión',
		'ayuda.intro': 'AYNI es offline-first: la app abre y funciona aunque no haya señal.',
		'ayuda.puntoShell': 'El shell se guarda en caché del service worker (cache-v1). Sin red, carga lo último guardado.',
		'ayuda.puntoDatos': 'Tus datos viven en tu celular (localStorage). Se ven sin internet.',
		'ayuda.puntoCola': 'Lo que hagas sin señal queda pendiente y se envía al volver.',
		'ayuda.puntoApi': 'Las peticiones a /api/... no se cachean; sin red fallan.',
		'ayuda.probar': 'Activa modo sin conexión y recarga. La página sigue abriendo.',
		'ayuda.cerrar': 'Cerrar',
		'cache.titulo': 'Cuidado con el caché y los datos',
		'cache.sensibles': 'Mensajes, contactos y pedidos quedan en este dispositivo. No uses celulares compartidos sin cerrar sesión.',
		'cache.borrar': 'Para borrar todo: reinicia datos o borra datos del sitio en el navegador.',
		'cache.chromium': 'Chromium/Chrome: DevTools > Application > Service Workers > Unregister; Cache Storage > borrar cache-v1.',
		'cache.firefox': 'Firefox: DevTools > Almacenamiento > Service Workers > Desregistrar; Caché > borrar.',
		'cache.error': 'Si falla, recarga con Shift + F5 o desregistra el service worker.',
		// ── i18n de errores · dominio ──
		'error.dominio.permiso_denegado': 'Qampa sawiykuna manam kay ruwayta atinichu.',
		'error.dominio.membresia_inactiva':
			'Qampa yaykuykuna aprobacionta suhlt\'aytaq utaq saytasqa kachkan.',
		'error.dominio.red_desconectada':
			'Ruwayqa localman waqaychisqa. Señal kutimuptin apachikunqa.',
		'error.dominio.no_encontrado': '{{entidad}} manam kanchu utaq mana atinchikchu.',
		'error.dominio.validacion': 'Yaykuchasqa datata qhaway.',
		'error.dominio.conflicto': 'Ruwayqa kunan pachapi t\'uqsikun.',
		'error.dominio.favor.titulo_longitud':
			'Sutikuna {{min}}nintin {{max}}nintin chawpipin kanan.',
		'error.dominio.favor.descripcion_longitud':
			'Willaykuna {{max}}nintin chawpipin kanan.',
		'error.dominio.favor.agradecimiento_largo':
			'Agradecimientoqa {{max}}nintin aswan kanmanchu.',
		'error.dominio.favor.ayudante_es_creador':
			'Yanapanapaq runa mana ayniq ruwaqchu kanman.',
		'error.dominio.favor.coordinar_no_abierto':
			'Sólo kichasqa aynikunata coordinakunman.',
		'error.dominio.favor.cerrar_sin_en_curso':
			'Aynita sólo llamk\'achkaptin wichq\'ikunman.',
		'error.dominio.favor.cerrar_sin_ayudante':
			'Aynita yanapanapaq kanan wichq\'inapaq.',
		'error.dominio.favor.cancelar_ya_no': 'Aynita mana atinchikchu cancelayta.',
		'error.dominio.servicio.titulo_longitud':
			'Sutikuna {{min}}nintin {{max}}nintin chawpipin kanan.',
		'error.dominio.servicio.descripcion_longitud':
			'Willaykuna {{max}}nintin chawpipin kanan.',
		'error.dominio.visto_bueno.comentario_largo':
			'Willayqa {{max}}nintin aswan kanmanchu.',
		'error.dominio.alerta.descripcion_longitud':
			'Willaykuna {{max}}nintin chawpipin kanan.',
		'error.dominio.recurso.detalle_longitud':
			'Detalleqa {{max}}nintin chawpipin kanan.',
		'error.dominio.anuncio.titulo_longitud':
			'Sutikuna {{min}}nintin {{max}}nintin chawpipin kanan.',
		'error.dominio.anuncio.descripcion_longitud':
			'Willaykuna {{max}}nintin chawpipin kanan.',
		'error.dominio.anuncio.aprobador_requerido':
			'Aprobado anuncioqa aprobadorniyuq kanan.',
		'error.dominio.grupo.nombre_longitud':
			'Grupon sutin {{min}}nintin {{max}}nintin chawpipin kanan.',
		'error.dominio.grupo.reglas_largas': 'Reglakunaqa {{max}}nintin aswan kanmanchu.',
		// ── i18n de errores · HTTP ──
		'error.http.400': 'Mañakuyqa manam allinchu. Datata qhawaytaq musuqmanta yanapaytaq.',
		'error.http.401': 'Yaykunaykipuni kanan qhawaytaq.',
		'error.http.403': 'Kay pankata qhawayta manam permisoqtiyuqchu.',
		'error.http.404': 'Maskasqa pankacha manam kanchu utaq muskisqa.',
		'error.http.408': 'Mañakuyqa aswan unayta qusan. Musuqmanta yanapaytaq.',
		'error.http.429': 'Aswan mañakuykuna kachkan. Suqta suhlt\'aytaq musuqmanta yanapaytaq.',
		'error.http.500': 'Servidorpi pantay t\'uqsikun.',
		'error.http.503': 'Servicioqa kunanqa manam kanchu.',
		'error.http.default': 'Mana suhaq pantay t\'uqsikun.',
		// ── i18n de errores · página de error ──
		'error.pagina.titulo': 'Kay pankata mana qhawachiyta atinkichu',
		'error.pagina.codigo': 'Pantay yupay {{codigo}}',
		'error.pagina.volver': 'Kutimuy',
		'error.pagina.inicio': 'Wasi-man ripuy',
		'error.pagina.reintentar': 'Musuqmanta yanapay',
		'error.pagina.titulo_documento': 'Pantay {{status}} | AYNI',
		// ── i18n de errores · outbox / sync ──
		'error.outbox.motivo_default': 'Servidorqa kay apachisqata mana acepachkanichu.',
		'error.outbox.conflicto': 'T\'uqu',
		'error.outbox.rechazada': 'Rechazado',
		// ── i18n de errores · acceso / registro ──
		'error.acceso.telefono_invalido': 'Allin 9 yupniyuq celularniyuqta yaykuchay.',
		'error.acceso.telefono_existe':
			'Kay yupuqa cuentayuqña. "Cuentayuq kani"wan yaykuy.',
		'error.acceso.telefono_no_existe':
			'Kay yuputa mana tarinkichu. "Cuenta ruway"wan registray.',
		'error.acceso.codigo_incorrecto': 'Pantay codigo. Demoypi 1234wan yanapay.',
		'error.acceso.login_fallo': 'Manam yaykuyta atinkichu. Musuqmanta yanapay.',
		'error.acceso.nombre_requerido': 'Sutiykiwan apellidoykita yaykuchay qatiytaq.',
		'error.acceso.ubicacion_requerida':
			'Direccionniyuqta utaq referencianiyuqta yaykuchay qatiytaq.',
		'error.acceso.ubicacion_no_detectada':
			'Manam ubicacionniyukita tarinkechu. Referencianniyuqta yaykuchayta atinkich.',
		'error.acceso.zona_requerida': 'Manzanaykita akllay registruta tukachiytaq.',
		'error.acceso.registro_fallo':
			'Manam registruta tukachiyta atinkichu. Musuqmanta yanapay.',
		'error.acceso.direccion_no_consultada': 'Manam direccionta consultayta atinkichu.',
		// ── i18n de errores · favores ──
		'error.favor.sin_asignar': 'Aynaqa manaraq runa asignadoyuqchu.',
		'error.favor.confirmar_fallo': 'Manam aynita confirmayta atinkichu.',
		'error.favor.reservar_fallo': 'Manam aynita reservayta atinkichu.',
		'error.favor.cancelar_fallo': 'Manam publicacionta cancelayta atinkichu.',
		// ── i18n de errores · servicios ──
		'error.servicios.visto_bueno_fallo':
			'Manam Visto Buenoykita waqaychiyta atinkichu.',
		'error.servicios.recomendacion_fallo':
			'Manam recomiendacionniyukita waqaychiyta atinkichu.',
		// ── i18n de errores · emergencia ──
		'error.emergencia.carga_fallo': 'Manam alertakunata cargayta atinkichu.',
		'error.emergencia.confirmar_fallo': 'Manam confirmayta atinkichu.',
		'error.emergencia.descartar_fallo': 'Manam descartayta atinkichu.',
		'error.emergencia.enviar_reporte_fallo': 'Manam reporteta apachiyta atinkichu.',
		// ── i18n de errores · mapa ──
		'error.mapa.carga_fallo': 'Manam saywit\'ita cargayta atinkichu.',
		// ── i18n de errores · perfil ──
		'error.perfil.foto_fallo': 'Manam fotota actualizayta atinkichu.',
		// ── i18n de errores · moderación ──
		'error.moderacion.alertas_carga_fallo':
			'Manam oficial alertakunata cargayta atinkichu.',
		'error.moderacion.alerta_actualizar_fallo':
			'Manam alertata actualizayta atinkichu. Coordinador sawiykita qhaway.',
		// ── i18n de errores · publicación ──
		'error.publicar.ubicacion_invalida': 'Aproximado ubicacionqa manam allinchu.',
		'error.publicar.alerta.descripcion_vacia': 'Aswanpis willayta qhawachiy.',
		'error.publicar.alerta.descripcion_larga': 'Willayqa 300nintin chawpipin kanan.',
		'error.publicar.alerta.tipo_invalido': 'Alerta tipota akllay.',
		'error.publicar.titulo_longitud': 'Sutikuna 3nintin 80nintin chawpipin kanan.',
		'error.publicar.descripcion_vacia': 'Suki willayta yapay.',
		'error.publicar.descripcion_larga': 'Willayqa 500nintin chawpipin kanan.',
		'error.publicar.favor.tipo_invalido': 'Favor tipota akllay.',
		'error.publicar.servicio.categoria_invalida': 'Categoriata akllay.',
		'error.publicar.guardar_fallo': 'Manam waqaychiyta atinkichu. Musuqmanta yanapay.',
		// ── i18n de errores · fotos ──
		'error.foto.limite_uno': 'Sólo 1 imagenman yapayta atinkich.',
		'error.foto.limite': 'Aswanpi {{max}} imagenman yapayta atinkich.',
		'error.foto.carga_fallo': 'Manam imagenta cargayta atinkichu.'
	}
};

export function translate(lang: Idioma, key: string): string {
	return DICCIONARIO_LOCAL[lang]?.[key] ?? DICCIONARIO_LOCAL.es[key] ?? key;
}

// Gestor reactivo (Svelte 5 runes) — fuente única de verdad.
// Re-exporta el singleton reactivo `gestorIdiomas`, `traducir` y los helpers/metadatos.
export {
	gestorIdiomas,
	traducir,
	GestorIdiomasMejorado,
	resolverIdiomaActual,
	obtenerIdiomaDesdeURL,
	normalizarIdioma,
	obtenerCodigoISO,
	obtenerCodigoGlottolog,
	obtenerNombreIdioma,
	IDIOMAS_DISPONIBLES,
	CODIGOS_ISO_639_3
} from './gestor.svelte';

export type { CodigoIdioma } from './codigos';

// ── i18n de los sistemas de error (catálogo único y escalable) ──────────────
export {
	CODIGOS_ERROR,
	traducirError,
	mensajeErrorDominio,
	mensajeHttp,
	ErrorDeDominio
} from './errores';

export type { CodigoError, VariablesError, OpcionesError } from './errores';
