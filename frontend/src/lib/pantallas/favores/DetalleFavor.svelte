<!-- 6.1 Detalle de favor -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { TIPOS_FAVOR } from '../../data.js';
  import { balanceAyni, cuadras, cuadrasTxt, hace, nombreVisible } from '../../util.js';
  import { confirmarFavor, reservarFavor, whatsappFavor } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import EmptyState from '../../ui/EmptyState.svelte';
  import H1 from '../../ui/H1.svelte';
  import Header from '../../ui/Header.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Sub from '../../ui/Sub.svelte';
  import EstadoChip from './EstadoChip.svelte';
  import TipoChip from './TipoChip.svelte';
  import { detallesFavor, minutosRestantes } from './comun.js';

  let { id } = $props();
  const f = $derived(datos.favors.find((x) => x.id === id));
  const owner = $derived(f ? app.users.find((u) => u.id === f.ownerId) : null);
  const mine = $derived(f?.ownerId === app.user.id);
  const balance = $derived(f ? balanceAyni(f.ownerId, datos.favors) : { dados: 0, recibidos: 0 });
  const verbo = $derived(f?.tipo === 'pido' ? 'Puedo ayudar' : 'Lo quiero');
</script>

{#if !f}
  <Screen>
    <Header />
    <EmptyState emoji="🙈" title="Esta publicación ya no está disponible" />
  </Screen>
{:else}
  <div class="flex flex-1 flex-col">
    <div class="flex h-44 items-center justify-center bg-ambar-claro text-7xl" aria-hidden="true">
      {#if f.foto}<img src={f.foto} alt="" class="h-full w-full object-cover" />{:else}{TIPOS_FAVOR[f.tipo].emoji}{/if}
    </div>
    <Screen>
      <Header title={mine ? 'Tu publicación' : 'Cadena de Favores'} />
      <div class="flex flex-wrap gap-2">
        <TipoChip tipo={f.tipo} />
        <EstadoChip {f} userId={app.user.id} />
      </div>
      <H1>{f.titulo}</H1>
      <Sub>{mine ? 'Publicado por ti' : nombreVisible(owner)} · Mz. {owner?.manzana} · {cuadrasTxt(cuadras(app.user.manzana, owner?.manzana))} · {hace(f.createdAt)}</Sub>
      <div class="grid grid-cols-2 gap-2.5">
        {#each detallesFavor(f) as [icono, texto] (texto)}
          <div class="rounded-2xl border border-linea bg-white p-3 text-sm font-bold"><span class="block text-xl" aria-hidden="true">{icono}</span>{texto}</div>
        {/each}
      </div>
      {#if !mine}
        <div class="flex items-center gap-3 rounded-2xl bg-morado-claro p-3 text-sm font-extrabold text-morado-osc">
          <span class="text-xl" aria-hidden="true">🤝</span>{owner?.firstName} ha dado {balance.dados} favores y recibido {balance.recibidos}
        </div>
      {/if}
      <div class="flex-1"></div>

      {#if mine}<Btn onclick={() => app.go('misPublicaciones')}>Gestionar en Mis publicaciones</Btn>{/if}

      {#if !mine && f.status === 'disponible'}
        <p class="text-center text-sm font-semibold text-gris">Se abrirá WhatsApp con {owner?.firstName} y quedará reservado para ti por 1 hora.</p>
        <Btn onclick={() => reservarFavor(f)}>🙋 {verbo}</Btn>
      {/if}

      {#if !mine && f.status === 'reservado' && f.takerId === app.user.id}
        <div class="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">⏳ Reservado para ti · se libera en {minutosRestantes(f)} min si no se concreta.</div>
        {#if f.takerConfirmed}
          <p class="text-center text-sm font-bold text-gris">Ya confirmaste. Esperando que {owner?.firstName} toque “Listo”.</p>
        {:else}
          <Btn
            onclick={() => {
              if (confirmarFavor(f, 'taker')) app.go('favorCerrado', { id: f.id });
              else app.notify(`¡Gracias! Falta que ${owner?.firstName} confirme.`);
            }}>✅ Listo, ya se concretó</Btn>
        {/if}
        <Btn variant="borde" onclick={() => whatsappFavor(f)}>💬 Escribir por WhatsApp</Btn>
      {/if}

      {#if !mine && f.status === 'reservado' && f.takerId !== app.user.id}
        <p class="text-center text-sm font-bold text-gris">Otro vecino lo reservó. Si no se concreta en 1 hora, vuelve a estar disponible.</p>
      {/if}

      {#if !mine && f.status !== 'cerrado'}
        <LinkBtn class="!text-gris" onclick={() => app.go('reportar', { col: 'favors', id: f.id })}>⚑ Reportar publicación</LinkBtn>
      {/if}
    </Screen>
  </div>
{/if}
