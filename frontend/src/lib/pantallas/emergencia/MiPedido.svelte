<!-- 4.8 Mi pedido / ayuda en camino (el teléfono del ayudante lo entrega el servidor solo a las dos partes) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { VULNERABLES, emergenciaById, necesidadById } from '../../data.js';
  import { abrirEnlace, hace, hora, nombreVisible, whatsappLink } from '../../util.js';
  import { resolverPedido } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import EmergencyBanner from '../../ui/EmergencyBanner.svelte';
  import Header from '../../ui/Header.svelte';
  import Screen from '../../ui/Screen.svelte';
  import Steps from '../../ui/Steps.svelte';

  let { id } = $props();
  const n = $derived(datos.needs.find((x) => x.id === id));
  const e = $derived(app.activeEmergency);
  const nec = $derived(n ? necesidadById(n.necesidad) : null);
  const helper = $derived(n ? app.users.find((u) => u.id === n.helperId) : null);
</script>

{#if n}
  <div class="flex flex-1 flex-col">
    {#if e}<EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />{/if}
    <Screen>
      <Header title="Tu pedido de ayuda" />
      <div class="flex items-center gap-3 rounded-[20px] border-2 border-rojo bg-white p-4">
        <span class="text-3xl" aria-hidden="true">{nec.emoji}</span>
        <div>
          <div class="font-black">{nec.label} · {n.cuantas} persona(s)</div>
          <div class="text-sm font-semibold text-gris">{n.quienes.map((q) => VULNERABLES.find((v) => v.id === q)?.emoji).join(' ')} Zona Mz. {n.manzana}</div>
        </div>
      </div>
      {#if helper}
        <div class="flex flex-col gap-3 rounded-[20px] bg-petroleo-claro p-4">
          <div class="font-black">🙋 {nombreVisible(helper)} va en camino</div>
          <div class="text-sm font-semibold text-gris">Vive en la Mz. {helper.manzana} · aceptó {hace(n.helperAt)}</div>
          {#if n.contactPhone}
            <div class="grid grid-cols-2 gap-2.5">
              <a href="tel:+{n.contactPhone}" class="flex min-h-[52px] items-center justify-center rounded-2xl bg-petroleo font-black text-white">📞 Llamar</a>
              <button type="button" onclick={() => abrirEnlace(whatsappLink(n.contactPhone, 'Hola, te escribo por mi pedido de ayuda en AYNI.'))} class="min-h-[52px] rounded-2xl bg-wa font-black text-white">💬 WhatsApp</button>
            </div>
          {:else}
            <p class="text-xs font-semibold text-gris">El contacto aparecerá cuando tu celular se sincronice.</p>
          {/if}
        </div>
      {:else}
        <div class="rounded-[20px] border border-ambar bg-ambar-claro p-4 text-sm font-bold">⏳ Tu pedido ya está en el mapa. Te avisaremos cuando un vecino toque “Voy yo”.</div>
      {/if}
      <Steps items={[['✅', 'Pedido publicado', hora(n.createdAt), true], [helper ? '✅' : '⏳', helper ? `${nombreVisible(helper)} aceptó ayudarte` : 'Esperando a un vecino', '', true], [n.status === 'resuelto' ? '✅' : '⚪', 'Ayuda recibida', '', n.status === 'resuelto']]} />
      <div class="flex-1"></div>
      {#if n.status !== 'resuelto'}
        <Btn
          onclick={() => {
            resolverPedido(n);
            app.reset('inicio');
          }}>✅ Ya recibí ayuda</Btn>
      {/if}
    </Screen>
  </div>
{/if}
