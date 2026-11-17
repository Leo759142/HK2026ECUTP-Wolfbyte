<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Icono from '../../lib/iconos/Icono.svelte';
	import {
		guardarSesionLocal,
		marcarOnboardingVisto,
		obtenerSesionLocal,
		onboardingVisto
	} from '../../lib/onboarding';
	import { translate, type Idioma } from '../../i18n';
	import Btn from '../../lib/ui/Btn.svelte';
	import Header from '../../lib/ui/Header.svelte';
	import Input from '../../lib/ui/Input.svelte';
	import StepNav from '../../lib/ui/StepNav.svelte';

	type Paso = 'portada' | 'tutorial' | 'telefono' | 'codigo' | 'nombre' | 'ubicacion' | 'zona';
	type Modo = 'registro' | 'login';
	let paso = $state<Paso>('portada');
	let modo = $state<Modo>('registro');
	let tutorial = $state(0);
	let telefono = $state('');
	let codigo = $state('');
	let alias = $state('');
	let apellido = $state('');
	let ubicacion = $state('');
	let manzana = $state('');
	let obteniendoUbicacion = $state(false);
	let error = $state('');
	let onboardingCompletado = $state(false);
	let idioma = $state<Idioma>('es');

	// Leer idioma desde parámetro URL ?lang=
	function idiomaDesdeURL(): Idioma | null {
		if (typeof window === 'undefined' || !window.location) return null;
		const params = new URLSearchParams(window.location.search);
		const lang = params.get('lang');
		if (lang && ['es', 'en', 'qu'].includes(lang)) return lang as Idioma;
		return null;
	}

	// Cambiar idioma y actualizar URL
	function cambiarIdioma(nuevo: Idioma): void {
		idioma = nuevo;
		if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
			const url = new URL(window.location.href);
			url.searchParams.set('lang', nuevo);
			window.history.replaceState({}, '', url.toString());
		}
	}

	const t = (key: string) => translate(idioma, key);

	// Inicializar idioma desde URL al montar
	onMount(() => {
		const langUrl = idiomaDesdeURL();
		if (langUrl) idioma = langUrl;
	});

	const PASOS_REGISTRO: Paso[] = ['telefono', 'codigo', 'nombre', 'ubicacion', 'zona'];
	const totalPasos = $derived(modo === 'registro' ? PASOS_REGISTRO.length : 2);
	const pasoActual = $derived(
		modo === 'registro' ? PASOS_REGISTRO.indexOf(paso) + 1 : paso === 'telefono' ? 1 : 2
	);
	const tituloPaso = $derived(`Paso ${pasoActual} de ${totalPasos}`);

	let tutoriales = $derived([
		{
			icon: 'ayuda',
			titulo: t('tutorial.1.titulo'),
			texto: t('tutorial.1.texto'),
			color: 'access-step--petroleo'
		},
		{
			icon: 'trueque',
			titulo: t('tutorial.2.titulo'),
			texto: t('tutorial.2.texto'),
			color: 'access-step--petroleo'
		},
		{
			icon: 'guardian',
			titulo: t('tutorial.3.titulo'),
			texto: t('tutorial.3.texto'),
			color: 'access-step--rojo'
		}
	]);

	function siguienteTutorial() {
		if (tutorial < tutoriales.length - 1) tutorial += 1;
		else paso = 'telefono';
	}

	function retroceder() {
		if (paso === 'telefono') {
			if (modo === 'registro' && !onboardingCompletado) paso = 'tutorial';
			else paso = 'portada';
		} else if (paso === 'codigo') paso = 'telefono';
		else if (paso === 'nombre') paso = 'codigo';
		else if (paso === 'ubicacion') paso = 'nombre';
		else if (paso === 'zona') paso = 'ubicacion';
		else if (paso === 'tutorial') {
			if (tutorial > 0) tutorial -= 1;
			else paso = 'portada';
		}
	}

	function continuarTelefono() {
		error = '';
		if (!/^9\d{8}$/.test(telefono)) {
			error = 'Escribe un número celular válido de 9 dígitos.';
			return;
		}
		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
			phone?: string;
			firstName?: string;
		}>;
		const existente = usuarios.find((usuario) => usuario.phone === telefono);
		if (modo === 'registro' && existente) {
			error = 'Ese número ya tiene cuenta. Usa “Ya tengo cuenta” para ingresar.';
			return;
		}
		if (modo === 'login' && !existente) {
			error = 'No encontramos ese número. Toca “Crear cuenta” para registrarte.';
			return;
		}
		localStorage.setItem('ayni:v1:registro', JSON.stringify({ phone: telefono }));
		paso = 'codigo';
	}

	async function completarAcceso(
		telefonoAcceso: string,
		alias = 'Rosa',
		datosPerfil: { ubicacion?: string; manzana?: string } = {}
	) {
		let datos: { usuarioId?: string; rol?: string } = {};
		try {
			const respuesta = await fetch('/api/v1/auth', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					accion: 'registro',
					celular: telefonoAcceso,
					pin: codigo || '1234',
					alias
				})
			});
			if (respuesta.ok) {
				datos = (await respuesta.json().catch(() => ({}))) as {
					usuarioId?: string;
					rol?: string;
				};
			}
		} catch {
			// El registro demo también funciona sin conexión.
		}
		const usuarioId = datos.usuarioId ?? `local-${telefonoAcceso}`;
		guardarSesionLocal({
			usuarioId,
			rol: datos.rol ?? 'Vecino',
			telefono: telefonoAcceso,
			alias,
			expiraEn: Date.now() + 24 * 60 * 60 * 1000
		});
		localStorage.setItem('ayni:v1:registro', JSON.stringify({ phone: telefonoAcceso }));
		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<
			Record<string, unknown>
		>;
		const partesNombre = alias.trim().split(/\s+/);
		const nuevoUsuario = {
			id: usuarioId,
			firstName: partesNombre[0],
			lastName: partesNombre.slice(1).join(' '),
			phone: telefonoAcceso,
			ubicacion: datosPerfil.ubicacion,
			manzana: datosPerfil.manzana,
			createdAt: Date.now()
		};
		const indice = usuarios.findIndex((usuario) => usuario.phone === telefonoAcceso);
		if (indice >= 0) usuarios[indice] = { ...usuarios[indice], ...nuevoUsuario };
		else usuarios.unshift(nuevoUsuario);
		localStorage.setItem('ayni:v1:users', JSON.stringify(usuarios));
		await marcarOnboardingVisto();
		await goto('/');
	}

	async function verificarCodigo() {
		error = '';
		if (codigo !== '1234') {
			error = 'Código incorrecto. En demo utiliza 1234.';
			return;
		}
		try {
			if (modo === 'registro') {
				paso = 'nombre';
				return;
			}
			const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
				phone?: string;
				firstName?: string;
			}>;
			await completarAcceso(
				telefono,
				usuarios.find((usuario) => usuario.phone === telefono)?.firstName ?? 'Vecino'
			);
		} catch {
			error = 'No se pudo iniciar sesión. Intenta nuevamente.';
		}
	}

	async function entrarDemo() {
		modo = 'login';
		try {
			await completarAcceso('999123456');
		} catch {
			error = 'No se pudo iniciar sesión. Intenta nuevamente.';
		}
	}

	function iniciarRegistro() {
		modo = 'registro';
		paso = onboardingCompletado ? 'telefono' : 'tutorial';
	}

	function iniciarSesion() {
		modo = 'login';
		paso = 'telefono';
	}

	function guardarRegistro() {
		error = '';
		if (alias.trim().length < 2 || apellido.trim().length < 2) {
			error = 'Escribe tu nombre y apellido para continuar.';
			return;
		}
		paso = 'ubicacion';
	}

	async function guardarUbicacion() {
		error = '';
		if (!ubicacion.trim()) {
			error = 'Escribe tu dirección o referencia para continuar.';
			return;
		}
		paso = 'zona';
	}

	function usarUbicacionActual() {
		error = '';
		if (!navigator.geolocation) {
			ubicacion = 'Ubicación aproximada';
			return;
		}
		obteniendoUbicacion = true;
		navigator.geolocation.getCurrentPosition(
			async ({ coords }) => {
				try {
					const respuesta = await fetch(
						`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(coords.latitude)}&lon=${encodeURIComponent(coords.longitude)}&zoom=18&addressdetails=1`,
						{ headers: { Accept: 'application/json' } }
					);
					if (!respuesta.ok) throw new Error('No se pudo consultar la dirección.');
					const datos = (await respuesta.json()) as {
						address?: {
							road?: string;
							neighbourhood?: string;
							suburb?: string;
							city?: string;
							town?: string;
							village?: string;
							state?: string;
						};
					};
					const direccion = datos.address
						? [
								datos.address.road,
								datos.address.neighbourhood ?? datos.address.suburb,
								datos.address.city ?? datos.address.town ?? datos.address.village
							]
								.filter(Boolean)
								.join(', ')
						: '';
					ubicacion = direccion || 'Ubicación aproximada detectada';
				} catch {
					ubicacion = `Ubicación aproximada (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
				} finally {
					obteniendoUbicacion = false;
				}
			},
			() => {
				error = 'No pudimos detectar tu ubicación. Puedes escribir una referencia.';
				obteniendoUbicacion = false;
			},
			{ enableHighAccuracy: false, timeout: 8000 }
		);
	}

	async function guardarZona() {
		error = '';
		if (!manzana) {
			error = 'Elige tu manzana para terminar el registro.';
			return;
		}
		try {
			await completarAcceso(telefono, `${alias.trim()} ${apellido.trim()}`, {
				ubicacion: ubicacion.trim(),
				manzana
			});
		} catch {
			error = 'No se pudo terminar el registro. Intenta nuevamente.';
		}
	}

	onMount(async () => {
		try {
			const settings = JSON.parse(localStorage.getItem('ayni:v1:settings') ?? '{}') as {
				lang?: Idioma;
			};
			if (settings.lang && ['es', 'en', 'qu'].includes(settings.lang)) idioma = settings.lang;
		} catch {
			idioma = 'es';
		}
		onboardingCompletado = await onboardingVisto();
		if (obtenerSesionLocal()) await goto('/');
	});
</script>

<svelte:head><title>Acceso | AYNI</title></svelte:head>

{#snippet progreso(actual: number, total: number)}
	<div
		class="access-progress"
		role="progressbar"
		aria-label="Progreso del registro"
		aria-valuemin={1}
		aria-valuemax={total}
		aria-valuenow={actual}
	>
		{#each Array.from({ length: total }, (_, indice) => indice) as indice}
			{#if indice < actual}<span></span>{:else}<i></i>{/if}
		{/each}
	</div>
{/snippet}

<div class="access-page">
	{#if paso === 'portada'}
		<section class="access-cover">
			<div class="access-language" aria-label="Idioma">
			<select
				class="lang-combobox"
				value={idioma}
				onchange={(e) => cambiarIdioma((e.currentTarget as HTMLSelectElement).value as typeof idioma)}
			>
				<option value="es" title="Español (ISO: spa, Glottolog: stan1288)">ES · Español</option>
				<option value="en" title="English (ISO: eng, Glottolog: stan1291)">EN · English</option>
				<option value="qu" title="Qhapaq Simi (ISO: qu0, Glottolog: cusc1238)">QU · Qhapaq Simi</option>
			</select>
		</div>
			<div class="access-cover__content">
				<img src="/logo.jpg" alt="AYNI" />
				<h1>Hoy por ti,<br />mañana por mí.</h1>
				<p>
					Servicios recomendados por tus vecinos, favores sin dinero y apoyo cuando más se necesita.
				</p>
			</div>
			<div class="access-actions">
				<Btn variant="acento" onclick={iniciarRegistro}>{t('access.crear')}</Btn>
				<Btn variant="borde" onclick={iniciarSesion}>{t('access.ingresar')}</Btn>
				<button class="access-demo" type="button" onclick={entrarDemo}
					>Entrar como vecina de prueba (Rosa)</button
				>
			</div>
		</section>
	{:else if paso === 'tutorial'}
		<div class={`access-step ${tutoriales[tutorial].color}`}>
			<div class="access-step__header">
				<button class="access-skip" type="button" onclick={retroceder}>Volver</button>
				<button class="access-skip" type="button" onclick={() => (paso = 'telefono')}>Saltar</button>
			</div>
			<div class="access-step__image"><span><Icono name={tutoriales[tutorial].icon} /></span></div>
			<div class="access-step__copy">
				<h1>{tutoriales[tutorial].titulo}</h1>
				<p>{tutoriales[tutorial].texto}</p>
			</div>
			<div class="access-step__dots" aria-label={`Paso ${tutorial + 1} de ${tutoriales.length}`}>
				{#each tutoriales as _, indice}<span class:active={indice === tutorial}></span>{/each}
			</div>
			<Btn variant="blanco" onclick={siguienteTutorial}
				>{tutorial < tutoriales.length - 1 ? t('access.siguiente') : t('access.empezar')}</Btn
			>
		</div>
	{:else if paso === 'telefono'}
		<section class="access-screen">
			<Header title={tituloPaso} back={true} onBack={retroceder} />
			{@render progreso(pasoActual, totalPasos)}
			<h1 class="mobile-title">
				{modo === 'registro' ? '¿Cuál es tu número de celular?' : '¡Hola de nuevo!'}
			</h1>
			<p class="mobile-subtitle">
				{modo === 'registro'
					? 'Te enviaremos un código por SMS para verificar que eres tú.'
					: 'Escribe tu número y te enviaremos un código para entrar.'}
			</p>
			<div class="phone-field">
				<span>🇵🇪 +51</span>
				<Input
					type="tel"
					inputmode="numeric"
					maxlength={9}
					placeholder="987 654 321"
					bind:value={telefono}
					ariaLabel="Número de celular"
					onEnter={continuarTelefono}
				/>
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<p class="privacy-note">
				<Icono name="bloquear" /> Tus vecinos no verán tu número. Solo se usa cuando tú lo decidas.
			</p>
			<div class="access-spacer"></div>
			<StepNav
				pasoActual={pasoActual}
				totalPasos={totalPasos}
				onBack={retroceder}
				onNext={continuarTelefono}
				nextLabel="Enviar código"
				nextDisabled={telefono.length !== 9}
			/>
		</section>
	{:else if paso === 'codigo'}
		<section class="access-screen">
			<Header title={tituloPaso} back={true} onBack={retroceder} />
			{@render progreso(pasoActual, totalPasos)}
			<h1 class="mobile-title">Escribe el código</h1>
			<p class="mobile-subtitle">Lo enviamos por SMS al +51 {telefono}.</p>
			<Input
				class="code-field"
				inputmode="numeric"
				maxlength={4}
				placeholder="• • • •"
				bind:value={codigo}
				ariaLabel="Código de verificación"
				onEnter={verificarCodigo}
			/>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="demo-note">
				<Icono name="servicio" /> Modo demostración: el código es 1234.
			</div>
			<button class="access-demo" type="button" onclick={() => (paso = 'telefono')}
				>Cambiar número</button
			>
			<div class="access-spacer"></div>
			<StepNav
				pasoActual={pasoActual}
				totalPasos={totalPasos}
				onBack={retroceder}
				onNext={verificarCodigo}
				nextLabel="Verificar"
				nextDisabled={codigo.length !== 4}
			/>
		</section>
	{:else if paso === 'nombre'}
		<section class="access-screen">
			<Header title={tituloPaso} back={true} onBack={retroceder} />
			{@render progreso(pasoActual, totalPasos)}
			<h1 class="mobile-title">¿Cómo te llamas?</h1>
			<p class="mobile-subtitle">Así tus vecinos sabrán quién recomienda, presta o pide ayuda.</p>
			<Input
				class="code-field name-field"
				autocomplete="given-name"
				placeholder="Nombre"
				bind:value={alias}
				ariaLabel="Nombre"
				onEnter={guardarRegistro}
			/>
			<Input
				class="code-field name-field"
				autocomplete="family-name"
				placeholder="Apellido"
				bind:value={apellido}
				ariaLabel="Apellido"
				onEnter={guardarRegistro}
			/>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="access-spacer"></div>
			<StepNav
				pasoActual={pasoActual}
				totalPasos={totalPasos}
				onBack={retroceder}
				onNext={guardarRegistro}
				nextLabel={t('access.continuar')}
				nextDisabled={alias.trim().length < 2 || apellido.trim().length < 2}
			/>
		</section>
	{:else if paso === 'ubicacion'}
		<section class="access-screen">
			<Header title={tituloPaso} back={true} onBack={retroceder} />
			{@render progreso(pasoActual, totalPasos)}
			<h1 class="mobile-title">¿Dónde vives?</h1>
			<p class="mobile-subtitle">
				Usamos una ubicación aproximada para mostrarte ayuda cerca. Nunca publicaremos tu dirección
				exacta.
			</p>
			<label class="publish-label">
				Referencia o dirección
				<Input
					class="publish-input"
					autocomplete="street-address"
					placeholder="Ej. Av. Los Jardines 123"
					bind:value={ubicacion}
					ariaLabel="Referencia o dirección"
					onEnter={guardarUbicacion}
				/>
			</label>
			<button
				class="access-location"
				type="button"
				onclick={usarUbicacionActual}
				disabled={obteniendoUbicacion}
			>
				{#if obteniendoUbicacion}Detectando ubicación…{:else}<Icono
						name="ubicacion"
					/> Usar mi ubicación actual{/if}
			</button>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="access-spacer"></div>
			<StepNav
				pasoActual={pasoActual}
				totalPasos={totalPasos}
				onBack={retroceder}
				onNext={guardarUbicacion}
				nextLabel={t('access.continuar')}
				nextDisabled={!ubicacion.trim()}
			/>
		</section>
	{:else}
		<section class="access-screen">
			<Header title={tituloPaso} back={true} onBack={retroceder} />
			{@render progreso(pasoActual, totalPasos)}
			<h1 class="mobile-title">Elige tu manzana</h1>
			<p class="mobile-subtitle">
				La app detecta tu sector y solo muestra esta referencia de forma pública.
			</p>
			<div class="zone-grid">
				{#each ['A', 'B', 'C', 'D'] as item}
					<button class:active={manzana === item} type="button" onclick={() => (manzana = item)}>
						Sector 3 · Mz. {item}
					</button>
				{/each}
			</div>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<div class="access-spacer"></div>
			<StepNav
				pasoActual={pasoActual}
				totalPasos={totalPasos}
				onBack={retroceder}
				onNext={guardarZona}
				nextLabel={t('access.entrar')}
				nextDisabled={!manzana}
			/>
		</section>
	{/if}
</div>
