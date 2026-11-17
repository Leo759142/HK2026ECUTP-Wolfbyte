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
	import { gestorIdiomas } from '../../i18n';
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

	const t = (key: string) => gestorIdiomas.t(key);

	function emergencia() {
		goto('/emergencia');
	}

	onMount(async () => {
		const yaVioOnboarding = await onboardingVisto();
		onboardingCompletado = yaVioOnboarding;
		console.log('[Acceso] onMount:', { yaVioOnboarding, tieneSesion: !!obtenerSesionLocal() });
		if (yaVioOnboarding && obtenerSesionLocal()) {
			await goto('/');
		}
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
		error = '';
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
		const limpio = telefono.replace(/\D/g, '');
		telefono = limpio;
		if (!/^9\d{8}$/.test(limpio)) {
			error = t('error.acceso.telefono_invalido');
			return;
		}
		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<{
			phone?: string;
			firstName?: string;
		}>;
		const existente = usuarios.find((usuario) => usuario.phone === limpio);
		if (modo === 'registro' && existente) {
			error = t('error.acceso.telefono_existe');
			return;
		}
		if (modo === 'login' && !existente) {
			error = t('error.acceso.telefono_no_existe');
			return;
		}
		localStorage.setItem('ayni:v1:registro', JSON.stringify({ phone: limpio }));
		paso = 'codigo';
	}

	function generarPinRegistro(telefono: string): string {
		const d = telefono.replace(/\D/g, '');
		const debiles = new Set(['000000', '111111', '123456', '654321', '123123']);
		const base = (d.slice(-6) || '000000').padStart(6, '0');
		if (!debiles.has(base)) return base;
		const alt = String((Number(d.slice(-6) || 0) + 137911) % 1_000_000).padStart(6, '0');
		return debiles.has(alt) ? '543219' : alt;
	}

	async function completarAcceso(
		telefonoAcceso: string,
		aliasUsuario = 'Rosa',
		datosPerfil: { ubicacion?: string; manzana?: string } = {},
		accion: 'login' | 'registro' = 'registro'
	) {
		let datos: { usuarioId?: string; rol?: string } = {};
		try {
			const respuesta = await fetch('/api/v1/auth', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					accion,
					celular: telefonoAcceso,
					pin:
						accion === 'registro' ? generarPinRegistro(telefonoAcceso) : codigo.trim() || '1234',
					alias: aliasUsuario
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
			alias: aliasUsuario,
			expiraEn: Date.now() + 24 * 60 * 60 * 1000
		});

		localStorage.setItem('ayni:v1:registro', JSON.stringify({ phone: telefonoAcceso }));
		const usuarios = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]') as Array<
			Record<string, unknown>
		>;
		const partesNombre = aliasUsuario.trim().split(/\s+/);
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
		if (codigo.trim() !== '1234') {
			error = t('error.acceso.codigo_incorrecto');
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
				'login'
			);
		} catch {
			error = t('error.acceso.login_fallo');
		}
	}

	async function entrarDemo() {
		error = '';
		modo = 'login';
		try {
			await completarAcceso('999123456', 'Rosa', {}, 'login');
		} catch {
			error = t('error.acceso.login_fallo');
		}
	}

	function iniciarRegistro() {
		error = '';
		modo = 'registro';
		tutorial = 0;
		// Tutorial solo si NUNCA vio onboarding (primera vez absoluta)
		const yaVioOnboarding = onboardingCompletado;
		paso = yaVioOnboarding ? 'telefono' : 'tutorial';
		console.log('[Acceso] iniciarRegistro:', { yaVioOnboarding, paso });
	}

	function iniciarSesion() {
		error = '';
		modo = 'login';
		paso = 'telefono';
	}

	function guardarRegistro() {
		error = '';
		if (alias.trim().length < 2 || apellido.trim().length < 2) {
			error = t('error.acceso.nombre_requerido');
			return;
		}
		paso = 'ubicacion';
	}

	function guardarUbicacion() {
		error = '';
		if (!ubicacion.trim()) {
			error = t('error.acceso.ubicacion_requerida');
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
						`/api/v1/geo/reverse?lat=${encodeURIComponent(coords.latitude)}&lng=${encodeURIComponent(coords.longitude)}`,
						{ headers: { Accept: 'application/json' } }
					);
					if (!respuesta.ok) throw new Error(t('error.acceso.direccion_no_consultada'));
					const datos = (await respuesta.json()) as {
						direccion?: string;
						barrio?: string;
						distrito?: string;
					};
					const direccion =
						datos.direccion || [datos.barrio, datos.distrito].filter(Boolean).join(', ');
					ubicacion = direccion || 'Ubicación aproximada detectada';
				} catch {
					ubicacion = `Ubicación aproximada (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
				} finally {
					obteniendoUbicacion = false;
				}
			},
			() => {
				error = t('error.acceso.ubicacion_no_detectada');
				obteniendoUbicacion = false;
			},
			{ enableHighAccuracy: false, timeout: 8000 }
		);
	}

	async function guardarZona() {
		error = '';
		if (!manzana) {
			error = t('error.acceso.zona_requerida');
			return;
		}
		try {
			await completarAcceso(telefono, `${alias.trim()} ${apellido.trim()}`, {
				ubicacion: ubicacion.trim(),
				manzana
			});
		} catch {
			error = t('error.acceso.registro_fallo');
		}
	}
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
		{#each Array(total) as _, indice}
			{#if indice < actual}
				<span></span>
			{:else}
				<i></i>
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet pantallaPaso(
	titulo: string,
	subtitulo: string,
	nextLabel: string,
	nextDisabled: boolean,
	onNext: () => void,
	contenido: import('svelte').Snippet
)}
	<section class="access-screen">
		<Header title={tituloPaso} back={true} onBack={retroceder} />
		{@render progreso(pasoActual, totalPasos)}

		<h1 class="mobile-title">{titulo}</h1>
		<p class="mobile-subtitle">{subtitulo}</p>

		{@render contenido()}

		{#if error}
			<p class="form-error" role="alert">{error}</p>
		{/if}

		<div class="access-spacer"></div>
		<StepNav {pasoActual} {totalPasos} onBack={retroceder} {onNext} {nextLabel} {nextDisabled} />
	</section>
{/snippet}

<div class="access-page">
	{#if paso === 'portada'}
		<section class="access-cover">
			<div class="access-language" aria-label="Idioma">
				<select
					class="lang-combobox"
					value={gestorIdiomas.idiomaActual}
					onchange={(e) => gestorIdiomas.cambiarIdioma(e.currentTarget.value)}
				>
					<option value="es" title="Español (ISO: spa, Glottolog: stan1288)">ES · Español</option>
					<option value="en" title="English (ISO: eng, Glottolog: stan1291)">EN · English</option>
					<option value="qu" title="Qhichwa (ISO: qu0, Glottolog: cusc1238)">QU · Qhichwa</option>
				</select>
			</div>

			<div class="access-cover__content">
				<img src="/logo.jpg" alt="AYNI" />
				<h1>{t('lema')}</h1>
				<p>{t('serviciosDescritos')}</p>
			</div>

			<div class="access-actions">
				<Btn variant="acento" onclick={iniciarRegistro}>{t('access.crear')}</Btn>
				<Btn variant="borde" onclick={iniciarSesion}>{t('access.ingresar')}</Btn>
				<Btn variant="rojo" onclick={emergencia}>{t('access.emergencia')}</Btn>
				<button class="access-demo" type="button" onclick={entrarDemo}>
					Entrar como vecina de prueba (Rosa)
				</button>
			</div>
		</section>
	{:else if paso === 'tutorial'}
		{@const slide = tutoriales[tutorial]}
		<div class={`access-step ${slide.color}`}>
			<div class="access-step__header">
				<button class="access-skip" type="button" onclick={retroceder}>Volver</button>
				<button class="access-skip" type="button" onclick={() => (paso = 'telefono')}>Saltar</button
				>
			</div>

			<div class="access-step__image">
				<span><Icono name={slide.icon} /></span>
			</div>

			<div class="access-step__copy">
				<h1>{slide.titulo}</h1>
				<p>{slide.texto}</p>
			</div>

			<div class="access-step__dots" aria-label={`Paso ${tutorial + 1} de ${tutoriales.length}`}>
				{#each tutoriales as _, indice}
					<span class:active={indice === tutorial}></span>
				{/each}
			</div>

			<Btn variant="blanco" onclick={siguienteTutorial}>
				{tutorial < tutoriales.length - 1 ? t('access.siguiente') : t('access.empezar')}
			</Btn>
		</div>
	{:else if paso === 'telefono'}
		{#snippet camposTelefono()}
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
			<p class="privacy-note">
				<Icono name="bloquear" /> Tus vecinos no verán tu número. Solo se usa cuando tú lo decidas.
			</p>
		{/snippet}

		{@render pantallaPaso(
			modo === 'registro' ? '¿Cuál es tu número de celular?' : '¡Hola de nuevo!',
			modo === 'registro'
				? 'Te enviaremos un código por SMS para verificar que eres tú.'
				: 'Escribe tu número y te enviaremos un código para entrar.',
			'Enviar código',
			telefono.replace(/\D/g, '').length !== 9,
			continuarTelefono,
			camposTelefono
		)}
	{:else if paso === 'codigo'}
		{#snippet camposCodigo()}
			<Input
				class="code-field"
				inputmode="numeric"
				maxlength={4}
				placeholder="• • • •"
				bind:value={codigo}
				ariaLabel="Código de verificación"
				onEnter={verificarCodigo}
			/>
			<div class="demo-note">
				<Icono name="servicio" /> Modo demostración: el código es 1234.
			</div>
			<button class="access-demo" type="button" onclick={() => (paso = 'telefono')}>
				Cambiar número
			</button>
		{/snippet}

		{@render pantallaPaso(
			'Escribe el código',
			`Lo enviamos por SMS al +51 ${telefono}.`,
			'Verificar',
			codigo.trim().length !== 4,
			verificarCodigo,
			camposCodigo
		)}
	{:else if paso === 'nombre'}
		{#snippet camposNombre()}
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
		{/snippet}

		{@render pantallaPaso(
			'¿Cómo te llamas?',
			'Así tus vecinos sabrán quién recomienda, presta o pide ayuda.',
			t('access.continuar'),
			alias.trim().length < 2 || apellido.trim().length < 2,
			guardarRegistro,
			camposNombre
		)}
	{:else if paso === 'ubicacion'}
		{#snippet camposUbicacion()}
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
				{#if obteniendoUbicacion}
					Detectando ubicación…
				{:else}
					<Icono name="ubicacion" /> Usar mi ubicación actual
				{/if}
			</button>
		{/snippet}

		{@render pantallaPaso(
			'¿Dónde vives?',
			'Usamos una ubicación aproximada para mostrarte ayuda cerca. Nunca publicaremos tu dirección exacta.',
			t('access.continuar'),
			!ubicacion.trim(),
			guardarUbicacion,
			camposUbicacion
		)}
	{:else}
		{#snippet camposZona()}
			<div class="zone-grid">
				{#each ['A', 'B', 'C', 'D'] as item}
					<button class:active={manzana === item} type="button" onclick={() => (manzana = item)}>
						Sector 3 · Mz. {item}
					</button>
				{/each}
			</div>
		{/snippet}

		{@render pantallaPaso(
			'Elige tu manzana',
			'La app detecta tu sector y solo muestra esta referencia de forma pública.',
			t('access.entrar'),
			!manzana,
			guardarZona,
			camposZona
		)}
	{/if}
</div>
