# 01 · Problema, evidencia y producto

> **Pregunta que responde este documento:** ¿qué problema cotidiano peruano justifica una PWA de incidencias urbanas y qué debe hacer el MVP para resolverlo de verdad?

---

## 1. Resumen ejecutivo

En Lima y Callao, la vida cotidiana está atravesada por fallas urbanas que se repiten, se denuncian y no se cierran: pistas destruidas, basura acumulada, agua intermitente, transporte inseguro, extorsión y tráfico. La evidencia periodística y las encuestas de percepción coinciden en tres patrones:

1. **La gente sí reporta, pero por canales que no dejan trazabilidad.** Campañas como `#PasaEnLaCalle` reciben decenas de reportes con fotos, videos y ubicación en una semana; `#NoTePases` convierte videos ciudadanos en papeletas. El canal funciona, pero el caso no tiene número, estado ni plazo público.
2. **La inseguridad y el transporte son las preocupaciones dominantes.** No son "temas" abstractos: condicionan si una persona toma el bus, si su negocio abre, si su hijo llega a clase.
3. **La falla de gestión se concentra en la priorización.** Aun con reportes, la municipalidad no tiene una cola única, comparable y georreferenciada para decidir qué cuadrilla va primero.

Cuadra propone una capa simple sobre esa realidad: **reportar en menos de 90 segundos, incluso sin señal; obtener un código de caso; ver el estado y el plazo; y permitir que la municipalidad priorice con datos.**

---

## 2. Evidencia: qué dicen las fuentes

La siguiente tabla resume fuentes publicadas por **El Comercio** y dos fuentes primarias complementarias. Las cifras se citan tal como aparecen en la publicación; no se extrapolan.

| # | Fuente y fecha | Dato clave | Implicancia para el producto |
|---|---|---|---|
| E-01 | El Comercio, *El ranking de 'baches' de Lima: los 15 puntos más críticos reportados por lectores*, 10/11/2025. [URL](https://elcomercio.pe/lima/baches-eternos-en-lima-los-15-puntos-mas-criticos-reportados-por-usuarios-algunos-con-hasta-10-anos-de-deterioro-tlcnota-noticia/) | La campaña `#PasaEnLaCalle` recibió "decenas de denuncias con fotos, videos y la ubicación" en **una semana**; el equipo visitó los **15 puntos más dañados**; un punto de El Rímac lleva **10 años** deteriorado. | El reporte ciudadano con evidencia y ubicación ya existe; falta estructura, caso y seguimiento. |
| E-02 | El Comercio, *¿Cuáles son las principales preocupaciones de los vecinos de Lima y Callao?*, 16/01/2025. [URL](https://elcomercio.pe/lima/sucesos/inseguridad-ciudadana-y-un-deficiente-transporte-publico-los-principales-problemas-para-quienes-viven-en-lima-y-callao-noticia) | La **inseguridad ciudadana** es el principal problema para la calidad de vida; le sigue el **deficiente transporte público** (encuesta Lima Cómo Vamos 2024). | Dos de las categorías del MVP deben ser inseguridad (derivación) y transporte. |
| E-03 | El Comercio / IPE, *El 83% de limeños se siente inseguro en el transporte público*, 30/10/2025. [URL](https://elcomercio.pe/economia/extorsion-el-83-de-limenos-se-siente-inseguro-en-el-transporte-publico-noticia) | **83%** se siente inseguro en el transporte; **71 denuncias de extorsión por cada 100 mil personas** a agosto; **2.264 denuncias por extorsión al mes** entre enero y agosto de 2025, **7 veces más** que en 2019. | La sensación de inseguridad es masiva y medible; el producto debe permitir reportes sensibles sin exponer a la persona. |
| E-04 | El Comercio / Videnza Instituto, *Solo el 48% de los hogares urbanos recibe agua todo el día*, 27/08/2025. [URL](https://elcomercio.pe/economia/peru/solo-el-48-de-los-hogares-urbanos-recibe-agua-todo-el-dia-saneamiento-acceso-al-agua-tlcnota-noticia) | **48%** de hogares urbanos recibe agua todo el día; **38%** accede a agua con cloración adecuada; **más del 40%** consume agua sin cloro detectable. | El agua es una categoría de alta urgencia; el reporte debe distinguir "sin servicio" de "calidad". |
| E-05 | El Comercio, *Audiencia vecinal en San Juan de Miraflores*, 29/06/2025. [URL](https://elcomercio.pe/audiencias-vecinales/audiencia-vecinal-en-san-juan-de-miraflores-alcaldesa-delia-castro-responde-sobre-limpieza-riesgos-ante-sismos-y-seguridad-noticia) | Distrito de **430 mil habitantes**; el **recojo de basura** es uno de los desafíos más urgentes; en 2023 fue uno de los cuatro distritos cuyas autoridades salientes fueron denunciadas por el MINAM por no cumplir la recolección. | La limpieza pública necesita evidencia fotográfica, frecuencia y puntos críticos recurrentes. |
| E-06 | El Comercio, *Extorsionadores ya controlan más de 600 km de rutas de transporte*, 14/10/2025. [URL](https://elcomercio.pe/lima/extorsionadores-controlan-mas-de-600-kilometros-de-rutas-de-transporte-ya-se-registran-65-asesinatos-en-el-sector-mapa-noticia/) | Más de **600 km** de rutas bajo control de mafias; **65 trabajadores asesinados** en un año. | Los reportes de seguridad deben ser **confidenciales por defecto**, con canal separado y sin mapa público. |
| E-07 | El Comercio, *ATU envió al depósito a casi 2 mil vehículos informales*, 27/05/2025. [URL](https://elcomercio.pe/lima/atu-envio-al-deposito-a-casi-2-mil-vehiculos-informales-de-transporte-publico-en-lo-que-va-del-2025-ultimas-noticia) | **1.952 vehículos** informales enviados al depósito entre enero y mayo de 2025, **484 más** que en el mismo periodo de 2024. | El transporte informal es un flujo de fiscalización; el ciudadano puede aportar evidencia puntual. |
| E-08 | El Comercio / Datum, *El 76% se siente inseguro en las calles de su ciudad*, 28/09/2026. [URL](https://elcomercio.pe/politica/gobierno/el-76-se-siente-inseguro-en-las-calles-de-su-ciudad-segun-ultima-encuesta-de-datum-apuesplan-noticia) | **76%** se siente inseguro; **65%** percibe que la delincuencia aumentó en su distrito; **57%** cree que no hay estrategia de seguridad. | La percepción no baja con más apps, pero sí con respuesta visible y trazable. |
| E-09 | El Comercio / OMG, *63% de la población considera la inseguridad ciudadana como su mayor inquietud*, 20/03/2025. [URL](https://elcomercio.pe/economia/peru/omg-63-de-la-poblacion-considera-la-inseguridad-ciudadana-como-su-mayor-inquietud-i-ultimas-noticia/) | **63%** inseguridad; **53%** falta de trabajo; **43%** precios de la canasta; **40%** pobreza. | La propuesta debe ser barata, rápida y no exigir hardware ni datos abundantes. |
| E-10 | El Comercio, *Caos vehicular rodea centros comerciales de Lima*, 22/12/2025. [URL](https://elcomercio.pe/lima/caos-vehicular-rodea-centros-comerciales-de-lima-a-pocos-dias-de-navidad-que-hacen-las-autoridades-noticia) | Taxis cobrando **30 a 100 soles** por rutas que suelen costar menos de 20; Lima, **segunda ciudad con más tráfico de América Latina**. | El tráfico y la informalidad tarifaria son eventos reportables con hora y punto. |
| E-11 | El Comercio, *La Libertad: Gobierno despliega ayuda tras intensas lluvias e inundaciones*, 30/03/2025. [URL](https://elcomercio.pe/peru/la-libertad/la-libertad-gobierno-despliega-ayuda-tras-intensas-lluvias-e-inundaciones-ultimas-noticia) | Lluvias e inundaciones afectaron varios distritos de Trujillo; Indeci, PNP y Ejército limpiaron viviendas y calles. | El producto debe funcionar en emergencia: sin señal, con batería baja y con reportes masivos. |
| E-12 | El Comercio, *Papeleta ciudadana: volvemos a recibir tus denuncias*, 31/12/2025. [URL](https://elcomercio.pe/lima/volvemos-a-recibir-tus-denuncias-de-vehiculos-invasores-de-la-auxiliar-de-la-panamericana-sur-papeletas-ciudadanas-via-auxiliar-de-la-panamericana-sur-sutran-soat-mapfre-noticia) | Tercer año de la campaña `#NoTePases`; videos ciudadanos se convierten en denuncias ante la Sutran; meta de **más de 1.000 reportes** en verano. | El modelo "evidencia ciudadana → expediente" es viable y ya se practica. |
| E-13 | Lima Cómo Vamos, *Reporte urbano de percepción ciudadana, edición 15* (PDF), enero 2026. [URL](https://www.limacomovamos.org/wp-content/uploads/2026/01/EncuestaLCV2025.pdf) | **75,2%** señala la inseguridad como problema más importante; **22,2%** la limpieza pública; **18,0%** los arbitrios; **28,0%** del nivel E señala la falta de agua. | Refuerza que la priorización debe ser territorial y por nivel socioeconómico, no un promedio único. |
| E-14 | ComexPerú, *Desafíos de inseguridad, transporte y gestión de residuos en Lima y Callao*, 24/01/2025. [URL](https://www.comexperu.org.pe/articulo/desafios-de-inseguridad-transporte-y-gestion-de-residuos-en-lima-y-callao) | **80,2%** inseguridad; **34,2%** calidad del transporte; **54,6%** insatisfacción con la gestión de basura. | La basura es el tercer eje de insatisfacción y el más "reportable" con foto. |

> **Nota metodológica:** los artículos de El Comercio pueden estar total o parcialmente detrás de paywall. Se citan por su valor probatorio y por la fecha de publicación; las cifras provienen del resumen público y de la fuente primaria cuando está disponible. No se usan como indicadores operativos del producto, sino como evidencia de contexto.

---

## 3. Árbol del problema

```text
Efecto: la falla urbana persiste y el ciudadano pierde confianza en el reporte.
│
├─ Consecuencia: no hay cierre visible ni rendición de cuentas.
│  └─ Causa: el caso no tiene ID, estado, responsable ni plazo.
│
├─ Consecuencia: la municipalidad no prioriza bien.
│  └─ Causa: los reportes llegan por WhatsApp, teléfono, redes y papel, sin georreferenciación ni deduplicación.
│
├─ Consecuencia: el ciudadano deja de reportar.
│  └─ Causa: reportar cuesta tiempo, datos y confianza; no hay respuesta.
│
└─ Consecuencia: la evidencia se pierde o se expone.
   └─ Causa: fotos sin metadatos controlados, ubicaciones exactas y canales informales.
```

---

## 4. Personas (compuestas, no reales)

| Persona | Contexto | Necesidad | Fricción actual | Éxito para ella |
|---|---|---|---|---|
| **Rosa, 38** — comerciante, San Juan de Lurigancho | Android de gama baja, plan de datos limitado, camina la misma cuadra todos los días | Que arreglen el desagüe que inunda su vereda | No sabe a qué área llamar; le piden ir presencialmente; no tiene número de caso | Reporta en 60 s desde la vereda y recibe un código; ve "en revisión" sin volver a llamar |
| **Luis, 27** — conductor de combi, Lima Norte | Trabaja 12 h, celular con batería justa, miedo a represalias | Denunciar extorsión sin exponerse | Los canales formales son lentos y públicos | Reporta de forma confidencial, con evidencia, y recibe un canal seguro de seguimiento |
| **Ana, 34** — operadora de triaje municipal | Cola de 300 reportes por turno, Excel y WhatsApp Web | Priorizar por riesgo y duplicados | No sabe qué reportes son el mismo punto; no ve SLA | Bandeja única con mapa, duplicados agrupados y semáforo de plazo |
| **Jorge, 45** — subgerente de limpieza | Presupuesto fijo, cuadrillas limitadas | Demostrar impacto y priorizar puntos críticos | Reportes dispersos y sin frecuencia | Mapa de calor de puntos recurrentes y reporte mensual exportable |

---

## 5. Jobs to be done

1. **Cuando veo un problema en mi cuadra, quiero reportarlo en menos de 90 segundos, sin explicar mi vida, para que quede registro y alguien responda.**
2. **Cuando no tengo señal, quiero que el reporte se guarde y se envíe solo después, para no perder la evidencia.**
3. **Cuando reporto, quiero un código y un estado, para saber si avanzó o si tengo que insistir.**
4. **Cuando soy operador, quiero ver duplicados y prioridad, para no mandar dos cuadrillas al mismo hueco.**
5. **Cuando soy analista, quiero exportar datos y tiempos, para rendir cuentas y presupuestar.**

---

## 6. Alternativas actuales y por qué no bastan

| Alternativa | Fortaleza | Falla estructural |
|---|---|---|
| Campañas de WhatsApp (`#PasaEnLaCalle`, `#NoTePases`) | Fricción bajísima; la gente ya usa WhatsApp; evidencia rica | El caso vive en un chat; no hay ID, estado, SLA ni base consultable |
| Call center municipal | Canal humano; permite casos complejos | Horario limitado; no hay evidencia visual; registros incompletos |
| Apps municipales | Marca institucional | Fragmentadas por distrito; mala experiencia; poca adopción; sin offline |
| Redes sociales | Viralidad y presión | Sin privacidad; sin expediente; sin métricas comparables |
| Presencial / papel | Formalidad | Costo de traslado; colas; exclusión de personas que trabajan |

**Conclusión:** no falta un canal para "quejarse"; falta una **infraestructura de caso** que conecte evidencia, territorio, responsable y plazo.

---

## 7. Propuesta de producto

### 7.1 Promesa

> **"Reporta tu cuadra en 60 segundos. Sin señal también. Con número de caso y estado visible."**

### 7.2 Principios

1. **60 segundos o menos.** Categoría, foto, ubicación y una frase. Nada más obligatorio.
2. **Offline por defecto.** El reporte se guarda localmente y se sincroniza; la falta de red no es un error del usuario.
3. **Evidencia mínima suficiente.** Una foto comprimida y una ubicación aproximada bastan para triaje.
4. **Privacidad por diseño.** Sin DNI, sin nombre obligatorio, sin ubicación exacta pública, sin reconocimiento facial.
5. **Trazabilidad radical.** Todo reporte tiene ID, línea de tiempo y responsable.
6. **No gamificar la inseguridad.** Nada de rankings de "zonas peligrosas" públicos ni puntos por denunciar.
7. **Accesible y liviano.** Funciona en Android de gama baja, con datos limitados y lector de pantalla.

### 7.3 Alcance del MVP (piloto en un distrito)

**Incluye**

- Reporte de 6 categorías: pistas/baches, limpieza/basura, alumbrado, agua/alcantarillado, transporte/tráfico, espacios públicos.
- Foto (1–3), ubicación GPS o selección en mapa, descripción corta, categoría y severidad percibida.
- Funcionamiento offline con cola de salida y reintentos.
- Código de caso y línea de tiempo de estados.
- Confirmaciones "también me pasa" (solo conteo, sin comentarios públicos).
- Panel municipal: bandeja, mapa, duplicados, asignación, cambio de estado, SLA.
- API `/api/v1` documentada con OpenAPI 3.1 y Swagger UI.
- Analítica básica: reportes por categoría, tiempo a triaje, tiempo a cierre, duplicados.

**No incluye (explícito)**

- Apps nativas iOS/Android.
- Chat ciudadano–municipio.
- Pagos, arbitrios o multas.
- Reconocimiento facial, placas o IA de imágenes en producción.
- Integración directa con centrales de emergencia (911).
- Mapa público de delitos.
- Multi-ciudad simultánea (se diseña multi-tenant, pero se pilota en una).

### 7.4 Fuera de alcance por riesgo ético

- Publicar ubicaciones exactas de reportes de seguridad o violencia.
- Identificar a personas en fotos.
- Crear "scores" de barrios o de personas.
- Compartir datos con terceros sin base legal.

---

## 8. Métricas

### North Star

**% de reportes que reciben primera respuesta institucional en ≤ 72 h y cierre o derivación verificable en ≤ 30 días.**

Es una métrica de resultado, no de vanidad: mide si el sistema cambia la realidad, no si la app se descarga.

### Métricas de producto

| Métrica | Definición | Objetivo MVP |
|---|---|---|
| Tiempo de reporte | Mediana desde abrir el formulario hasta confirmar | ≤ 90 s |
| Éxito offline | % de reportes creados sin red que se sincronizan en 24 h | ≥ 98% |
| Duplicados | % de reportes agrupados como duplicados | ≤ 15% |
| Primera respuesta | Mediana de horas a triaje | ≤ 72 h |
| Cierre | % de casos cerrados o derivados con evidencia en 30 días | ≥ 60% |
| Retención | % de usuarios con caso abierto que vuelve a la semana 4 | ≥ 25% |
| Accesibilidad | Lighthouse Accessibility | ≥ 95 |
| PWA | Instalable y funciona offline en Android/iOS | 100% de flujos críticos |

### Guardrails

- **Privacidad:** 0 ubicaciones exactas públicas; 0 datos personales obligatorios.
- **Seguridad:** 0 reportes sensibles visibles en mapa público.
- **Sesgo:** monitorear cobertura por distrito y nivel socioeconómico; evitar que solo reporten quienes tienen datos.
- **Carga operativa:** no superar la capacidad de triaje del piloto; si se supera, comunicar tiempos reales.

---

## 9. Modelo de sostenibilidad

| Vía | Descripción | Riesgo |
|---|---|---|
| Convenio municipal | El municipio paga por panel, SLA y soporte | Dependencia política |
| ONG / cooperación | Financia piloto y evaluación de impacto | Ciclos cortos |
| Datos abiertos | Publicación agregada y anonimizada | Reidentificación si no se agrega bien |
| Servicios | API para terceros con límites y contrato | Uso comercial no previsto |

Regla: **el ciudadano nunca paga y nunca es el producto.** La monetización no puede basarse en vender datos personales.

---

## 10. Riesgos éticos y de seguridad

| Riesgo | Ejemplo | Mitigación |
|---|---|---|
| Vigilancia | Mapa público que revela quién reportó | Reportes sensibles fuera del mapa; ubicación ofuscada; seudónimos |
| Exposición | Foto con rostro o placa | Difuminado en el dispositivo antes de subir; revisión humana |
| Represalia | Reporte de extorsión en zona controlada | Canal confidencial, sin geolocalización exacta, cifrado y acceso restringido |
| Sesgo de cobertura | Solo reportan distritos con conectividad | Canal SMS/WhatsApp, agentes territoriales, ponderación por cobertura |
| Falsa denuncia | Reportes coordinados contra un negocio | Límites por dispositivo, reputación, deduplicación y verificación |
| Doxxing | Comentarios públicos | Sin comentarios públicos en MVP; solo conteo de confirmaciones |

---

## 11. Cómo citar esta evidencia

Formato sugerido para documentos internos y presentaciones:

> El Comercio. (2025, 10 de noviembre). *El ranking de 'baches' de Lima: los 15 puntos más críticos reportados por lectores de El Comercio*. https://elcomercio.pe/…

En presentaciones, incluir siempre: **medio, fecha, título y enlace**. No usar la cifra sin el contexto (por ejemplo, "83% se siente inseguro en el transporte" no equivale a "83% fue víctima").

---

## 12. Preguntas abiertas para validar con el piloto

1. ¿Qué categoría concentra más reportes y cuál tiene mejor tasa de cierre?
2. ¿El código de caso basta para confiar, o se necesita notificación push/SMS?
3. ¿La ubicación aproximada es suficiente para que la cuadrilla encuentre el punto?
4. ¿Los operadores prefieren bandeja, mapa o ambas?
5. ¿Cuánto influye el idioma y la redacción en la calidad del reporte?
6. ¿Qué pasa cuando el municipio no tiene capacidad de respuesta? ¿Es mejor no prometer SLA?

Las respuestas deben registrarse en `docs/` como decisiones o ajustes al backlog, no en chats sueltos.
