import { defineConfig, loadEnv } from 'vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	// En desarrollo el navegador solo habla con Vite (mismo origen) y Vite reenvía /api al backend:
	// la cookie de sesión queda en el mismo origen y no hace falta CORS.
	const proxy = { '/api': { target: env.AYNI_BACKEND_URL || 'http://localhost:5180', changeOrigin: true } };
	return {
		plugins: [
			await sveltekit({
				// SPA: todo el contenido se genera en el navegador (offline-first con localStorage).
				adapter: adapter({ fallback: 'index.html' })
			})
		],
		server: { port: 5173, strictPort: true, proxy },
		preview: { port: 4173, strictPort: true, proxy }
	};
});
