import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(async () => ({
	plugins: [
		await sveltekit({
			adapter: adapter(),
			compilerOptions: {
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			}
		})
	],
	server: { port: 5180, strictPort: true },
	test: {
		expect: { requireAssertions: true },
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts', 'scripts/**/*.test.ts'],
		testTimeout: 30_000,
		hookTimeout: 60_000
	}
}));
