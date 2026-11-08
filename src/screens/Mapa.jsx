/* 3.2 · Mapa del sector. En modo normal: servicios y favores.
 * En emergencia: pedidos de ayuda (zona aproximada) y puntos de apoyo, con "Voy yo". */
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { db, useCollection } from '../storage';
import { TIPOS_FAVOR, VULNERABLES, catById, emergenciaById, necesidadById } from '../data';
import { hace, nombreVisible, posicionPin } from '../util';
import { Btn, Chip, EmergencyBanner, H1, Screen } from '../ui';
import { useServicios } from './Servicios';

export function Mapa() {
  const { user, users, sector, activeEmergency: e, isGuardian, go, notify } = useApp();
  const needs = useCollection('needs');
  const groups = useCollection('groups');
  const favors = useCollection('favors');
  const servicios = useServicios();
  const [sel, setSel] = useState(null);

  const manzanas = sector?.manzanas ?? ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = manzanas.length <= 4 ? 2 : 3;
  const ownerOf = (id) => users.find((u) => u.id === id);

  const pedidos = useMemo(() => (e ? needs.filter((n) => n.emergencyId === e.id && n.status !== 'resuelto') : []), [needs, e]);

  const pins = e
    ? [
        ...pedidos.map((n) => ({ id: n.id, kind: 'need', emoji: necesidadById(n.necesidad).emoji, manzana: n.manzana, cls: 'bg-rojo', ring: true })),
        ...groups.map((g) => ({ id: g.id, kind: 'group', emoji: g.emoji, manzana: g.manzana, cls: g.recurso === 'agua' ? 'bg-petroleo-osc' : 'bg-petroleo' })),
      ]
    : [
        ...servicios.map((s) => ({ id: s.id, kind: 'service', emoji: catById(s.categoria).emoji, manzana: s.owner?.manzana, cls: 'bg-petroleo' })),
        ...favors.filter((f) => !f.hidden && f.status === 'disponible').map((f) => ({ id: f.id, kind: 'favor', emoji: TIPOS_FAVOR[f.tipo].emoji, manzana: ownerOf(f.ownerId)?.manzana, cls: 'bg-morado' })),
      ];

  const miPos = posicionPin(manzanas, user.manzana, 'yo', cols);

  const vengoYo = (n) => {
    db.update('needs', n.id, { status: 'en_camino', helperId: user.id, helperAt: Date.now() });
    notify(`🙋 Avisamos a ${ownerOf(n.ownerId)?.firstName} que vas en camino`);
  };

  const seleccionado = pins.find((p) => p.id === sel);

  return (
    <div className={`flex flex-1 flex-col ${e ? 'bg-rojo-fondo' : ''}`}>
      {e && <EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />}
      <div className="relative mx-5 mt-4 h-[340px] overflow-hidden rounded-3xl bg-mapa" role="img" aria-label="Mapa del sector por manzanas">
        <div className={`absolute inset-3 grid gap-3 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {manzanas.map((m) => (
            <div key={m} className={`flex items-start justify-start rounded-lg p-1.5 text-[11px] font-extrabold ${m === user.manzana ? 'bg-petroleo-claro text-petroleo-osc' : 'bg-manzana text-gris'}`}>
              Mz. {m}
            </div>
          ))}
        </div>
        <span className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#2F80ED] shadow-[0_0_0_8px_rgba(47,128,237,.2)]" style={{ left: `${miPos.left}%`, top: `${miPos.top}%` }} aria-label="Tú estás aquí" />
        {pins.map((p) => {
          const pos = posicionPin(manzanas, p.manzana, p.id, cols);
          return (
            <button key={p.id} type="button" onClick={() => setSel(p.id)} aria-label="Ver detalle" className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.left}%`, top: `${pos.top}%` }}>
              {p.ring && <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-rojo bg-rojo/15" />}
              <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white text-lg shadow-md ${p.cls} ${sel === p.id ? 'scale-125' : ''}`}>{p.emoji}</span>
            </button>
          );
        })}
        {e && <span className="absolute right-3 top-3 rounded-xl bg-white px-2.5 py-1.5 text-xs font-extrabold">🔒 Zona aproximada</span>}
      </div>

      <Screen className="gap-3">
        <div className="flex flex-wrap gap-3 text-xs font-extrabold">
          {e ? (
            <>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-rojo align-[-1px]" />Necesitan ayuda ({pedidos.filter((n) => n.status === 'abierto').length})</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]" />Apoyo ({groups.length})</span>
            </>
          ) : (
            <>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-petroleo align-[-1px]" />Servicios</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-morado align-[-1px]" />Favores</span>
              <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-[#2F80ED] align-[-1px]" />Tú</span>
            </>
          )}
        </div>

        {!e && seleccionado && (
          <Btn variant={seleccionado.kind === 'favor' ? 'acento' : 'primario'} onClick={() => go(seleccionado.kind === 'favor' ? 'favor' : 'servicio', { id: seleccionado.id })}>
            {seleccionado.emoji} Ver {seleccionado.kind === 'favor' ? 'favor' : 'servicio'}
          </Btn>
        )}
        {!e && !seleccionado && <p className="text-sm font-semibold text-gris">Toca un punto del mapa para ver de qué se trata.</p>}

        {e && (
          <>
            <H1 className="!text-xl">Vecinos que necesitan ayuda</H1>
            {pedidos.length === 0 && <div className="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 Nadie ha pedido ayuda todavía.</div>}
            {[...pedidos].sort((a, b) => (a.id === sel ? -1 : b.id === sel ? 1 : a.status === 'abierto' ? -1 : 1)).map((n) => {
              const nec = necesidadById(n.necesidad);
              const owner = ownerOf(n.ownerId);
              const helper = ownerOf(n.helperId);
              const mio = n.ownerId === user.id;
              return (
                <div key={n.id} className={`flex flex-col gap-2 rounded-[20px] border-2 bg-white p-3.5 ${n.id === sel ? 'border-rojo' : 'border-linea'}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-2xl" aria-hidden="true">{nec.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-black">{nec.label} · {n.cuantas} persona(s)</div>
                      <div className="text-sm font-semibold text-gris">Zona Mz. {n.manzana} · {hace(n.createdAt)}</div>
                    </div>
                  </div>
                  {n.quienes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {n.quienes.map((q) => {
                        const v = VULNERABLES.find((x) => x.id === q);
                        return <Chip key={q} className="bg-rojo-claro text-rojo-osc">{v?.emoji} {v?.label}</Chip>;
                      })}
                    </div>
                  )}
                  {n.texto && <p className="text-sm font-semibold">“{n.texto}”</p>}
                  {isGuardian && (owner?.address || owner?.location) && (
                    <p className="rounded-xl bg-morado-claro p-2 text-xs font-bold text-morado-osc">
                      🛡️ Solo Guardianes · {owner.address || `${owner.location.lat}, ${owner.location.lng}`}
                    </p>
                  )}
                  {mio ? (
                    <Btn variant="borde" className="!min-h-[48px] !text-base" onClick={() => go('miPedido', { id: n.id })}>Ver mi pedido</Btn>
                  ) : n.status === 'abierto' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Btn variant="rojo" className="!min-h-[48px] !text-base" onClick={() => vengoYo(n)}>🙋 Voy yo</Btn>
                      <a href={`tel:+${owner?.phone}`} className="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-linea bg-white font-black">📞 Llamar</a>
                    </div>
                  ) : (
                    <div className="text-sm font-extrabold text-petroleo">🙋 {helper?.id === user.id ? 'Tú vas' : `${nombreVisible(helper)} va`} en camino</div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </Screen>
    </div>
  );
}
