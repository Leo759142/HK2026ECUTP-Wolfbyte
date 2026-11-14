
import error from './shared/error-template.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_trusted_origins: [],
	service_worker_options: undefined,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"es\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\" />\n\t\t<meta name=\"theme-color\" content=\"#0F4C5C\" />\n\t\t<meta name=\"description\" content=\"AYNI · Hoy por ti, mañana por mí. Servicios recomendados por tus vecinos, favores sin dinero y apoyo en emergencias.\" />\n\t\t<link rel=\"icon\" type=\"image/png\" href=\"/icon-192.png\" />\n\t\t<link rel=\"apple-touch-icon\" href=\"/icon-192.png\" />\n\t\t<link rel=\"manifest\" href=\"/manifest.webmanifest\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap\" rel=\"stylesheet\" />\n\t\t<title>AYNI</title>\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div style=\"display: contents\">" + body + "</div>\n\t</body>\n</html>\n",
		error
	}
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		init,
		reroute,
		transport
	};
}
