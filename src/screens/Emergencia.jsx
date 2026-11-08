/* 3.x y 4.x · Modo emergencia de principio a fin.
 * Flujo: vecino reporta → Guardián confirma/descarta → todos reciben la alerta →
 * piden o dan ayuda en el mapa → el Guardián marca la emergencia como atendida. */
import { useState } from 'react';
import { useApp } from '../AppContext';
import { db, useCollection } from '../storage';
import { NECESIDADES, RECURSOS, TIPOS_EMERGENCIA, VULNERABLES, emergenciaById, necesidadById } from '../data';
import { abrirEnlace, hace, hora, nombreVisible, whatsappLink } from '../util';
import { Btn, Circle, EmergencyBanner, Field, FullOverlay, H1, Header, NumerosEmergencia, OptionGrid, PhotoPicker, Screen, Steps, Stepper, Sub, TextArea } from '../ui';

/* ---------- 4.1 Reportar emergencia ---------- */
export function ReportarEmergencia() {
  const { user, replace, isGuardian } = useApp();
  const [tipo, setTipo] = useState('');
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(null);
  const enviar = () => {
    const e = db.create('emergencies', { sectorId: user.sectorId, reporterId: user.id, tipo, texto: texto.trim(), foto, manzana: user.manzana, status: 'pendiente', acks: {}, endSeen: {} });
    replace('reporteEnviado', { id: e.id });
  };
  return (
    <Screen className="gap-3">
      <Header title="Lo verá un Guardián" />
      <H1>¿Qué está pasando?</H1>
      <OptionGrid options={TIPOS_EMERGENCIA} value={tipo} onChange={setTipo} tone="rojo" />
      <Field label="Cuéntanos más (opcional)">
        <TextArea value={texto} maxLength={200} onChange={(e) => setTexto(e.target.value)} placeholder="Ej: Se desbordó la acequia y el agua entra a las casas…" />
      </Field>
      <PhotoPicker value={foto} onChange={setFoto} />
      <div className="text-sm font-semibold text-gris">📍 Ubicación automática: Mz. {user.manzana}</div>
      {isGuardian && <div className="rounded-2xl bg-morado-claro p-3 text-sm font-bold text-morado-osc">🛡️ Como Guardián podrás confirmarlo tú mismo desde tu panel.</div>}
      <div className="flex-1" />
      <Btn variant="rojo" disabled={!tipo} onClick={enviar}>Enviar reporte</Btn>
    </Screen>
  );
}

/* ---------- 4.2 Reporte enviado (esperando al Guardián) ---------- */
export function ReporteEnviado({ id }) {
  const { reset, isGuardian, go } = useApp();
  const e = useCollection('emergencies').find((x) => x.id === id);
  return (
    <Screen className="text-center">
      <div className="flex-1" />
      <Circle emoji="⏳" className="bg-ambar-claro" />
      <H1>Reporte enviado</H1>
      <Sub>Un Guardián de tu sector lo revisará en breve. Te avisaremos apenas responda.</Sub>
      <div className="text-left">
        <Steps
          items={[
            ['✅', 'Enviado', e && hora(e.createdAt), true],
            [e?.status === 'pendiente' ? '⏳' : '✅', 'Revisión del Guardián', e?.status === 'pendiente' ? 'En curso' : 'Listo', true],
            [e?.status === 'activa' ? '✅' : '⚪', 'Aviso a tus vecinos', '', e?.status === 'activa'],
          ]}
        />
      </div>
      <p className="text-left text-sm font-extrabold text-rojo-osc">¿Hay peligro inmediato? Llama ya:</p>
      <NumerosEmergencia />
      <div className="flex-1" />
      {isGuardian && <Btn variant="acento" onClick={() => go('panelGuardian')}>🛡️ Revisarlo en mi panel</Btn>}
      <Btn variant="borde" onClick={() => reset('inicio')}>Volver al inicio</Btn>
    </Screen>
  );
}

/* ---------- 4.4 / 4.5 Respuesta al vecino que reportó (overlay) ---------- */
export function ResultadoReporte({ e }) {
  const { user, users, reset } = useApp();
  const guardian = users.find((u) => u.id === (e.confirmedBy ?? e.reviewedBy));
  const cerrar = (destino) => {
    db.update('emergencies', e.id, (x) => ({ reporterSeen: true, acks: e.status === 'activa' ? { ...(x.acks ?? {}), [user.id]: 'visto' } : x.acks }));
    reset(destino);
  };
  if (e.status === 'activa') {
    const vecinos = users.filter((u) => u.sectorId === e.sectorId).length;
    return (
      <FullOverlay>
        <Screen className="text-center">
          <div className="flex-1" />
          <Circle emoji="✅" className="bg-rojo-claro" />
          <H1>Tu reporte fue confirmado</H1>
          <Sub>Un Guardián activó el modo emergencia en tu sector. Tus vecinos ya fueron avisados. ¡Gracias por avisar!</Sub>
          <div className="text-left">
            <Steps items={[['✅', 'Enviado', hora(e.createdAt), true], ['✅', `Confirmado por ${nombreVisible(guardian)} (Guardián)`, hora(e.confirmedAt), true], ['✅', 'Vecinos avisados', `${vecinos} vecinos`, true]]} />
          </div>
          <div className="flex-1" />
          <Btn variant="rojo" onClick={() => cerrar('inicio')}>Ver la emergencia</Btn>
        </Screen>
      </FullOverlay>
    );
  }
  return (
    <FullOverlay>
      <Screen className="text-center">
        <div className="flex-1" />
        <Circle emoji="ℹ️" className="bg-ambar-claro" />
        <H1>No se activó la emergencia</H1>
        <Sub>Un Guardián revisó tu reporte. Gracias por estar atento a tu sector.</Sub>
        {e.motivo && (
          <div className="rounded-[20px] border border-linea bg-white p-4 text-left">
            <div className="text-sm font-extrabold text-gris">Motivo del Guardián</div>
            <p className="font-semibold">“{e.motivo}”</p>
          </div>
        )}
        <p className="text-left text-sm font-extrabold text-rojo-osc">Si crees que es grave, llama directamente:</p>
        <NumerosEmergencia />
        <div className="flex-1" />
        <Btn onClick={() => cerrar('inicio')}>Entendido</Btn>
      </Screen>
    </FullOverlay>
  );
}

/* ---------- 4.6 Alerta a todos los vecinos (overlay) ---------- */
export function AlertaEmergencia({ e }) {
  const { user, reset, go } = useApp();
  const tipo = emergenciaById(e.tipo);
  const responder = (respuesta, destino) => {
    db.update('emergencies', e.id, (x) => ({ acks: { ...(x.acks ?? {}), [user.id]: respuesta } }));
    reset('inicio');
    if (destino) go(destino);
  };
  return (
    <FullOverlay className="bg-rojo text-white">
      <div className="flex flex-1 flex-col gap-4 px-6 pb-10 pt-8 text-center">
        <div className="flex-1" />
        <Circle emoji="🚨" className="bg-white" />
        <h1 className="text-3xl font-black">EMERGENCIA EN TU SECTOR</h1>
        <p className="text-xl font-black">{tipo.emoji} {tipo.label} · Mz. {e.manzana} y alrededores</p>
        {e.texto && <p className="font-semibold opacity-90">“{e.texto}”</p>}
        <p className="text-sm font-semibold opacity-85">Confirmada por un Guardián {hace(e.confirmedAt)}</p>
        <div className="flex-1" />
        <Btn variant="blanco" className="!text-tinta" onClick={() => responder('bien')}>✅ Estoy bien</Btn>
        <Btn variant="blanco" className="!text-rojo-osc" onClick={() => responder('ayuda', 'pedirAyuda')}>🆘 Necesito ayuda</Btn>
        <Btn variant="bordeBlanco" onClick={() => responder('visto')}>Ver qué pasa</Btn>
      </div>
    </FullOverlay>
  );
}

/* ---------- 4.11 Fin de la emergencia (overlay) ---------- */
export function FinEmergencia({ e }) {
  const { user, reset } = useApp();
  const needs = useCollection('needs').filter((n) => n.emergencyId === e.id);
  const ayudaron = new Set(needs.map((n) => n.helperId).filter(Boolean)).size;
  const cerrar = () => {
    db.update('emergencies', e.id, (x) => ({ endSeen: { ...(x.endSeen ?? {}), [user.id]: true } }));
    reset('inicio');
  };
  return (
    <FullOverlay>
      <Screen className="text-center">
        <div className="flex-1" />
        <Circle emoji="🕊️" className="bg-petroleo-claro" />
        <H1>La emergencia terminó</H1>
        <Sub>Un Guardián marcó la {emergenciaById(e.tipo).label.toLowerCase()} como atendida. AYNI vuelve a la normalidad.</Sub>
        <div className="rounded-[20px] bg-morado-claro p-4 text-morado-osc">
          <div className="text-lg font-black">💜 {ayudaron} vecino(s) ayudaron</div>
          <div className="text-sm font-bold">Hoy por ti, mañana por mí.</div>
        </div>
        <div className="flex-1" />
        <Btn onClick={cerrar}>Volver al inicio</Btn>
      </Screen>
    </FullOverlay>
  );
}

/* ---------- 3.1 Inicio en modo emergencia ---------- */
export function InicioEmergencia() {
  const { user, activeEmergency: e, go } = useApp();
  const groups = useCollection('groups');
  const needs = useCollection('needs');
  const tipo = emergenciaById(e.tipo);
  const miPedido = needs.find((n) => n.emergencyId === e.id && n.ownerId === user.id && n.status !== 'resuelto');
  const abiertos = needs.filter((n) => n.emergencyId === e.id && n.status === 'abierto').length;

  return (
    <div className="flex flex-1 flex-col bg-rojo-fondo">
      <div className="flex flex-col gap-1 bg-rojo px-5 pb-4 pt-4 text-white">
        <div className="text-xl font-black">🚨 Emergencia activa: {tipo.label}</div>
        <div className="text-sm font-semibold opacity-90">Confirmada por un Guardián {hace(e.confirmedAt)} · Mz. {e.manzana} y alrededores</div>
      </div>
      <Screen>
        {miPedido && (
          <button type="button" onClick={() => go('miPedido', { id: miPedido.id })} className="rounded-2xl border-2 border-rojo bg-white p-3 text-left text-sm font-extrabold text-rojo-osc">
            {miPedido.status === 'en_camino' ? '🙋 Alguien va en camino a ayudarte · Ver' : '⏳ Tu pedido de ayuda está publicado · Ver'}
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => go('pedirAyuda')} className="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-rojo text-lg font-black text-white">
            <span className="text-4xl" aria-hidden="true">🆘</span>Necesito ayuda
          </button>
          <button type="button" onClick={() => go('mapa')} className="flex h-32 flex-col items-center justify-center gap-1 rounded-3xl bg-petroleo text-lg font-black text-white">
            <span className="text-4xl" aria-hidden="true">💪</span>Puedo ayudar
            {abiertos > 0 && <span className="text-xs font-bold opacity-90">{abiertos} vecino(s) esperan</span>}
          </button>
        </div>
        <h2 className="text-lg font-black">Recursos cerca</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {RECURSOS.map((r) => {
            const n = groups.filter((g) => g.recurso === r.id).length;
            return (
              <button key={r.id} type="button" onClick={() => go('grupos')} className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border border-linea bg-white p-2 text-xs font-extrabold">
                <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
                {r.label}
                <span className="font-semibold text-gris">{n ? `${n} punto(s)` : 'Sin datos'}</span>
              </button>
            );
          })}
        </div>
        <h2 className="text-lg font-black">Números de emergencia</h2>
        <NumerosEmergencia />
      </Screen>
    </div>
  );
}

/* ---------- 4.7 Pedir ayuda en emergencia ---------- */
export function PedirAyuda() {
  const { user, activeEmergency: e, replace, back } = useApp();
  const [necesidad, setNecesidad] = useState('');
  const [quienes, setQuienes] = useState([]);
  const [cuantas, setCuantas] = useState(1);
  const [texto, setTexto] = useState('');
  const [foto, setFoto] = useState(null);

  if (!e) {
    return (
      <Screen>
        <Header />
        <H1>No hay una emergencia activa</H1>
        <Sub>Si algo grave está pasando, repórtalo para que un Guardián lo confirme.</Sub>
        <Btn variant="rojo" onClick={() => replace('reportarEmergencia')}>Reportar emergencia</Btn>
        <Btn variant="borde" onClick={back}>Volver</Btn>
      </Screen>
    );
  }

  const pedir = () => {
    const n = db.create('needs', { emergencyId: e.id, ownerId: user.id, necesidad, quienes, cuantas, texto: texto.trim(), foto, manzana: user.manzana, status: 'abierto', helperId: null });
    replace('miPedido', { id: n.id });
  };

  return (
    <div className="flex flex-1 flex-col">
      <EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />
      <Screen className="gap-3">
        <Header title="Pedir ayuda" />
        <H1>¿Qué necesitas?</H1>
        <OptionGrid options={NECESIDADES} value={necesidad} onChange={setNecesidad} tone="rojo" />
        <Field label="¿Quiénes están contigo? (puedes elegir varios)">
          <OptionGrid options={VULNERABLES} value={quienes} onChange={setQuienes} multi tone="rojo" />
        </Field>
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-gris">¿Cuántas personas?</span>
          <Stepper value={cuantas} onChange={setCuantas} />
        </div>
        <Field label="Algo más que debamos saber (opcional)">
          <TextArea value={texto} maxLength={160} onChange={(ev) => setTexto(ev.target.value)} placeholder="Ej: Mi mamá usa silla de ruedas, estamos en el segundo piso." />
        </Field>
        <PhotoPicker value={foto} onChange={setFoto} />
        <div className="text-sm font-semibold text-gris">📍 Zona aproximada: Mz. {user.manzana}. La ubicación exacta solo la ven los Guardianes.</div>
        <Btn variant="rojo" disabled={!necesidad} onClick={pedir}>Pedir ayuda</Btn>
      </Screen>
    </div>
  );
}

/* ---------- 4.8 Mi pedido / ayuda en camino ---------- */
export function MiPedido({ id }) {
  const { users, activeEmergency: e, reset } = useApp();
  const n = useCollection('needs').find((x) => x.id === id);
  if (!n) return null;
  const nec = necesidadById(n.necesidad);
  const helper = users.find((u) => u.id === n.helperId);
  return (
    <div className="flex flex-1 flex-col">
      {e && <EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />}
      <Screen>
        <Header title="Tu pedido de ayuda" />
        <div className="flex items-center gap-3 rounded-[20px] border-2 border-rojo bg-white p-4">
          <span className="text-3xl" aria-hidden="true">{nec.emoji}</span>
          <div>
            <div className="font-black">
              {nec.label} · {n.cuantas} persona(s)
            </div>
            <div className="text-sm font-semibold text-gris">
              {n.quienes.map((q) => VULNERABLES.find((v) => v.id === q)?.emoji).join(' ')} Zona Mz. {n.manzana}
            </div>
          </div>
        </div>
        {helper ? (
          <div className="flex flex-col gap-3 rounded-[20px] bg-petroleo-claro p-4">
            <div className="font-black">🙋 {nombreVisible(helper)} va en camino</div>
            <div className="text-sm font-semibold text-gris">Vive en la Mz. {helper.manzana} · aceptó {hace(n.helperAt)}</div>
            <div className="grid grid-cols-2 gap-2.5">
              <a href={`tel:+${helper.phone}`} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-petroleo font-black text-white">📞 Llamar</a>
              <button type="button" onClick={() => abrirEnlace(whatsappLink(helper.phone, 'Hola, te escribo por mi pedido de ayuda en AYNI.'))} className="min-h-[52px] rounded-2xl bg-wa font-black text-white">💬 WhatsApp</button>
            </div>
          </div>
        ) : (
          <div className="rounded-[20px] border border-ambar bg-ambar-claro p-4 text-sm font-bold">⏳ Tu pedido ya está en el mapa. Te avisaremos cuando un vecino toque “Voy yo”.</div>
        )}
        <Steps items={[['✅', 'Pedido publicado', hora(n.createdAt), true], [helper ? '✅' : '⏳', helper ? `${nombreVisible(helper)} aceptó ayudarte` : 'Esperando a un vecino', '', true], [n.status === 'resuelto' ? '✅' : '⚪', 'Ayuda recibida', '', n.status === 'resuelto']]} />
        <div className="flex-1" />
        {n.status !== 'resuelto' && (
          <Btn
            onClick={() => {
              db.update('needs', n.id, { status: 'resuelto', resolvedAt: Date.now() });
              reset('inicio');
            }}
          >
            ✅ Ya recibí ayuda
          </Btn>
        )}
      </Screen>
    </div>
  );
}

/* ---------- 4.9 Grupos y servicios de apoyo ---------- */
export function Grupos() {
  const { activeEmergency: e } = useApp();
  const groups = useCollection('groups');
  return (
    <div className="flex flex-1 flex-col bg-rojo-fondo">
      {e && <EmergencyBanner emergencia={e} tipo={emergenciaById(e.tipo)} />}
      <Screen className="gap-3">
        <H1>Grupos y servicios de apoyo</H1>
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-3 rounded-[20px] border border-linea bg-white p-3.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rojo-claro text-3xl" aria-hidden="true">{g.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-black leading-tight">{g.name}</div>
              <div className="text-sm font-semibold text-gris">{g.meta}</div>
            </div>
            {g.contacto.tipo === 'tel' ? (
              <a href={`tel:${g.contacto.valor}`} className="flex min-h-[48px] items-center rounded-full bg-rojo px-4 text-sm font-black text-white">📞 {g.contacto.valor}</a>
            ) : (
              <button type="button" onClick={() => abrirEnlace(whatsappLink(g.contacto.valor, `Hola, te escribo desde AYNI por la emergencia.`))} className="min-h-[48px] rounded-full bg-rojo px-4 text-sm font-black text-white">💬 Escribir</button>
            )}
          </div>
        ))}
      </Screen>
    </div>
  );
}
