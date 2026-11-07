/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `cache-${version}`;
const ASSETS = new Set([...build, ...files, '/']);

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

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== location.origin) return;
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(fetch(event.request).catch(() => caches.match(event.request) as Promise<Response>));
		return;
	}
	event.respondWith(
		caches.match(event.request).then((cached) => {
			const network = fetch(event.request)
				.then((res) => {
					if (res.ok) caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
					return res;
				})
				.catch(() => cached ?? caches.match('/') ?? new Response('Offline', { status: 503 }));
			return cached ?? network;
		})
	);
});
