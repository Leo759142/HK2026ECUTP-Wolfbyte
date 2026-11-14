<!-- Íconos Font Awesome (paquete npm: funcionan sin conexión). -->
<script>
  let { name, class: clase = '', ...resto } = $props();
</script>

<i class="fa-solid {name} {clase}" aria-hidden="true" {...resto}></i>
