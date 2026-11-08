/* 2.4, 5.5–5.9 · Publicar en 3 clics: "+" → elegir tipo → Publicar.
 * Sirve para CREAR y para EDITAR (params editCol + editId). Sin señal, queda "pendiente". */
import { useState } from 'react';
import { useApp } from '../AppContext';
import { db } from '../storage';
import { CATEGORIAS } from '../data';
import { Btn, Field, H1, Header, Icon, Input, Pills, PhotoPicker, Screen, Segmented, Select, Sub, TextArea, Toggle } from '../ui';

const OPCIONES = [
  { id: 'servicio', emoji: '🛠️', titulo: 'Ofrezco producto o servicio', sub: 'Tu oficio, profesión o lo que vendes', bg: 'bg-ambar-claro' },
  { id: 'favor', emoji: '🤝', titulo: 'Ofrezco un favor', sub: 'Presto, regalo o intercambio', bg: 'bg-morado-claro' },
  { id: 'pido', emoji: '🙋', titulo: 'Necesito ayuda', sub: 'Pide algo a tus vecinos', bg: 'bg-petroleo-claro' },
];

function kindDe(editCol, item) {
  if (!item) return null;
  if (editCol === 'services') return 'servicio';
  return item.tipo === 'pido' ? 'pido' : 'favor';
}

export function Publicar({ kind: kindInicial, editCol, editId }) {
  const { user, online, replace, notify } = useApp();
  const existente = editId ? db.get(editCol, editId) : null;
  const [kind, setKind] = useState(kindDe(editCol, existente) ?? kindInicial ?? null);

  const guardar = (col, data) => {
    if (existente) {
      db.update(col, existente.id, { ...data, status: existente.status === 'pendiente' && online ? 'disponible' : existente.status });
      notify('✅ Cambios guardados');
    } else {
      db.create(col, { ...data, ownerId: user.id, status: online ? 'disponible' : 'pendiente', hidden: false });
      notify(online ? '✅ ¡Publicado! Tus vecinos ya lo pueden ver' : '🕓 Guardado. Se publicará cuando vuelvas a tener señal');
    }
    replace('misPublicaciones');
  };

  if (!kind) {
    return (
      <Screen>
        <Header title="Clic 2 de 3" />
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-1.5 flex-1 rounded-full bg-morado" />
          <span className="h-1.5 flex-1 rounded-full bg-morado" />
          <span className="h-1.5 flex-1 rounded-full bg-linea" />
        </div>
        <H1>¿Qué quieres publicar?</H1>
        {OPCIONES.map((o) => (
          <button key={o.id} type="button" onClick={() => setKind(o.id)} className="flex min-h-[84px] items-center gap-3.5 rounded-[20px] border-2 border-linea bg-white p-4 text-left active:border-morado">
            <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-2xl ${o.bg}`} aria-hidden="true">
              {o.emoji}
            </span>
            <span>
              <span className="block text-base font-black">{o.titulo}</span>
              <span className="block text-sm font-semibold text-gris">{o.sub}</span>
            </span>
          </button>
        ))}
        <p className="text-sm font-semibold text-gris">📍 Se usará tu zona: Mz. {user.manzana}. Nunca tu dirección exacta.</p>
      </Screen>
    );
  }

  const Form = { servicio: FormServicio, favor: FormFavor, pido: FormPido }[kind];
  return <Form item={existente} onSave={guardar} onBack={existente || kindInicial ? undefined : () => setKind(null)} editando={Boolean(existente)} />;
}

function Pie({ editando, valido, onClick }) {
  return (
    <>
      <div className="flex-1" />
      <Btn variant="acento" disabled={!valido} onClick={onClick}>
        {editando ? 'Guardar cambios' : 'Publicar ✓'}
      </Btn>
    </>
  );
}

/* ---------- 5.5 Ofrezco producto o servicio (también es el "anuncio" del vecino) ---------- */
function FormServicio({ item, onSave, onBack, editando }) {
  const { user } = useApp();
  const [clase, setClase] = useState(item?.clase ?? 'servicio');
  const [categoria, setCategoria] = useState(item?.categoria ?? 'gasfiteria');
  const [titulo, setTitulo] = useState(item?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? '');
  const [horario, setHorario] = useState(item?.horario ?? '');
  const [precio, setPrecio] = useState(item?.precio ?? '');
  const [foto, setFoto] = useState(item?.foto ?? null);
  const [showFullName, setShowFull] = useState(item?.showFullName ?? false);
  const valido = titulo.trim().length >= 3 && descripcion.trim().length >= 10 && horario.trim().length >= 2;

  return (
    <Screen className="gap-3">
      <Header title={editando ? 'Editar' : 'Clic 2 de 3'} onBack={onBack} />
      <H1>Ofrezco producto o servicio</H1>
      <Segmented options={[{ id: 'servicio', label: <><Icon name="fa-screwdriver-wrench" /> Servicio</> }, { id: 'producto', label: <><Icon name="fa-bag-shopping" /> Producto</> }]} value={clase} onChange={setClase} />
      <Field label="Categoría">
        <Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          {CATEGORIAS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={clase === 'servicio' ? '¿Cómo te presentas? (nombre corto)' : '¿Qué vendes? (nombre corto)'}>
        <Input value={titulo} maxLength={40} onChange={(e) => setTitulo(e.target.value)} placeholder={clase === 'servicio' ? 'Ej: Gasfitero' : 'Ej: Panes caseros'} />
      </Field>
      <Field label="Describe lo que ofreces">
        <TextArea value={descripcion} maxLength={200} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ej: Arreglo fugas, termas y desagües. 12 años de experiencia." />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Horario">
          <Input value={horario} onChange={(e) => setHorario(e.target.value)} placeholder="Lun–Sáb, 8am–6pm" />
        </Field>
        <Field label="Precio desde (opcional)">
          <Input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="S/ 30" />
        </Field>
      </div>
      <PhotoPicker value={foto} onChange={setFoto} />
      <Toggle checked={showFullName} onChange={setShowFull} label={`Mostrar mi nombre completo (${user.firstName} ${user.lastName})`} hint="Ayuda a que te encuentren y generen confianza" />
      <Pie editando={editando} valido={valido} onClick={() => onSave('services', { clase, categoria, titulo: titulo.trim(), descripcion: descripcion.trim(), horario: horario.trim(), precio: precio.trim(), foto, showFullName })} />
    </Screen>
  );
}

/* ---------- 5.6–5.8 Ofrezco un favor: Presto · Regalo · Intercambio ---------- */
function FormFavor({ item, onSave, onBack, editando }) {
  const d = item?.detalles ?? {};
  const [tipo, setTipo] = useState(item?.tipo ?? 'presto');
  const [que, setQue] = useState(item && item.tipo !== 'intercambio' ? item.titulo : '');
  const [duracion, setDuracion] = useState(d.duracion ?? '1 día');
  const [condicion, setCondicion] = useState(d.condicion ?? '');
  const [estado, setEstado] = useState(d.estado ?? 'Usado');
  const [cantidad, setCantidad] = useState(d.cantidad ?? '');
  const [ofrezco, setOfrezco] = useState(d.ofrezco ?? '');
  const [busco, setBusco] = useState(d.busco ?? '');
  const [foto, setFoto] = useState(item?.foto ?? null);

  const valido = tipo === 'intercambio' ? ofrezco.trim().length >= 3 && busco.trim().length >= 3 : que.trim().length >= 3;
  const publicar = () => {
    const base = { tipo, foto };
    if (tipo === 'presto') return onSave('favors', { ...base, titulo: que.trim(), detalles: { duracion, condicion: condicion.trim() } });
    if (tipo === 'regalo') return onSave('favors', { ...base, titulo: que.trim(), detalles: { estado, cantidad: cantidad.trim() } });
    return onSave('favors', { ...base, titulo: `${ofrezco.trim()} a cambio de ${busco.trim()}`, detalles: { ofrezco: ofrezco.trim(), busco: busco.trim() } });
  };

  return (
    <Screen className="gap-3">
      <Header title={editando ? 'Editar' : 'Clic 2 de 3'} onBack={onBack} />
      <H1>Ofrezco un favor</H1>
      <Segmented
        options={[
          { id: 'presto', label: '🔨 Presto' },
          { id: 'regalo', label: '🎁 Regalo' },
          { id: 'intercambio', label: '🔄 Intercambio' },
        ]}
        value={tipo}
        onChange={setTipo}
      />
      {tipo === 'presto' && (
        <>
          <Field label="¿Qué prestas?">
            <Input value={que} onChange={(e) => setQue(e.target.value)} placeholder="Ej: Escalera de 3 metros" />
          </Field>
          <Field label="¿Por cuánto tiempo?">
            <Pills options={['Unas horas', '1 día', 'Varios días']} value={duracion} onChange={setDuracion} />
          </Field>
          <Field label="Condición (opcional)">
            <Input value={condicion} onChange={(e) => setCondicion(e.target.value)} placeholder="Ej: Devolverla limpia, por favor 🙏" />
          </Field>
        </>
      )}
      {tipo === 'regalo' && (
        <>
          <Field label="¿Qué regalas?">
            <Input value={que} onChange={(e) => setQue(e.target.value)} placeholder="Ej: Ladrillos y una bolsa de cemento" />
          </Field>
          <Field label="¿En qué estado está?">
            <Pills options={['Nuevo', 'Usado', 'Sobrante']} value={estado} onChange={setEstado} />
          </Field>
          <Field label="Cantidad (opcional)">
            <Input value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Ej: 20 ladrillos, 1 bolsa" />
          </Field>
        </>
      )}
      {tipo === 'intercambio' && (
        <>
          <Field label="Lo que ofrezco">
            <Input value={ofrezco} onChange={(e) => setOfrezco(e.target.value)} placeholder="Ej: Clases de Excel (2 horas)" />
          </Field>
          <div className="text-center text-2xl text-morado" aria-hidden="true">🔄</div>
          <Field label="Lo que busco a cambio">
            <Input value={busco} onChange={(e) => setBusco(e.target.value)} placeholder="Ej: Que me enseñen a hacer pan" />
          </Field>
        </>
      )}
      <PhotoPicker value={foto} onChange={setFoto} />
      <Pie editando={editando} valido={valido} onClick={publicar} />
    </Screen>
  );
}

/* ---------- 5.9 Necesito ayuda (Pido) ---------- */
function FormPido({ item, onSave, onBack, editando }) {
  const d = item?.detalles ?? {};
  const [clase, setClase] = useState(d.clase ?? 'Favor');
  const [texto, setTexto] = useState(item?.titulo ?? '');
  const [cuando, setCuando] = useState(d.cuando ?? 'Hoy');
  const [foto, setFoto] = useState(item?.foto ?? null);
  return (
    <Screen className="gap-3">
      <Header title={editando ? 'Editar' : 'Clic 2 de 3'} onBack={onBack} />
      <H1>¿Qué necesitas?</H1>
      <Sub>Se publica en la Cadena de Favores. Tus vecinos responden con “Puedo ayudar”.</Sub>
      <Field label="Es un…">
        <Pills options={[{ id: 'Producto', label: <><Icon name="fa-bag-shopping" /> Producto</> }, { id: 'Servicio', label: <><Icon name="fa-screwdriver-wrench" /> Servicio</> }, { id: 'Favor', label: <><Icon name="fa-handshake" /> Favor</> }]} value={clase} onChange={setClase} />
      </Field>
      <Field label="Cuéntalo en pocas palabras">
        <TextArea value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: Necesito que alguien me preste un taladro para colgar una repisa." />
      </Field>
      <Field label="¿Para cuándo?">
        <Pills options={['Hoy', 'Esta semana', 'Sin apuro']} value={cuando} onChange={setCuando} />
      </Field>
      <PhotoPicker value={foto} onChange={setFoto} />
      <Pie editando={editando} valido={texto.trim().length >= 5} onClick={() => onSave('favors', { tipo: 'pido', titulo: texto.trim(), detalles: { clase, cuando }, foto })} />
    </Screen>
  );
}
