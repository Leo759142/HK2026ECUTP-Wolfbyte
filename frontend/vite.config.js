import { defineConfig, loadEnv } from 'vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	// En desarrollo el navegador solo habla con Vite (mismo origen).
	// Las APIs se llaman directamente al mismo origen (no hay proxy en desarrollo).
	const proxy = {};
	return {
		plugins: [
			await sveltekit({
				// SPA: todo el contenido se genera en el navegador (offline-first con localStorage).
				adapter: adapter({ fallback: 'index.html' }),
				alias: {
					'$lib': 'src/lib'
				}
			})
		],
		server: { port: 5173, strictPort: true, proxy },
		preview: { port: 4173, strictPort: true, proxy }
	};
});
