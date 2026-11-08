/* 2.3, 6.1–6.4 · Cadena de Favores: muro, detalle, reserva por 1 hora,
 * cierre confirmado por ambas partes, Mis publicaciones y Balance de Ayni. */
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { db, useCollection } from '../storage';
import { RESERVA_MS, TIPOS_FAVOR } from '../data';
import { abrirEnlace, balanceAyni, cuadras, cuadrasTxt, hace, nombreVisible, whatsappLink } from '../util';
import { Btn, Chip, ChipPendiente, Circle, ConnectionStatus, EmptyState, H1, Header, LinkBtn, Screen, Segmented, Sub } from '../ui';
import { ServiceCard, useServicios } from './Servicios';

const FILTROS = [
  { id: 'todo', label: 'Todo' },
  { id: 'pido', label: 'Pido' },
  { id: 'presto', label: 'Presto' },
  { id: 'regalo', label: 'Regalo' },
  { id: 'intercambio', label: 'Intercambio' },
];

export function detallesFavor(f) {
  const d = f.detalles ?? {};
  const lineas = {
    presto: [['⏱️', d.duracion && `Por ${d.duracion.toLowerCase()}`], ['📝', d.condicion]],
    regalo: [['📦', d.estado], ['🔢', d.cantidad]],
    intercambio: [['🎁', d.ofrezco && `Ofrece: ${d.ofrezco}`], ['🔄', d.busco && `Busca: ${d.busco}`]],
    pido: [['🏷️', d.clase], ['📅', d.cuando && `Para: ${d.cuando.toLowerCase()}`]],
  }[f.tipo];
  return (lineas ?? []).filter(([, v]) => v);
}

export function minutosRestantes(f) {
  return Math.max(0, Math.ceil((RESERVA_MS - (Date.now() - (f.reservedAt ?? 0))) / 60000));
}

/** Confirma un lado del favor. Si ambos confirmaron, queda "Cerrado y confirmado". */
export function confirmarFavor(favor, lado) {
  const cambios = { [lado === 'owner' ? 'ownerConfirmed' : 'takerConfirmed']: true };
  const otro = lado === 'owner' ? favor.takerConfirmed : favor.ownerConfirmed;
  if (otro) Object.assign(cambios, { status: 'cerrado', closedAt: Date.now() });
  db.update('favors', favor.id, cambios);
  return Boolean(otro);
}

function TipoChip({ tipo }) {
  const t = TIPOS_FAVOR[tipo];
  return (
    <Chip className={t.chip}>
      {t.emoji} {t.label}
    </Chip>
  );
}

function EstadoChip({ f, userId }) {
  if (f.status === 'pendiente') return <ChipPendiente />;
  if (f.status === 'reservado') return <Chip className="bg-ambar-claro text-tinta">⏳ Reservado{f.takerId === userId ? ' para ti' : ''} · {minutosRestantes(f)} min</Chip>;
  if (f.status === 'cerrado') return <Chip className="bg-morado-claro text-morado-osc">✅ Cerrado y confirmado</Chip>;
  if (f.status === 'oculto') return <Chip className="bg-linea text-gris">🙈 Oculto por un Guardián</Chip>;
  return <Chip className="bg-petroleo-claro text-petroleo-osc">Disponible</Chip>;
}

export function FavorCard({ f, users, me, onClick, children }) {
  const owner = users.find((u) => u.id === f.ownerId);
  return (
    <div className={`flex flex-col gap-2 rounded-[20px] border bg-white p-3.5 ${f.status === 'pendiente' ? 'border-dashed border-gris' : 'border-linea'}`}>
      <button type="button" onClick={onClick} className="flex flex-col gap-2 text-left">
        <span className="flex w-full items-center justify-between gap-2">
          <TipoChip tipo={f.tipo} />
          <span className="text-xs font-semibold text-gris">{hace(f.createdAt)}</span>
        </span>
        <span className="flex w-full gap-3">
          {f.foto && <img src={f.foto} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
          <span className="text-base font-bold leading-snug">{f.titulo}</span>
        </span>
        <span className="flex w-full flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gris">
            {f.ownerId === me.id ? 'Tú' : nombreVisible(owner)} · Mz. {owner?.manzana} · {cuadrasTxt(cuadras(me.manzana, owner?.manzana))}
          </span>
          {f.status !== 'disponible' && <EstadoChip f={f} userId={me.id} />}
        </span>
      </button>
      {children}
    </div>
  );
}

/* ---------- 2.3 Cadena de Favores (muro) ---------- */
export function Favores() {
  const { user, users, go, t } = useApp();
  const favors = useCollection('favors');
  const [filtro, setFiltro] = useState('todo');
  const visibles = useMemo(
    () =>
      favors
        .filter((f) => !f.hidden && (f.status === 'disponible' || f.status === 'reservado' || (f.status === 'pendiente' && f.ownerId === user.id)))
        .filter((f) => filtro === 'todo' || f.tipo === filtro)
        .sort((a, b) => b.createdAt - a.createdAt),
    [favors, filtro, user.id]
  );
  return (
    <Screen className="gap-3">
      <div>
        <H1>{t('favores')} 🤝</H1>
        <Sub>{t('favoresSub')}</Sub>
      </div>
      <ConnectionStatus />
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)} className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-extrabold ${filtro === f.id ? 'border-tinta bg-tinta text-white' : 'border-linea bg-white'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {visibles.map((f) => (
        <FavorCard key={f.id} f={f} users={users} me={user} onClick={() => go('favor', { id: f.id })} />
      ))}
      {visibles.length === 0 && (
        <EmptyState emoji="🌱" title="Todavía no hay publicaciones aquí">
          Sé el primero: toca el botón + para pedir u ofrecer algo.
        </EmptyState>
      )}
    </Screen>
  );
}

/* ---------- 6.1 Detalle de favor ---------- */
export function DetalleFavor({ id }) {
  const { user, users, go, notify } = useApp();
  const favors = useCollection('favors');
  const f = favors.find((x) => x.id === id);
  if (!f) {
    return (
      <Screen>
        <Header />
        <EmptyState emoji="🙈" title="Esta publicación ya no está disponible" />
      </Screen>
    );
  }
  const owner = users.find((u) => u.id === f.ownerId);
  const mine = f.ownerId === user.id;
  const balance = balanceAyni(f.ownerId, favors);
  const verbo = f.tipo === 'pido' ? 'Puedo ayudar' : 'Lo quiero';

  const reservar = () => {
    db.update('favors', f.id, { status: 'reservado', takerId: user.id, reservedAt: Date.now(), ownerConfirmed: false, takerConfirmed: false });
    abrirEnlace(whatsappLink(owner.phone, `Hola ${owner.firstName}, te escribo desde AYNI por: ${f.titulo}.`));
    notify('Se abrió WhatsApp. Queda reservado para ti por 1 hora.');
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-44 items-center justify-center bg-ambar-claro text-7xl" aria-hidden="true">
        {f.foto ? <img src={f.foto} alt="" className="h-full w-full object-cover" /> : TIPOS_FAVOR[f.tipo].emoji}
      </div>
      <Screen>
        <Header title={mine ? 'Tu publicación' : 'Cadena de Favores'} />
        <div className="flex flex-wrap gap-2">
          <TipoChip tipo={f.tipo} />
          <EstadoChip f={f} userId={user.id} />
        </div>
        <H1>{f.titulo}</H1>
        <Sub>
          {mine ? 'Publicado por ti' : nombreVisible(owner)} · Mz. {owner?.manzana} · {cuadrasTxt(cuadras(user.manzana, owner?.manzana))} · {hace(f.createdAt)}
        </Sub>
        <div className="grid grid-cols-2 gap-2.5">
          {detallesFavor(f).map(([icono, texto]) => (
            <div key={texto} className="rounded-2xl border border-linea bg-white p-3 text-sm font-bold">
              <span className="block text-xl" aria-hidden="true">{icono}</span>
              {texto}
            </div>
          ))}
        </div>
        {!mine && (
          <div className="flex items-center gap-3 rounded-2xl bg-morado-claro p-3 text-sm font-extrabold text-morado-osc">
            <span className="text-xl" aria-hidden="true">🤝</span>
            {owner?.firstName} ha dado {balance.dados} favores y recibido {balance.recibidos}
          </div>
        )}
        <div className="flex-1" />

        {mine && <Btn onClick={() => go('misPublicaciones')}>Gestionar en Mis publicaciones</Btn>}

        {!mine && f.status === 'disponible' && (
          <>
            <p className="text-center text-sm font-semibold text-gris">Se abrirá WhatsApp con {owner?.firstName} y quedará reservado para ti por 1 hora.</p>
            <Btn onClick={reservar}>🙋 {verbo}</Btn>
          </>
        )}

        {!mine && f.status === 'reservado' && f.takerId === user.id && (
          <>
            <div className="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">
              ⏳ Reservado para ti · se libera en {minutosRestantes(f)} min si no se concreta.
            </div>
            {f.takerConfirmed ? (
              <p className="text-center text-sm font-bold text-gris">Ya confirmaste. Esperando que {owner?.firstName} toque “Listo”.</p>
            ) : (
              <Btn
                onClick={() => {
                  if (confirmarFavor(f, 'taker')) go('favorCerrado', { id: f.id });
                  else notify(`¡Gracias! Falta que ${owner?.firstName} confirme.`);
                }}
              >
                ✅ Listo, ya se concretó
              </Btn>
            )}
            <Btn variant="borde" onClick={() => abrirEnlace(whatsappLink(owner.phone, `Hola ${owner.firstName}, sobre: ${f.titulo}`))}>
              💬 Escribir por WhatsApp
            </Btn>
          </>
        )}

        {!mine && f.status === 'reservado' && f.takerId !== user.id && <p className="text-center text-sm font-bold text-gris">Otro vecino lo reservó. Si no se concreta en 1 hora, vuelve a estar disponible.</p>}

        {!mine && f.status !== 'cerrado' && <LinkBtn className="!text-gris" onClick={() => go('reportar', { col: 'favors', id: f.id })}>⚑ Reportar publicación</LinkBtn>}
      </Screen>
    </div>
  );
}

/* ---------- 6.3 Mis publicaciones (CRUD: editar, pausar, liberar, eliminar) ---------- */
export function MisPublicaciones() {
  const { user, users, go, notify } = useApp();
  const favors = useCollection('favors');
  const servicios = useServicios();
  const services = useCollection('services');
  const [tab, setTab] = useState('activas');

  const misServicios = services.filter((s) => s.ownerId === user.id && s.status !== 'oculto');
  const activas = favors.filter((f) => f.ownerId === user.id && (f.status === 'disponible' || f.status === 'pendiente'));
  const reservadas = favors.filter((f) => f.status === 'reservado' && (f.ownerId === user.id || f.takerId === user.id));
  const cerradas = favors.filter((f) => f.status === 'cerrado' && (f.ownerId === user.id || f.takerId === user.id)).sort((a, b) => b.closedAt - a.closedAt);

  const eliminar = (col, id) => {
    if (typeof window !== 'undefined' && !window.confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
    db.remove(col, id);
    notify('Publicación eliminada');
  };

  const acciones = (f) => {
    const otro = users.find((u) => u.id === (f.ownerId === user.id ? f.takerId : f.ownerId));
    const btn = 'min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white px-2 text-xs font-extrabold';
    if (f.status === 'reservado') {
      const lado = f.ownerId === user.id ? 'owner' : 'taker';
      const yoConfirme = lado === 'owner' ? f.ownerConfirmed : f.takerConfirmed;
      return (
        <div className="flex flex-col gap-2 border-t border-linea pt-2">
          <div className="text-sm font-bold">
            {lado === 'owner' ? `Reservado por ${nombreVisible(otro)}` : `Lo reservaste a ${nombreVisible(otro)}`}. {yoConfirme ? `Esperando a ${otro?.firstName}.` : '¿Ya se concretó?'}
          </div>
          <div className="flex gap-2">
            {!yoConfirme && (
              <button type="button" className={`${btn} border-petroleo bg-petroleo text-white`} onClick={() => (confirmarFavor(f, lado) ? go('favorCerrado', { id: f.id }) : notify(`Falta que ${otro?.firstName} confirme`))}>
                ✅ Listo
              </button>
            )}
            {lado === 'owner' && (
              <button type="button" className={btn} onClick={() => db.update('favors', f.id, { status: 'disponible', takerId: null, reservedAt: null, ownerConfirmed: false, takerConfirmed: false })}>
                Liberar
              </button>
            )}
          </div>
          {yoConfirme && (
            <LinkBtn className="!min-h-[36px] !text-xs !text-gris" onClick={() => (confirmarFavor(f, lado === 'owner' ? 'taker' : 'owner') ? go('favorCerrado', { id: f.id }) : null)}>
              🧪 Demo: simular que {otro?.firstName} también confirmó
            </LinkBtn>
          )}
        </div>
      );
    }
    if (f.status === 'cerrado') return null;
    return (
      <div className="flex gap-2 border-t border-linea pt-2">
        <button type="button" className={btn} onClick={() => go('publicar', { editCol: 'favors', editId: f.id })}>✏️ Editar</button>
        <button type="button" className={btn} onClick={() => eliminar('favors', f.id)}>🗑️ Eliminar</button>
      </div>
    );
  };

  return (
    <Screen className="gap-3">
      <Header title="Mi perfil" />
      <ConnectionStatus />
      <H1>Mis publicaciones</H1>
      <Segmented
        options={[
          { id: 'activas', label: `Activas (${activas.length + misServicios.length})` },
          { id: 'reservadas', label: `Reservadas (${reservadas.length})` },
          { id: 'cerradas', label: 'Cerradas' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'activas' && (
        <>
          {misServicios.length > 0 && <h2 className="text-sm font-extrabold text-gris">Mis servicios y productos</h2>}
          {misServicios.map((raw) => {
            const s = servicios.find((x) => x.id === raw.id) ?? { ...raw, owner: user, stats: { count: 0, topTags: [] }, dist: 0 };
            return (
              <div key={s.id} className="flex flex-col gap-2">
                <ServiceCard s={s} onClick={() => go('servicio', { id: s.id })} />
                <div className="flex gap-2">
                  <button type="button" className="min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white text-xs font-extrabold" onClick={() => go('publicar', { editCol: 'services', editId: s.id })}>✏️ Editar</button>
                  <button type="button" className="min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white text-xs font-extrabold" onClick={() => db.update('services', s.id, { status: s.status === 'pausado' ? 'disponible' : 'pausado' })}>
                    {s.status === 'pausado' ? '▶️ Activar' : '⏸️ Pausar'}
                  </button>
                  <button type="button" className="min-h-[44px] flex-1 rounded-xl border-2 border-linea bg-white text-xs font-extrabold" onClick={() => eliminar('services', s.id)}>🗑️ Eliminar</button>
                </div>
              </div>
            );
          })}
          {activas.length > 0 && <h2 className="text-sm font-extrabold text-gris">Mis favores</h2>}
          {activas.map((f) => (
            <FavorCard key={f.id} f={f} users={users} me={user} onClick={() => go('favor', { id: f.id })}>
              {acciones(f)}
            </FavorCard>
          ))}
          {activas.length + misServicios.length === 0 && <EmptyState emoji="📭" title="No tienes publicaciones activas">Toca + para ofrecer o pedir algo.</EmptyState>}
        </>
      )}

      {tab === 'reservadas' &&
        (reservadas.length ? (
          reservadas.map((f) => (
            <FavorCard key={f.id} f={f} users={users} me={user} onClick={() => go('favor', { id: f.id })}>
              {acciones(f)}
            </FavorCard>
          ))
        ) : (
          <EmptyState emoji="⏳" title="Nada reservado por ahora" />
        ))}

      {tab === 'cerradas' &&
        (cerradas.length ? (
          cerradas.map((f) => <FavorCard key={f.id} f={f} users={users} me={user} onClick={() => go('favor', { id: f.id })} />)
        ) : (
          <EmptyState emoji="🤝" title="Aún no cierras favores" />
        ))}
    </Screen>
  );
}

/* ---------- 6.4 Favor cerrado + Balance de Ayni ---------- */
export function FavorCerrado({ id }) {
  const { user, users, reset } = useApp();
  const favors = useCollection('favors');
  const f = favors.find((x) => x.id === id);
  const otro = users.find((u) => u.id === (f?.ownerId === user.id ? f?.takerId : f?.ownerId));
  const { dados, recibidos } = balanceAyni(user.id, favors);
  return (
    <Screen className="text-center">
      <div className="flex-1" />
      <Circle emoji="🤝" className="bg-morado-claro" />
      <H1>¡Favor cerrado y confirmado!</H1>
      <Sub>
        Tú y {otro?.firstName ?? 'tu vecino'} confirmaron: {f?.titulo}.
      </Sub>
      <div className="flex flex-col gap-3 rounded-3xl border-2 border-morado bg-white p-4">
        <div className="text-lg font-black text-morado-osc">Tu Balance de Ayni</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-morado-claro p-3 text-morado-osc">
            <div className="text-3xl font-black">{dados}</div>
            <div className="text-xs font-extrabold">favores dados</div>
          </div>
          <div className="rounded-2xl bg-morado-claro p-3 text-morado-osc">
            <div className="text-3xl font-black">{recibidos}</div>
            <div className="text-xs font-extrabold">favores recibidos</div>
          </div>
        </div>
        <div className="text-sm font-bold text-gris">Hoy por ti, mañana por mí 💜</div>
      </div>
      <div className="flex-1" />
      <Btn onClick={() => reset('favores')}>Volver a Favores</Btn>
    </Screen>
  );
}

