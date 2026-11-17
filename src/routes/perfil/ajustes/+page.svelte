<script lang="ts">
	import { onMount } from 'svelte';
	import Screen from '../../../lib/ui/Screen.svelte';
	import Header from '../../../lib/ui/Header.svelte';
	import { reiniciarOnboarding, obtenerSesionLocal } from '../../../lib/onboarding';
	import { gestorIdiomas } from '../../../i18n';

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
			lang: gestorIdiomas.idiomaActual,
			largeText: letraGrande
		};
	}
	async function repetirTutorial() {
		await reiniciarOnboarding();
		mensaje = 'Tutorial reiniciado. Se mostrará la próxima vez que abras el acceso.';
	}
	onMount(() => {
		const actual = leer<{ largeText?: boolean }>('settings', {});
		letraGrande = Boolean(actual.largeText);
		document.documentElement.classList.toggle('letra-grande', letraGrande);
		const users = leer<Array<{ manzana?: string }>>('users', []);
		const sesion = obtenerSesionLocal();
		const user = sesion?.usuarioId
			? users.find((item) => item.id === sesion.usuarioId)
			: undefined;
		manzana = user?.manzana ?? '';
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
				value={gestorIdiomas.idiomaActual}
				onchange={(e) => {
					gestorIdiomas.cambiarIdioma(e.currentTarget.value);
					guardar('settings', settings());
				}}
			>
				<option value="es">Español</option><option value="en">English</option><option value="qu"
					>Quechua</option
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
	<section class="profile-card">
		<h2>Ayuda</h2>
		<p class="muted">Vuelve a ver la guía inicial de AYNI cuando la necesites.</p>
		<button class="mobile-btn mobile-btn--outline" type="button" onclick={repetirTutorial}>
			Repetir tutorial
		</button>
	</section>
	{#if mensaje}<p class="notice notice--ok" role="status">{mensaje}</p>{/if}
</Screen>
