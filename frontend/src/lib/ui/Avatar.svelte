<script>
  let { letter = '', src = '/avatar-default.png', class: clase = 'h-11 w-11 bg-ambar text-lg' } = $props();
</script>

<img {src} alt={letter ? `Avatar ${letter}` : 'Avatar'} class="shrink-0 rounded-full object-cover {clase}" />
