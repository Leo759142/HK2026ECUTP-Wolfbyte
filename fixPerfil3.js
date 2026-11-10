const fs = require("fs");
const path = "src/routes/perfil/+page.svelte";
let s = fs.readFileSync(path, "utf8");

// 1. Quitar la línea del prefijo if existente
s = s.replace("\\tlet PREFIJO = 'ayni:v1:';", "");
Write-Host "Prefijo quitado";

// 2. Cambiar type Usuario de <Usuario> a <any>
s = s.replace("\\tlet usuario = \\$state<Usuario>({});", "\\tlet usuario = \\$state<any>({});");
Write-Host "Type cambiado";

// 3. Insertar función cargarUsuario() al inicio del onMount
// Encontrar onMount y añadir la función al inicio
const onMountPattern = "\\tonMount\\(async \\(\\) => \\{[^}]+\\}\\}";
const onMountReplacement = "\\tonMount(async () => {\\n\\t\\tasync function cargarUsuario() {\\n\\t\\t\\ttry {\\n\\t\\t\\t\\tconst { usuario } = await apiGet('/usuarios');\\n\\t\\t\\t\\tif (usuario) usuarioId = usuario.id ?? usuarioId;\\n\\t\\t\\t} catch (e) {\\n\\t\\t\\t\\t// fallback conservado: usuarioId = JSON.parse(localStorage.getItem('ayni:v1:users') ?? '[]')[0]?.id ?? usuarioId;\\n\\t\\t\\t} finally {\\n\\t\\t\\tusuarioId = usuarioId;\\n\\t\\t}\\n\\t\\t}();";
// Verificar si ya existe
if (s.includes("cargarUsuario")) {
  Write-Host "cargarUsuario ya existe";
} else {
  s = s.replace("\\tonMount(async () => {", onMountReplacement + "\\n\\tonMount(async () => {");
  Write-Host "cargarUsuario insertado";
}

// 4. Reemplazar fetch '/api/v1/servicios' si existe
if (!s.includes("await apiGet('/servicios')")) {
  // Agregar fetch de servicios después de cargar usuario
  const fetchServicios = "\\t\\t\\tconst { items: servicios } = await apiGet('/servicios');\\n\\t\\t\\tif (servicios) items = servicios ?? items;\\n";
  if (s.includes("await fetch('/api/v1/servicios')")) {
    Write-Host "Ya usa fetch '/api/v1/servicios'";
  } else {
    Write-Host "No usa API fetch '/api/v1/servicios'";
  }
}

// Guardar
fs.writeFileSync(path, s, "utf8");
Write-Host "Guardado";
