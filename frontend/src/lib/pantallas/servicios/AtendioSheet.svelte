<!-- 5.2 ¿Te atendió? (solo quien fue atendido puede dar Visto Bueno) -->
<script>
  import { app, datos } from '../../estado.svelte.js';
  import { catById } from '../../data.js';
  import { hace, nombreVisible } from '../../util.js';
  import { responderContacto } from '../../acciones.js';
  import Btn from '../../ui/Btn.svelte';
  import Circle from '../../ui/Circle.svelte';
  import LinkBtn from '../../ui/LinkBtn.svelte';
  import Sheet from '../../ui/Sheet.svelte';
  import { serviciosVisibles } from './comun.js';

  let omitidos = $state([]);
  const contacto = $derived(datos.contacts.find((c) => c.userId === app.user?.id && !c.answered && !omitidos.includes(c.id)));
  const s = $derived(contacto ? serviciosVisibles(app.user).find((x) => x.id === contacto.serviceId) : null);
  const omitir = () => (omitidos = [...omitidos, contacto.id]);
</script>

{#if contacto && s}
  <Sheet onClose={omitir}>
    <Circle emoji={catById(s.categoria).emoji} class="h-20 w-20 bg-ambar-claro !text-4xl" />
    <h2 class="text-center text-xl font-black">¿Te atendió {nombreVisible(s.owner, true)}?</h2>
    <p class="text-center text-[15px] font-semibold text-gris">Le escribiste por WhatsApp {hace(contacto.createdAt)} por: {s.titulo}.</p>
    <Btn
      onclick={() => {
        responderContacto(contacto, true);
        app.go('vistoBueno', { id: s.id });
      }}>Sí, me atendió</Btn>
    <Btn variant="borde" onclick={omitir}>Todavía no</Btn>
    <LinkBtn class="!text-gris" onclick={() => responderContacto(contacto, false)}>No me atendió</LinkBtn>
  </Sheet>
{/if}
