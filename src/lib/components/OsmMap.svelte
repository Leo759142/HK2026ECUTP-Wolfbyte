<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import L from 'leaflet';
	import Icono from '../iconos/Icono.svelte';

	type Punto = {
		id: string;
		titulo?: string;
		descripcion?: string;
		tipo?: 'servicio' | 'favor' | 'alerta';
		lat_aprox?: number;
		lng_aprox?: number;
		manzana?: string;
	};

	let {
		puntos = [],
		centro = [-12.0464, -77.0428],
		modoEmergencia = false,
		esGuardian = false
	}: {
		puntos?: Punto[];
		centro?: [number, number];
		modoEmergencia?: boolean;
		esGuardian?: boolean;
	} = $props();

	let container: HTMLDivElement | undefined = $state();
	let userMarker: L.CircleMarker | null = $state(null);
	let offline = $state(false);
	let localizando = $state(false);
	let errorGeo = $state('');

	let map: L.Map | null = null;
	let layer: L.LayerGroup | null = null;
	let precisionCircle: L.Circle | null = null;

	const TIPO_COLOR: Record<string, string> = {
		servicio: '#0E7490',
		favor: '#7b2cbf',
		alerta: '#dc2626'
	};

	function redondear3(n: number): number {
		return Number(n.toFixed(3));
	}

	onMount(() => {
		if (!container) return;

		const m = L.map(container, {
			center: centro,
			zoom: 13,
			zoomControl: true,
			attributionControl: true
		});
		map = m;

	const t = L.tileLayer(
		'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		{
			maxZoom: 19,
			attribution:
				'&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
		}
	);
		t.on('tileerror', () => {
			offline = true;
		});
		t.on('tileload', () => {
			offline = false;
		});
		t.addTo(m);

		layer = L.layerGroup().addTo(m);
		pintarPuntos();

		setTimeout(() => m.invalidateSize(), 120);

		if (navigator.geolocation) {
			localizando = true;
			navigator.geolocation.getCurrentPosition(
				(p) => {
					const lat = redondear3(p.coords.latitude);
					const lng = redondear3(p.coords.longitude);
					m.setView([lat, lng], 14);

					userMarker = L.circleMarker([lat, lng], {
						radius: 8,
						color: '#fff',
						weight: 2,
						fillColor: '#083344',
						fillOpacity: 1
					})
						.addTo(layer!)
						.bindTooltip('Tu zona (aprox.)');

					precisionCircle = L.circle([lat, lng], {
						radius: Math.min(p.coords.accuracy || 100, 500),
						color: '#083344',
						fillColor: '#083344',
						fillOpacity: 0.1,
						weight: 1
					}).addTo(layer!);

					localizando = false;
					errorGeo = '';
				},
				() => {
					localizando = false;
					errorGeo = 'No se pudo obtener tu ubicación aproximada';
				},
				{ enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
			);
		}
	});

	onDestroy(() => {
		map?.remove();
		map = null;
		layer = null;
		userMarker = null;
		precisionCircle = null;
	});

	$effect(() => {
		puntos;
		esGuardian;
		pintarPuntos();
	});

	$effect(() => {
		if (map && centro && !userMarker) {
			map.setView(centro);
		}
	});

	function pintarPuntos() {
		if (!layer || !map) return;
		layer.clearLayers();
		if (userMarker) userMarker.addTo(layer);
		if (precisionCircle) precisionCircle.addTo(layer);

		for (const p of puntos ?? []) {
			if (p.lat_aprox == null || p.lng_aprox == null) continue;
			const color = TIPO_COLOR[p.tipo ?? 'servicio'];
			const esAlerta = p.tipo === 'alerta';
			let mk: L.Layer;

			if (esAlerta && !esGuardian) {
				mk = L.circle([p.lat_aprox, p.lng_aprox], {
					radius: 90,
					color: '#dc2626',
					fillColor: '#dc2626',
					fillOpacity: 0.15,
					weight: 1
				});
				mk.bindTooltip(
					`${p.titulo ?? 'Necesidad'} · Mz. ${p.manzana ?? 'tu sector'} (aprox.)`
				);
			} else {
				mk = L.circleMarker([p.lat_aprox, p.lng_aprox], {
					radius: 7,
					color: '#fff',
					weight: 2,
					fillColor: color,
					fillOpacity: 0.9
				});
				mk.bindTooltip(`${p.titulo ?? p.tipo} · Mz. ${p.manzana ?? 'sector'}`);
			}
			mk.addTo(layer);
		}
	}

	function centrarEnUsuario() {
		if (!map || !userMarker) return;
		map.flyTo(userMarker.getLatLng(), 14);
	}
</script>

<div
	class="relative overflow-hidden rounded-3xl border border-color-linea bg-white"
	aria-label="Mapa comunitario OpenStreetMap"
>
	<div
		bind:this={container}
		class="h-[400px] w-full sm:h-[520px] z-0"
		aria-hidden="true"
	></div>

	{#if localizando}
		<div class="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-[1000]">
			<div class="flex flex-col items-center gap-2">
				<div class="w-6 h-6 border-4 border-petroleo border-t-transparent rounded-full animate-spin"></div>
				<p class="text-xs text-tinta font-semibold">Ubicando tu zona…</p>
			</div>
		</div>
	{/if}

	{#if errorGeo}
		<div class="absolute left-4 right-32 top-4 z-[900] flex items-center gap-2 px-3 py-2 rounded-xl border border-rojo-claro bg-rojo-fondo text-rojo-osc text-xs font-bold shadow-sm">
			<Icono name="alerta" />
			<span>{errorGeo}</span>
		</div>
	{/if}

	{#if userMarker}
		<button
			type="button"
			class="absolute right-4 top-4 z-[900] flex items-center bg-white border border-color-linea rounded-xl px-3 py-2 text-xs font-bold shadow-md hover:bg-color-petroleo-claro transition"
			aria-label="Centrar en mi ubicación"
			onclick={centrarEnUsuario}
		>
			<Icono name="ubicacion" class="mr-2" />
			Mi zona
		</button>
	{/if}

	<div class="absolute left-4 right-4 bottom-4 z-[900] flex flex-col items-start gap-2 pointer-events-none">
		{#if offline}
			<div class="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold shadow-sm pointer-events-auto">
				<Icono name="wifi-slash" />
				<span>Mapa sin mosaicos OSM; pines activos sin conexión</span>
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-1.5">
			<span class="bg-white/90 border border-color-linea rounded-lg px-2 py-1 text-[10px] font-bold text-tinta uppercase tracking-wide">
				OpenStreetMap
			</span>
			{#if modoEmergencia}
				<span class="bg-rojo-claro border border-rojo-claro/50 rounded-lg px-2 py-1 text-[10px] font-bold text-rojo-osc uppercase tracking-wide">
					Modo emergencia
				</span>
			{/if}
		</div>
	</div>
</div>