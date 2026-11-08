/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// SvelteKit 3: `$service-worker` se eliminó; ahora se usan `$app/manifest`, `$app/env` y `$app/service-worker`.
import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { self as sw } from '$app/service-worker';

const CACHE = `cache-${version}`;

// Las rutas del manifest son relativas a la base de la app; se resuelven contra el scope del service worker.
const aUrl = (path: string) => new URL(path.replace(/^\//, ''), sw.registration.scope).pathname;
const ASSETS = new Set([...immutable, ...assets, ...prerendered].map((f) => aUrl(f.path)).concat(aUrl('/')));

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll([...ASSETS])));
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
	);
	sw.clients.claim();
});

const offline = () => new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== location.origin) return;
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(event.request).catch(async () => (await caches.match(event.request)) ?? offline())
		);
		return;
	}
	event.respondWith(
		caches.match(event.request).then((cached) => {
			const network = fetch(event.request)
				.then((res) => {
					if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
					return res;
				})
				.catch(async () => cached ?? (await caches.match(aUrl('/'))) ?? offline());
			return cached ?? network;
		})
	);
});
