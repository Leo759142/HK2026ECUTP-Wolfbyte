<script lang="ts">
	import { onMount } from 'svelte';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';

	let idioma = $state('es');
	let letraGrande = $state(false);
	let manzana = $state('');
	let mensaje = $state('');
	let manzanas = $state<string[]>([]);

	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	function guardar(key: string, value: unknown) {
		localStorage.setItem(`ayni:v1:${key}`, JSON.stringify(value));
		mensaje = 'Cambios guardados.';
	}
	function settings() {
		return {
			...leer<Record<string, unknown>>('settings', {}),
			lang: idioma,
			largeText: letraGrande
		};
	}
	onMount(() => {
		const actual = leer<{ lang?: string; largeText?: boolean }>('settings', {});
		idioma = actual.lang ?? 'es';
		letraGrande = Boolean(actual.largeText);
		document.documentElement.lang = idioma;
		document.documentElement.classList.toggle('letra-grande', letraGrande);
		const users = leer<Array<{ manzana?: string }>>('users', []);
		manzana = users[0]?.manzana ?? '';
		manzanas = [
			...new Set(
				leer<Array<{ manzanas?: string[] }>>('sectors', []).flatMap((s) => s.manzanas ?? [])
			)
		];
	});
</script>

<Screen>
	<Header title="Ajustes" />
	<h1>Idioma y lectura</h1>
	<p class="muted">Personaliza AYNI para usarlo con comodidad.</p>
	<section class="profile-card">
		<label class="setting-row"
			><span>Idioma</span>
			<select
				bind:value={idioma}
				onchange={() => {
					document.documentElement.lang = idioma;
					guardar('settings', settings());
				}}
			>
				<option value="es">Español</option><option value="en">English</option><option value="qu"
					>Runasimi</option
				>
			</select>
		</label>
		<label class="setting-row"
			><span>Letra grande</span>
			<input
				type="checkbox"
				bind:checked={letraGrande}
				onchange={() => {
					document.documentElement.classList.toggle('letra-grande', letraGrande);
					guardar('settings', settings());
				}}
			/>
		</label>
	</section>
	<section class="profile-card">
		<h2>Mi zona</h2>
		<label class="setting-row"
			><span>Manzana</span>
			<select
				bind:value={manzana}
				onchange={() => {
					const users = leer<Array<Record<string, unknown>>>('users', []);
					guardar(
						'users',
						users.map((u, i) => (i === 0 ? { ...u, manzana } : u))
					);
				}}
			>
				<option value="">Selecciona</option>
				{#each manzanas as item}<option value={item}>Mz. {item}</option>{/each}
			</select>
		</label>
	</section>
	{#if mensaje}<p class="notice notice--ok" role="status">{mensaje}</p>{/if}
</Screen>
