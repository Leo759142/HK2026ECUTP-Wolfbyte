# AYNI · Hoy por ti, mañana por mí

App vecinal (PWA móvil) para conseguir **servicios recomendados por vecinos**, hacer **favores sin dinero** y **coordinar ayuda en emergencias**. Hecha con **React + Vite + Tailwind CSS**. Toda la información se guarda en el navegador con **localStorage** (CRUD completo, funciona sin conexión).

## Cómo abrirla en Visual Studio Code

1. Instala [Node.js](https://nodejs.org) versión 18 o superior.
2. Descomprime la carpeta `ayni-app` y ábrela en VS Code (**Archivo → Abrir carpeta**).
3. Abre la terminal de VS Code (**Ver → Terminal**) y ejecuta:

```bash
npm install
npm run dev
```

4. Abre el enlace que aparece (normalmente `http://localhost:5173`). Para verla como celular, presiona `F12` en Chrome y activa la vista móvil (ícono de teléfono).
   - Como `dev` usa `--host`, también aparece una dirección tipo `http://192.168.x.x:5173` para abrirla desde un celular en la misma red Wi‑Fi.
5. Para la versión final: `npm run build` y luego `npm run preview` (esta versión activa el modo sin conexión de la PWA).

Extensiones recomendadas en VS Code: **Tailwind CSS IntelliSense** y **ES7+ React snippets**.

## Probar rápido (para la presentación)

- En la portada toca **"Entrar como vecina de prueba (Rosa)"**: entra con datos de ejemplo ya cargados.
- El código SMS de prueba es **1234** (en producción llegaría por SMS).
- En **Yo → 🧪 Herramientas de demostración** hay interruptores para el jurado:
  - **Simular sin conexión**: lo que publiques queda "🕓 Pendiente de enviar" y se publica solo al volver la señal.
  - **Ver AYNI como Guardián**: para confirmar emergencias y moderar desde el mismo celular.
  - **Simular 2 meses en AYNI**: aparece la invitación automática para ser Guardián.
  - **Reiniciar datos de demostración**: vuelve a los datos de ejemplo.
- Recorrido de emergencia: Inicio → "¿Pasa algo grave?" → elegir tipo → Enviar → (como Guardián) Panel del Guardián → Confirmar → aparece la alerta → "Necesito ayuda" → Mapa → Grupos → Panel → "Marcar emergencia como atendida".
- Si abres la app en **dos pestañas** del mismo navegador, los cambios se sincronizan entre ellas.

## Estructura del código

```
src/
├── main.jsx          Punto de entrada (carga datos de ejemplo y la PWA)
├── App.jsx           Lista de pantallas, barra inferior y avisos a pantalla completa
├── AppContext.jsx    Estado global: sesión, navegación, idioma, online/offline, emergencia
├── storage.js        ⭐ Persistencia CRUD en localStorage (db + hooks)
├── seed.js           Datos de ejemplo (sector, vecinos, servicios, favores, grupos)
├── data.js           Catálogos y reglas (categorías, etiquetas, 1 hora de reserva, 2 meses…)
├── i18n.js           Textos en español, inglés y quechua
├── util.js           Funciones de apoyo (Balance de Ayni, distancias, fotos…)
├── ui.jsx            Componentes reutilizables (botones, campos, chips, hojas…)
└── screens/
    ├── Acceso.jsx    Portada, tutorial, número, código, nombre, ubicación, zona, crear sector
    ├── Servicios.jsx Inicio, resultados, perfil de servicio, ¿te atendió?, Visto Bueno
    ├── Favores.jsx   Cadena de Favores, detalle, Mis publicaciones, favor cerrado
    ├── Publicar.jsx  Formularios del botón "+" (crear y editar)
    ├── Perfil.jsx    Mi perfil, ajustes, Guardianes, panel de moderación, reportar
    ├── Emergencia.jsx Reportar, confirmación, alerta, pedir ayuda, grupos, fin
    └── Mapa.jsx      Mapa del sector (normal y emergencia)
```

## Cómo funciona la persistencia (localStorage)

Cada colección es un arreglo JSON guardado con la clave `ayni:v1:<colección>`. Las pantallas nunca tocan `localStorage` directamente:

```js
import { db, useCollection } from './storage';

const favores = useCollection('favors');          // READ (se actualiza solo)
db.create('favors', { tipo: 'presto', titulo: 'Escalera' }); // CREATE
db.update('favors', id, { status: 'reservado' }); // UPDATE
db.remove('favors', id);                          // DELETE
```

| Colección | Qué guarda |
|---|---|
| `users` | Vecinos (nombre, celular, sector, manzana, fecha de ingreso) |
| `sectors` | Sectores con sus manzanas y la lista de Guardianes |
| `services` | Oficios y productos ofrecidos (el "anuncio" de cada vecino) |
| `recommendations` | Vistos Buenos con sus etiquetas y comentarios |
| `contacts` | Quién escribió a quién por WhatsApp (para preguntar "¿Te atendió?") |
| `favors` | Cadena de Favores: pido, presto, regalo, intercambio y su estado |
| `reports` | Reportes de publicaciones (con 3 se ocultan solas) |
| `emergencies` | Reportes de emergencia: pendiente → activa / descartada → atendida |
| `needs` | Pedidos de ayuda durante una emergencia |
| `groups` | Directorio de grupos y servicios de apoyo |
| `session`, `settings`, `registro` | Sesión, idioma, letra grande y borrador del registro |

**Para pasar a un backend real** (Firebase, Supabase, API propia), basta con reemplazar `storage.js` manteniendo las mismas funciones; el resto de la app no cambia.

## Reglas del negocio implementadas

- Publicar en máximo **3 clics**: "+" → tipo → Publicar. La ubicación es la zona, nunca la dirección exacta.
- **Visto Bueno** solo de vecinos atendidos (tras escribir por WhatsApp y responder "Sí, me atendió"), una vez por servicio, de 1 a 6 etiquetas. Sin calificaciones negativas: se usa "Reportar".
- **Favores**: "Lo quiero / Puedo ayudar" abre WhatsApp y reserva por **1 hora**; se cierra cuando **ambos** tocan "Listo" y suma al **Balance de Ayni**.
- **Emergencia**: cualquier vecino reporta; se activa cuando **1 Guardián** confirma; quien reportó recibe la respuesta (confirmada o descartada con motivo); todos reciben la alerta; dura hasta que un Guardián la marca como **atendida**.
- **Guardianes**: invitación automática a los **2 meses**; quien crea un sector es su primer Guardián.
- **Estados PWA**: en línea (punto verde), sin conexión (cintillo) y pendiente (tarjeta con reloj).
- **Accesibilidad**: botones de 48–56 px, íconos con texto, opción de letra grande.
- **Rojo solo para emergencias.**

## Pendientes conocidos

- El SMS y la detección de sector por GPS están simulados.
- El quechua tiene pocos textos traducidos: validarlos con una persona quechuahablante.
- Al ser localStorage, cada celular tiene sus propios datos (para varios vecinos reales se necesita un backend).
