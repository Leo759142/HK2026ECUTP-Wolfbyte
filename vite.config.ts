import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		}),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Comunidad Local',
				short_name: 'Comunidad',
				description: 'Red comunitaria offline-first para servicios, favores y emergencias por zona.',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait',
				theme_color: '#2563eb',
				background_color: '#ffffff',
				lang: 'es',
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					}
				],
				categories: ['community', 'utilities', 'social']
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,webp}'],
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
			},
			includes: ['**/*.{js,css,html,ico,png,jpg,svg,webp}'],
			exclude: ['**/manifest.webmanifest']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
