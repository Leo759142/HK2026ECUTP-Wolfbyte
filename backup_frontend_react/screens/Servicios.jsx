// @ts-nocheck

/* 2.1, 2.2, 5.1–5.4 · Inicio, búsqueda, perfil de servicio y Visto Bueno Vecinal. */
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { db, useCollection } from '../storage';
import { CATEGORIAS, ETIQUETAS, MAX_ETIQUETAS, catById, etiquetaById } from '../data';
import { abrirEnlace, cuadras, cuadrasTxt, hace, inicial, nombreVisible, normalizar, statsServicio, whatsappLink } from '../util';
import { Avatar, Btn, Card, Chip, ChipPendiente, Circle, ConnectionStatus, EmptyState, Field, H1, Header, Icon, LangChip, LinkBtn, Screen, Sheet, Sub, TextArea } from '../ui';
import { InicioEmergencia } from './Emergencia';

/** Servicios visibles con su dueño, Vistos Buenos y distancia. */
export function useServicios() {
  const { user } = useApp();
  const services = useCollection('services');
  const users = useCollection('users');
  const recs = useCollection('recommendations');
  return useMemo(
    () =>
      services
        .filter((s) => !s.hidden && (s.status === 'disponible' || (s.ownerId === user?.id && s.status !== 'oculto')))
        .map((s) => {
          const owner = users.find((u) => u.id === s.ownerId);
          return { ...s, owner, stats: statsServicio(s, recs), dist: cuadras(user?.manzana, owner?.manzana) };
        }),
    [services, users, recs, user]
  );
}

const ORDEN = {
  recomendados: (a, b) => b.stats.count - b.dist * 2 - (a.stats.count - a.dist * 2),
  cerca: (a, b) => a.dist - b.dist || b.stats.count - a.stats.count,
  vistos: (a, b) => b.stats.count - a.stats.count,
};

export function ServiceCard({ s, onClick }) {
  const cat = catById(s.categoria);
  const owner = nombreVisible(s.owner, s.showFullName);
  return (
    <Card onClick={onClick}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">
        {s.foto ? <img src={s.foto} alt="" className="h-full w-full object-cover" /> : cat.emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-base font-black leading-tight">
          {owner} · {s.titulo}
        </div>
        <div className="text-sm font-semibold text-gris">
          📍 {cuadrasTxt(s.dist)} · {s.horario}
        </div>
        <div className="flex flex-wrap gap-1">
          {s.stats.count > 0 ? (
            <Chip className="bg-morado-claro text-morado-osc">
              👍 {s.stats.count}
              {s.stats.topTags.slice(0, 2).map((t) => ` · ${etiquetaById(t.id)?.label}`)}
            </Chip>
          ) : (
            <Chip className="bg-linea text-gris">Nuevo en AYNI</Chip>
          )}
          {s.clase === 'producto' && <Chip className="bg-ambar-claro text-tinta">🛍️ Producto</Chip>}
          {s.status === 'pendiente' && <ChipPendiente />}
          {s.status === 'pausado' && <Chip className="bg-linea text-gris">⏸️ Pausado</Chip>}
        </div>
      </div>
    </Card>
  );
}

/* ---------- 2.1 Inicio ---------- */
export function Inicio() {
  const { user, sector, t, go, reset, activeEmergency } = useApp();
  const servicios = useServicios();
  const [query, setQuery] = useState('');
  const top = useMemo(() => [...servicios].filter((s) => s.ownerId !== user?.id).sort(ORDEN.recomendados).slice(0, 3), [servicios, user]);

  if (activeEmergency) return <InicioEmergencia />;

  return (
    <Screen>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-gris">
            📍 {sector?.name} · Mz. {user?.manzana}
          </div>
          <h1 className="text-2xl font-black leading-tight">
            {t('hola')}, {user?.firstName}! 👋
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LangChip />
          <button type="button" aria-label="Mi perfil" onClick={() => reset('perfil')}>
            <Avatar letter={inicial(user)} className="h-12 w-12 bg-ambar text-lg" />
          </button>
        </div>
      </div>
      <ConnectionStatus />
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go('resultados', { query });
        }}
        className="flex min-h-[54px] items-center gap-2 rounded-2xl border-2 border-linea bg-white px-4 focus-within:border-morado"
      >
            <span aria-hidden="true"><Icon name="fa-magnifying-glass" /></span>
        <input aria-label={t('buscar')} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('buscar')} className="min-h-[50px] flex-1 bg-transparent text-base font-semibold placeholder:text-gris focus:outline-none" />
      </form>
      <button type="button" onClick={() => go('reportarEmergencia')} className="flex min-h-[52px] items-center gap-2 rounded-2xl border-2 border-dashed border-rojo bg-white px-4 text-left text-sm font-extrabold text-rojo">
        ⚠️ {t('reportar')}
      </button>

      <h2 className="text-lg font-black">{t('oficios')}</h2>
      <div className="grid grid-cols-4 gap-2.5">
        {CATEGORIAS.slice(0, 7).map((c) => (
          <button key={c.id} type="button" onClick={() => go('resultados', { category: c.id })} className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold leading-tight">
            <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => go('resultados', {})} className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl border border-linea bg-white text-[11px] font-extrabold">
          <span className="text-2xl" aria-hidden="true"><Icon name="fa-plus" /></span>
          Ver todo
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black">{t('recomendados')}</h2>
        <button type="button" onClick={() => reset('mapa')} className="min-h-[48px] px-1 text-sm font-extrabold text-petroleo">
          Ver mapa
        </button>
      </div>
      {top.map((s) => (
        <ServiceCard key={s.id} s={s} onClick={() => go('servicio', { id: s.id })} />
      ))}

      <button type="button" onClick={() => go('publicar', { kind: 'servicio' })} className="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-4 text-left">
          <span className="text-3xl" aria-hidden="true"><Icon name="fa-screwdriver-wrench" /></span>
        <span className="flex-1">
          <span className="block font-black text-morado-osc">¿Tienes un oficio o vendes algo?</span>
          <span className="block text-sm font-semibold text-morado-osc">Ofrécelo a tus vecinos en 3 clics.</span>
        </span>
      </button>
      <AtendioSheet />
    </Screen>
  );
}

/* ---------- 5.2 ¿Te atendió? (solo quien fue atendido puede dar Visto Bueno) ---------- */
function AtendioSheet() {
  const { user, go } = useApp();
  const contacts = useCollection('contacts');
  const servicios = useServicios();
  const [omitidos, setOmitidos] = useState([]);
  // Demo: aparece al volver al Inicio. En producción, al día siguiente del contacto.
  const contacto = contacts.find((c) => c.userId === user?.id && !c.answered && !omitidos.includes(c.id));
  const s = servicios.find((x) => x.id === contacto?.serviceId);
  if (!contacto || !s) return null;
  const responder = (attended) => db.update('contacts', contacto.id, { answered: true, attended });

  return (
    <Sheet onClose={() => setOmitidos([...omitidos, contacto.id])}>
      <Circle emoji={catById(s.categoria).emoji} className="h-20 w-20 bg-ambar-claro !text-4xl" />
      <h2 className="text-center text-xl font-black">¿Te atendió {nombreVisible(s.owner, true)}?</h2>
      <p className="text-center text-[15px] font-semibold text-gris">
        Le escribiste por WhatsApp {hace(contacto.createdAt)} por: {s.titulo}.
      </p>
      <Btn
        onClick={() => {
          responder(true);
          go('vistoBueno', { id: s.id });
        }}
      >
        Sí, me atendió
      </Btn>
      <Btn variant="borde" onClick={() => setOmitidos([...omitidos, contacto.id])}>
        Todavía no
      </Btn>
      <LinkBtn className="!text-gris" onClick={() => responder(false)}>
        No me atendió
      </LinkBtn>
    </Sheet>
  );
}

/* ---------- 5.1 Resultados de búsqueda ---------- */
export function Resultados({ category, query = '' }) {
  const { go } = useApp();
  const servicios = useServicios();
  const [orden, setOrden] = useState('recomendados');
  const [q, setQ] = useState(query);
  const cat = category ? catById(category) : null;

  const lista = useMemo(() => {
    const term = normalizar(q);
    return servicios
      .filter((s) => !cat || s.categoria === cat.id)
      .filter((s) => !term || [s.titulo, s.descripcion, catById(s.categoria).label, s.owner?.firstName].some((v) => normalizar(v).includes(term)))
      .sort(ORDEN[orden]);
  }, [servicios, cat, q, orden]);

  return (
    <Screen className="gap-3">
      <Header title="Resultados" />
      <H1>{cat ? `${cat.emoji} ${cat.label} cerca de ti` : 'Servicios y productos del barrio'}</H1>
      <input aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar por oficio o nombre" className="min-h-[52px] rounded-2xl border-2 border-linea bg-white px-4 font-semibold focus:border-morado focus:outline-none" />
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Ordenar">
        {[
          ['recomendados', '⭐ Recomendados cerca'],
          ['cerca', '📍 Más cercanos'],
          ['vistos', '👍 Más recomendados'],
        ].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={orden === id} onClick={() => setOrden(id)} className={`min-h-[44px] rounded-full border-2 px-3 text-xs font-extrabold ${orden === id ? 'border-petroleo bg-petroleo text-white' : 'border-linea bg-white text-tinta'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="text-sm font-semibold text-gris">{lista.length} resultado(s) en tu sector</div>
      {lista.map((s) => (
        <ServiceCard key={s.id} s={s} onClick={() => go('servicio', { id: s.id })} />
      ))}
      {lista.length === 0 && (
        <EmptyState emoji="🔎" title="Aún no hay nadie con ese oficio">
          Pídelo en la Cadena de Favores: quizá un vecino puede ayudarte.
          <Btn variant="acento" className="mt-3" onClick={() => go('publicar', { kind: 'pido' })}>
            Pedir ayuda a mis vecinos
          </Btn>
        </EmptyState>
      )}
    </Screen>
  );
}

/* ---------- 2.2 Perfil de servicio ---------- */
export function PerfilServicio({ id }) {
  const { user, go, notify } = useApp();
  const servicios = useServicios();
  const recs = useCollection('recommendations');
  const contacts = useCollection('contacts');
  const users = useCollection('users');
  const s = servicios.find((x) => x.id === id);

  if (!s) {
    return (
      <Screen>
        <Header />
        <EmptyState emoji="🙈" title="Esta publicación ya no está disponible" />
      </Screen>
    );
  }

  const cat = catById(s.categoria);
  const mine = s.ownerId === user.id;
  const atendido = contacts.some((c) => c.serviceId === id && c.userId === user.id && c.attended);
  const yaDio = recs.some((r) => r.serviceId === id && r.userId === user.id);

  const contactar = () => {
    if (!contacts.some((c) => c.serviceId === id && c.userId === user.id && !c.answered)) {
      db.create('contacts', { serviceId: id, userId: user.id, answered: false });
    }
    abrirEnlace(whatsappLink(s.owner.phone, `Hola ${s.owner.firstName}, te vi en AYNI. Me interesa: ${s.titulo}.`));
  };

  const darVistoBueno = () => {
    if (yaDio) return notify('Ya le diste tu Visto Bueno 💜');
    if (!atendido) return notify('Podrás recomendarlo cuando te haya atendido. Primero escríbele por WhatsApp.');
    return go('vistoBueno', { id });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative rounded-b-[28px] bg-petroleo px-5 pb-14 pt-3">
        <Header light right={!mine && <LinkBtn className="!w-auto px-2 !text-white/90" onClick={() => go('reportar', { col: 'services', id })}><Icon name="fa-flag" /> Reportar</LinkBtn>} />
        <div className="absolute -bottom-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-ambar text-5xl" aria-hidden="true">
          {s.foto ? <img src={s.foto} alt="" className="h-full w-full object-cover" /> : cat.emoji}
        </div>
      </div>
      <Screen className="pt-16">
        <div>
          <H1>{nombreVisible(s.owner, s.showFullName)}</H1>
          <Sub>
            {s.titulo} · {cat.label} · 📍 {cuadrasTxt(s.dist)}
          </Sub>
        </div>
        <div>
          <Chip className="bg-morado-claro px-4 py-2 text-sm text-morado-osc">✅ Visto Bueno Vecinal · {s.stats.count} vecinos</Chip>
        </div>
        <p className="text-[15px] font-semibold">{s.descripcion}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-linea bg-white p-3 text-center">
            <div className="text-lg font-black">{s.precio || 'A tratar'}</div>
            <div className="text-xs font-bold text-gris">{s.clase === 'producto' ? 'precio' : 'desde'}</div>
          </div>
          <div className="rounded-2xl border border-linea bg-white p-3 text-center">
            <div className="text-base font-black leading-tight">{s.horario}</div>
            <div className="text-xs font-bold text-gris">horario</div>
          </div>
        </div>
        {s.stats.topTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {s.stats.topTags.map((tag) => {
              const e = etiquetaById(tag.id);
              return e ? (
                <Chip key={tag.id} className="bg-white text-tinta ring-1 ring-linea">
                  {e.emoji} {e.label} · {tag.count}
                </Chip>
              ) : null;
            })}
          </div>
        )}
        {s.stats.comentarios.length > 0 && (
          <>
            <h2 className="text-base font-black">Lo que dicen tus vecinos</h2>
            {s.stats.comentarios.slice(0, 5).map((r) => {
              const autor = users.find((u) => u.id === r.userId);
              return (
                <div key={r.id} className="rounded-2xl border border-linea bg-white p-3 text-sm">
                  <b>
                    {nombreVisible(autor)}, Mz. {autor?.manzana}
                  </b>{' '}
                  · “{r.comment}”
                </div>
              );
            })}
          </>
        )}
        <div className="flex-1" />
        {mine ? (
          <Btn onClick={() => go('publicar', { editCol: 'services', editId: id })}>✏️ Editar mi publicación</Btn>
        ) : (
          <>
            <Btn variant="wa" onClick={contactar}>
              💬 Escribir por WhatsApp
            </Btn>
            <Btn variant="borde" onClick={darVistoBueno}>
              {yaDio ? '💜 Ya lo recomendaste' : '👍 Dar mi Visto Bueno'}
            </Btn>
            <p className="text-center text-xs font-semibold text-gris">🔒 El número no se muestra; WhatsApp se abre con un mensaje listo.</p>
          </>
        )}
      </Screen>
    </div>
  );
}

/* ---------- 5.3 Dar Visto Bueno (1 a 6 etiquetas, solo positivo) ---------- */
export function DarVistoBueno({ id }) {
  const { user, replace } = useApp();
  const servicios = useServicios();
  const contacts = useCollection('contacts');
  const recs = useCollection('recommendations');
  const [tags, setTags] = useState([]);
  const [comment, setComment] = useState('');
  const s = servicios.find((x) => x.id === id);
  const permitido = s && contacts.some((c) => c.serviceId === id && c.userId === user.id && c.attended) && !recs.some((r) => r.serviceId === id && r.userId === user.id);

  if (!permitido) {
    return (
      <Screen>
        <Header />
        <EmptyState emoji="🤝" title="Aún no puedes recomendar este servicio">
          Solo pueden dar Visto Bueno los vecinos que fueron atendidos (y una sola vez).
        </EmptyState>
      </Screen>
    );
  }

  const toggle = (tagId) => setTags((cur) => (cur.includes(tagId) ? cur.filter((x) => x !== tagId) : cur.length < MAX_ETIQUETAS ? [...cur, tagId] : cur));
  const enviar = () => {
    db.create('recommendations', { serviceId: id, userId: user.id, tags, comment: comment.trim() });
    replace('gracias', { id });
  };

  return (
    <Screen>
      <Header title="Elige de 1 a 6" />
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ambar-claro text-3xl" aria-hidden="true">
          {catById(s.categoria).emoji}
        </span>
        <div>
          <div className="font-black">{nombreVisible(s.owner, true)}</div>
          <div className="text-sm font-semibold text-gris">
            {s.titulo} · {cuadrasTxt(s.dist)}
          </div>
        </div>
      </div>
      <H1>¿Qué destacas de {s.owner.firstName}?</H1>
      <div className="grid grid-cols-2 gap-2.5">
        {ETIQUETAS.map((e) => {
          const on = tags.includes(e.id);
          return (
            <button key={e.id} type="button" aria-pressed={on} onClick={() => toggle(e.id)} className={`flex min-h-[56px] items-center gap-2 rounded-2xl border-2 px-3 text-left text-sm font-extrabold ${on ? 'border-morado bg-morado-claro text-morado-osc' : 'border-linea bg-white'}`}>
              <span className="text-xl" aria-hidden="true">{e.emoji}</span>
              <span className="flex-1">{e.label}</span>
              {on && <span aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="text-sm font-bold text-morado-osc">{tags.length} de 6 elegidas</div>
      <Field label="Comentario (opcional)">
        <TextArea value={comment} maxLength={140} onChange={(e) => setComment(e.target.value)} placeholder="Ej: Llegó en 20 minutos y cobró lo justo." />
      </Field>
      <p className="text-xs font-semibold text-gris">¿Tuviste una mala experiencia? No hay calificaciones negativas: usa “Reportar” y lo revisará un Guardián.</p>
      <div className="flex-1" />
      <Btn variant="acento" disabled={tags.length === 0} onClick={enviar}>
        👍 Dar mi Visto Bueno
      </Btn>
    </Screen>
  );
}

/* ---------- 5.4 Gracias por recomendar ---------- */
export function Gracias({ id }) {
  const { reset } = useApp();
  const s = useServicios().find((x) => x.id === id);
  return (
    <Screen className="text-center">
      <div className="flex-1" />
      <Circle emoji="💜" className="bg-morado-claro" />
      <H1>¡Gracias por recomendar!</H1>
      <Sub>Tu Visto Bueno ayuda a tus vecinos a encontrar gente de confianza cerca de casa.</Sub>
      {s && (
        <div>
          <Chip className="bg-morado-claro px-4 py-2 text-sm text-morado-osc">
            👍 Ahora {s.stats.count} vecinos recomiendan a {s.owner.firstName}
          </Chip>
        </div>
      )}
      <div className="flex-1" />
      <Btn onClick={() => reset('inicio')}>Volver al inicio</Btn>
    </Screen>
  );
}
