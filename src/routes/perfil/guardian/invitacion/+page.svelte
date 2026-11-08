<script lang="ts">
	import { goto } from '$app/navigation';
	import Screen from '../../../../lib/ui/Screen.svelte';
	import Header from '../../../../lib/ui/Header.svelte';
	let nombre = $state('tu zona');
	function leer<T>(key: string, fallback: T): T {
		try {
			const raw = localStorage.getItem(`ayni:v1:${key}`);
			return raw ? (JSON.parse(raw) as T) : fallback;
		} catch {
			return fallback;
		}
	}
	function responder(acepta: boolean) {
		const users = leer<Array<Record<string, unknown>>>('users', []);
		localStorage.setItem(
			'ayni:v1:users',
			JSON.stringify(
				users.map((u, i) =>
					i === 0 ? { ...u, inviteAnswered: acepta ? 'aceptada' : 'despues' } : u
				)
			)
		);
		if (!acepta) {
			goto('/perfil');
			return;
		}
		const sectors = leer<Array<Record<string, unknown>>>('sectors', []);
		const id = (users[0]?.id as string) ?? '';
		localStorage.setItem(
			'ayni:v1:sectors',
			JSON.stringify(
				sectors.map((s, i) =>
					i === 0
						? { ...s, guardianIds: [...new Set([...((s.guardianIds as string[]) ?? []), id])] }
						: s
				)
			)
		);
		goto('/perfil/guardian/aceptado');
	}
</script>

<Screen>
	<Header title="Invitación" />
	<div class="guardian-invite">
		<div class="guardian-invite__icon">🛡️</div>
		<h1>¡Llevas 2 meses ayudando en AYNI!</h1>
		<p>Tus vecinos confían en ti. ¿Quieres ser Guardián de {nombre}?</p>
		<ul>
			<li>✅ Confirmar o descartar emergencias</li>
			<li>✅ Avisar cuando fueron atendidas</li>
			<li>✅ Revisar publicaciones reportadas</li>
		</ul>
		<button class="mobile-btn mobile-btn--primary" onclick={() => responder(true)}
			>Acepto ser Guardián</button
		>
		<button class="detail-secondary" onclick={() => responder(false)}>Ahora no</button>
	</div>
</Screen>
