<script lang="ts">
	import { goto } from '$app/navigation';
	import Btn from '../../lib/ui/Btn.svelte';
	import Header from '../../lib/ui/Header.svelte';
	import Screen from '../../lib/ui/Screen.svelte';
	import { onMount } from 'svelte';
	import {
		guardarSesionLocal,
		marcarOnboardingVisto,
		obtenerSesionLocal,
		onboardingVisto
	} from '../../lib/onboarding';
	import { t } from '../../lib/i18n.svelte';
	import { fetchConRetry } from '../../lib/fetch-con-retry';

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

	const tutoriales = [
		{
			emoji: '🤝',
			titulo: 'Hoy por ti,\nmañana por mí',
			texto: 'Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.',
			color: 'access-step--petroleo'
		},
		{
			emoji: '🔄',
			titulo: 'Pide o presta\nsin dinero',
			texto: 'Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.',
			color: 'access-step--petroleo'
		},
		{
			emoji: '🛡️',
			titulo: 'En emergencias,\nnos cuidamos',
			texto: 'Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda.',
			color: 'access-step--rojo'
		}
	];

	function siguienteTutorial() {
		if (tutorial < tutoriales.length - 1) tutorial += 1;
		else paso = 'telefono';
	}

	function continuarTelefono() {
		error = '';
		if (!/^9\d{8}$/.test(telefono)) {
			error = t('error.telefono_invalido');
			return;
		}
		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
			phone?: string;
			firstName?: string;
		}>;
		const existente = usuarios.find((usuario) => usuario.phone === telefono);
		if (modo === 'registro' && existente) {
			error = t('error.usuario_ya_existe');
			return;
		}
		if (modo === 'login' && !existente) {
			error = t('error.usuario_no_encontrado');
			return;
		}
		localStorage.setItem('ayni:v1:registro', JSON.stringify({ phone: telefono }));
		paso = 'codigo';
	}

	async function completarAcceso(
		telefonoAcceso: string,
		alias = 'Rosa',
		datosPerfil: { ubicacion?: string; manzana?: string } = {},
		accion: 'registro' | 'sesion' = 'registro'
	) {
		let datos: { usuarioId?: string; rol?: string } = {};
		try {
			const respuesta = await fetchConRetry(`/api/v1/auth/${accion}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					accion,
					celular: telefonoAcceso,
					pin: codigo || '1234',
					alias
				})
			});
			datos = (await respuesta.json().catch(() => ({}))) as {
				usuarioId?: string;
				rol?: string;
			};
		} catch {
			// El registro demo también funciona sin conexión.
		}
		const usuarioId = datos.usuarioId ?? `local-${telefonoAcceso}`;
		guardarSesionLocal({
			usuarioId,
			rol: datos.rol ?? 'Vecino',
			telefono: telefonoAcceso,
			alias,
			expiraEn: Date.now() + 10 * 60 * 1000
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
				usuarios.find((usuario) => usuario.phone === telefono)?.firstName ?? 'Vecino',
				{},
				'sesion'
			);
		} catch {
			error = 'No se pudo iniciar sesión. Intenta nuevamente.';
		}
	}

	async function entrarDemo() {
		modo = 'login';
		try {
			await completarAcceso('999123456', 'Rosa', {}, 'sesion');
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
			() => {
				ubicacion = 'Ubicación aproximada detectada';
				obteniendoUbicacion = false;
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
			error = t('error.generico');
			return;
		}
		try {
			await completarAcceso(telefono, `${alias.trim()} ${apellido.trim()}`, {
				ubicacion: ubicacion.trim(),
				manzana
			}, 'registro');
		} catch {
			error = t('error.sesion_no_pudo_iniciar');
		}
	}

	onMount(async () => {
		onboardingCompletado = await onboardingVisto();
		if (obtenerSesionLocal()) await goto('/');
	});
</script>

<svelte:head><title>Acceso | AYNI</title></svelte:head>

{#if paso === 'portada'}
	<Screen class="access-cover">
		<div class="access-language">ES</div>
		<div class="access-cover__content">
			<img src="/logo.jpg" alt="AYNI" />
			<h1>Hoy por ti,<br />mañana por mí.</h1>
			<p>
				Servicios recomendados por tus vecinos, favores sin dinero y apoyo cuando más se necesita.
			</p>
		</div>
		<div class="access-actions">
			<Btn variant="acento" onclick={iniciarRegistro}>Crear cuenta</Btn>
			<Btn variant="borde" onclick={iniciarSesion}>Ya tengo cuenta</Btn>
			<button class="access-demo" type="button" onclick={entrarDemo}
				>Entrar como vecina de prueba (Rosa)</button
			>
		</div>
	</Screen>
{:else if paso === 'tutorial'}
	<div class={`access-step ${tutoriales[tutorial].color}`}>
		<button class="access-skip" type="button" onclick={() => (paso = 'telefono')}>Saltar</button>
		<div class="access-step__image"><span>{tutoriales[tutorial].emoji}</span></div>
		<div>
			<h1>{tutoriales[tutorial].titulo}</h1>
			<p>{tutoriales[tutorial].texto}</p>
		</div>
		<div class="access-step__dots" aria-label={`Paso ${tutorial + 1} de 3`}>
			{#each tutoriales as _, index}<span class:active={index === tutorial}></span>{/each}
		</div>
		<Btn variant="blanco" onclick={siguienteTutorial}
			>{tutorial < 2 ? 'Siguiente →' : 'Empezar'}</Btn
		>
	</div>
{:else if paso === 'telefono'}
	<Screen>
		<Header title={modo === 'registro' ? 'Paso 1 de 4' : 'Ingresar'} back={false} />
		{#if modo === 'registro'}
			<button
				class="access-demo access-back-link"
				type="button"
				onclick={() => (paso = 'tutorial')}
			>
				Volver al tutorial
			</button>
		{/if}
		<div class="access-progress"><span></span><i></i><i></i><i></i></div>
		<h1 class="mobile-title">
			{modo === 'registro' ? '¿Cuál es tu número de celular?' : '¡Hola de nuevo! 👋'}
		</h1>
		<p class="mobile-subtitle">
			{modo === 'registro'
				? 'Te enviaremos un código por SMS para verificar que eres tú.'
				: 'Escribe tu número y te enviaremos un código para entrar.'}
		</p>
		<div class="phone-field">
			<span>🇵🇪 +51</span>
			<input
				type="tel"
				inputmode="numeric"
				maxlength="9"
				placeholder="987 654 321"
				bind:value={telefono}
			/>
		</div>
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
		<p class="privacy-note">🔒 Tus vecinos no verán tu número. Solo se usa cuando tú lo decidas.</p>
		<div class="access-spacer"></div>
		<Btn disabled={telefono.length !== 9} onclick={continuarTelefono}>Enviar código</Btn>
	</Screen>
{:else if paso === 'codigo'}
	<Screen>
		<Header title={modo === 'registro' ? 'Paso 2 de 4' : 'Ingresar'} back={false} />
		<div class="access-progress"><span></span><span></span><i></i><i></i></div>
		<h1 class="mobile-title">Escribe el código</h1>
		<p class="mobile-subtitle">Lo enviamos por SMS al +51 {telefono}.</p>
		<input
			class="code-field"
			inputmode="numeric"
			maxlength="4"
			placeholder="• • • •"
			bind:value={codigo}
		/>
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
		<div class="demo-note">🧪 Modo demostración: el código es 1234.</div>
		<button class="access-demo" type="button" onclick={() => (paso = 'telefono')}
			>Cambiar número</button
		>
		<div class="access-spacer"></div>
		<Btn disabled={codigo.length !== 4} onclick={verificarCodigo}>Verificar</Btn>
	</Screen>
{:else if paso === 'nombre'}
	<Screen>
		<Header title="Paso 3 de 5" back={false} />
		<div class="access-progress"><span></span><span></span><span></span><i></i><i></i></div>
		<h1 class="mobile-title">¿Cómo te llamas?</h1>
		<p class="mobile-subtitle">Así tus vecinos sabrán quién recomienda, presta o pide ayuda.</p>
		<input
			class="code-field name-field"
			autocomplete="given-name"
			placeholder="Nombre"
			bind:value={alias}
		/>
		<input
			class="code-field name-field"
			autocomplete="family-name"
			placeholder="Apellido"
			bind:value={apellido}
		/>
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
		<div class="access-spacer"></div>
		<Btn disabled={alias.trim().length < 2 || apellido.trim().length < 2} onclick={guardarRegistro}
			>Continuar</Btn
		>
	</Screen>
{:else if paso === 'ubicacion'}
	<Screen>
		<Header title="Paso 4 de 5" back={false} />
		<div class="access-progress"><span></span><span></span><span></span><span></span><i></i></div>
		<h1 class="mobile-title">¿Dónde vives?</h1>
		<p class="mobile-subtitle">
			Usamos una ubicación aproximada para mostrarte ayuda cerca. Nunca publicaremos tu dirección
			exacta.
		</p>
		<label class="publish-label">
			Referencia o dirección
			<input
				class="publish-input"
				autocomplete="street-address"
				placeholder="Ej. Av. Los Jardines 123"
				bind:value={ubicacion}
			/>
		</label>
		<button
			class="access-location"
			type="button"
			onclick={usarUbicacionActual}
			disabled={obteniendoUbicacion}
		>
			{obteniendoUbicacion ? 'Detectando ubicación…' : '📍 Usar mi ubicación actual'}
		</button>
		{#if error}<p class="form-error" role="alert">{error}</p>{/if}
		<div class="access-spacer"></div>
		<Btn disabled={!ubicacion.trim()} onclick={guardarUbicacion}>Continuar</Btn>
	</Screen>
{:else}
	<Screen>
		<Header title="Paso 5 de 5" back={false} />
		<div class="access-progress">
			<span></span><span></span><span></span><span></span><span></span>
		</div>
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
		<Btn disabled={!manzana} onclick={guardarZona}>Entrar a AYNI</Btn>
	</Screen>
{/if}
