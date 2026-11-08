// @ts-nocheck

/* 2.5, 6.5–6.9 · Mi perfil, ajustes (idioma, letra grande), Guardianes y moderación. */
import { useMemo, useState } from 'react';
import { useApp } from '../AppContext';
import { db, useCollection } from '../storage';
import { DIAS_PARA_GUARDIAN, MOTIVOS_REPORTE, REPORTES_PARA_OCULTAR, emergenciaById } from '../data';
import { IDIOMAS } from '../i18n';
import { reiniciarDemo } from '../seed';
import { balanceAyni, diasEnAyni, hace, inicial, nombreVisible, progresoGuardian } from '../util';
import { Avatar, Btn, Chip, Circle, EmptyState, H1, Header, Icon, LangChip, PhotoPicker, Pills, Screen, Sheet, Sub, TextArea, Toggle } from '../ui';

const DIA = 24 * 60 * 60 * 1000;

/* ---------- 2.5 Mi perfil ---------- */
export function Perfil() {
  const { user, sector, isGuardian, go, logout, settings, setSettings, updateUser, notify } = useApp();
  const favors = useCollection('favors');
  const services = useCollection('services');
  const recs = useCollection('recommendations');
  const { dados, recibidos } = balanceAyni(user.id, favors);
  const publicaciones = favors.filter((f) => f.ownerId === user.id && f.status !== 'cerrado').length + services.filter((s) => s.ownerId === user.id).length;
  const progreso = progresoGuardian(user);
  const dias = diasEnAyni(user);

  const fila = 'flex min-h-[56px] w-full items-center gap-3 border-b border-linea px-4 text-left last:border-b-0';

  const verComoGuardian = (on) => {
    db.update('sectors', sector.id, (s) => ({ guardianIds: on ? [...new Set([...(s.guardianIds ?? []), user.id])] : (s.guardianIds ?? []).filter((x) => x !== user.id) }));
    notify(on ? '🛡️ Ahora ves AYNI como Guardián' : 'Volviste a ser vecino(a)');
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex flex-col items-center gap-2 rounded-b-[28px] bg-petroleo px-5 pb-6 pt-4 text-center text-white">
        <LangChip className="absolute right-4 top-3" />
        <Avatar src={user.foto || '/avatar-default.png'} letter={inicial(user)} className="h-20 w-20 border-[3px] border-white bg-ambar text-3xl" />
        <h1 className="text-2xl font-black">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm font-semibold opacity-90">
          Tus vecinos te ven como “{nombreVisible(user)}” · {sector?.name} · Mz. {user.manzana}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Chip className="bg-white text-petroleo-osc">✅ Vecino(a) verificado(a)</Chip>
          {isGuardian && <Chip className="bg-morado text-white">🛡️ Guardián</Chip>}
        </div>
        <PhotoPicker
          value={user.foto}
          onChange={(foto) => {
            updateUser({ foto });
            notify(foto ? '✅ Foto de perfil actualizada' : 'Foto de perfil eliminada');
          }}
        />
      </div>

      <Screen className="gap-3">
        <div className="rounded-[20px] border-2 border-morado bg-white p-4">
          <div className="text-base font-black text-morado-osc">🤝 Tu Balance de Ayni</div>
          <div className="mt-2 grid grid-cols-2 gap-2.5 text-center">
            <div className="rounded-2xl bg-morado-claro p-2 text-morado-osc">
              <div className="text-2xl font-black">{dados}</div>
              <div className="text-xs font-extrabold">favores dados</div>
            </div>
            <div className="rounded-2xl bg-morado-claro p-2 text-morado-osc">
              <div className="text-2xl font-black">{recibidos}</div>
              <div className="text-xs font-extrabold">favores recibidos</div>
            </div>
          </div>
        </div>

        {!isGuardian && (
          <div className="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4">
            <div className="flex justify-between text-base font-black">
              <span>🛡️ Camino a Guardián</span>
              <span className="text-sm text-gris">{Math.round(progreso * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-linea">
              <div className="h-full rounded-full bg-morado" style={{ width: `${progreso * 100}%` }} />
            </div>
            <div className="text-sm font-semibold text-gris">
              {dias >= DIAS_PARA_GUARDIAN ? 'Ya cumples los 2 meses. ¡Puedes ser Guardián!' : `Llevas ${dias} días en AYNI. Te invitaremos al cumplir 2 meses.`}
            </div>
            {dias >= DIAS_PARA_GUARDIAN && (
              <Btn variant="acento" onClick={() => go('invitacionGuardian')}>
                Quiero ser Guardián
              </Btn>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-center">
          <div className="rounded-2xl border border-linea bg-white p-2">
            <div className="text-xl font-black">{publicaciones}</div>
            <div className="text-xs font-bold text-gris">publicaciones</div>
          </div>
          <div className="rounded-2xl border border-linea bg-white p-2">
            <div className="text-xl font-black">{recs.filter((r) => r.userId === user.id).length}</div>
            <div className="text-xs font-bold text-gris">vistos buenos dados</div>
          </div>
        </div>

        <nav className="overflow-hidden rounded-[20px] border border-linea bg-white" aria-label="Menú">
          <button type="button" className={fila} onClick={() => go('misPublicaciones')}><Icon name="fa-clipboard-list" /> <span className="flex-1 font-bold">Mis publicaciones</span>›</button>
          {isGuardian && <button type="button" className={fila} onClick={() => go('panelGuardian')}><Icon name="fa-shield-halved" /> <span className="flex-1 font-bold">Panel del Guardián</span>›</button>}
          <button type="button" className={fila} onClick={() => go('ajustes')}><span aria-hidden="true">⚙️</span><span className="flex-1 font-bold">Idioma, letra grande y zona</span>›</button>
          <button type="button" className={fila} onClick={() => go('tutorial', { desdePerfil: true })}><span aria-hidden="true">📖</span><span className="flex-1 font-bold">Ver tutorial otra vez</span>›</button>
          <button type="button" className={fila} onClick={logout}><span aria-hidden="true">🚪</span><span className="flex-1 font-bold text-gris">Cerrar sesión</span>›</button>
        </nav>

        <details className="rounded-[20px] border border-dashed border-gris bg-white p-4">
          <summary className="min-h-[32px] cursor-pointer text-sm font-extrabold text-gris">🧪 Herramientas de demostración (para el jurado)</summary>
          <div className="mt-2 flex flex-col">
            <Toggle checked={settings.forceOffline} onChange={(v) => setSettings((s) => ({ ...s, forceOffline: v }))} label="Simular sin conexión" hint="Lo que publiques quedará “pendiente de enviar”" />
            <Toggle checked={isGuardian} onChange={verComoGuardian} label="Ver AYNI como Guardián" hint="Para confirmar emergencias y moderar desde este celular" />
            <button type="button" className="min-h-[52px] text-left text-base font-bold" onClick={() => { updateUser({ createdAt: Date.now() - (DIAS_PARA_GUARDIAN + 1) * DIA, inviteAnswered: null }); notify('Simulado: llevas 2 meses en AYNI'); }}>
              ⏩ Simular 2 meses en AYNI
            </button>
            <button type="button" className="min-h-[52px] text-left text-base font-bold text-gris" onClick={() => { if (window.confirm('¿Borrar todos los datos y volver a los de ejemplo?')) { reiniciarDemo(); logout(); } }}>
              ♻️ Reiniciar datos de demostración
            </button>
          </div>
        </details>
      </Screen>
    </div>
  );
}

/* ---------- 6.5 Idioma, letra grande y zona ---------- */
export function Ajustes() {
  const { user, sector, settings, setSettings, back, updateUser, go } = useApp();
  return (
    <Screen>
      <Header title="Ajustes" />
      <H1>Idioma y lectura</H1>
      <div className="text-sm font-extrabold text-gris">Idioma</div>
      <div className="overflow-hidden rounded-[20px] border border-linea bg-white" role="radiogroup">
        {IDIOMAS.map((l) => (
          <button key={l.id} type="button" role="radio" aria-checked={settings.lang === l.id} onClick={() => setSettings((s) => ({ ...s, lang: l.id }))} className="flex min-h-[56px] w-full items-center border-b border-linea px-4 text-left text-base font-bold last:border-b-0">
            <span className="flex-1">{l.label}</span>
            <span className={`h-[22px] w-[22px] rounded-full ${settings.lang === l.id ? 'border-[6px] border-morado' : 'border-2 border-linea'}`} />
          </button>
        ))}
      </div>
      {settings.lang === 'qu' && <p className="text-xs font-semibold text-gris">Traducción al runasimi en preparación: por ahora se muestran algunos textos.</p>}
      <div className="text-sm font-extrabold text-gris">Lectura</div>
      <div className="rounded-[20px] border border-linea bg-white px-4">
        <Toggle checked={settings.largeText} onChange={(v) => setSettings((s) => ({ ...s, largeText: v }))} label="🔠 Letra grande" hint="Agranda los textos de toda la app" />
      </div>
      {user && sector && (
        <>
          <div className="text-sm font-extrabold text-gris">Mi zona · {sector.name}</div>
          <Pills options={sector.manzanas.map((m) => ({ id: m, label: `Mz. ${m}` }))} value={user.manzana} onChange={(m) => updateUser({ manzana: m })} />
        </>
      )}
      <div className="flex-1" />
      <Btn variant="borde" onClick={() => go('apiDocs')}>🛠️ Docs API (dev)</Btn>
      <Btn onClick={back}>Listo</Btn>
    </Screen>
  );
}

/* ---------- 6.6 Invitación a Guardián (llega sola a los 2 meses) ---------- */
export function InvitacionSheet({ onClose }) {
  const { user, sector, updateUser, go } = useApp();
  const responder = (acepta) => {
    updateUser({ inviteAnswered: acepta ? 'aceptada' : 'despues' });
    if (acepta) {
      db.update('sectors', sector.id, (s) => ({ guardianIds: [...new Set([...(s.guardianIds ?? []), user.id])] }));
      go('guardianAceptado');
    } else {
      onClose?.();
    }
  };
  return (
    <Sheet onClose={() => responder(false)}>
      <Circle emoji="🛡️" className="h-24 w-24 bg-morado" />
      <h2 className="text-center text-xl font-black">¡Llevas 2 meses ayudando en AYNI!</h2>
      <p className="text-center font-semibold text-gris">Tus vecinos confían en ti. ¿Quieres ser Guardián de {sector?.name}?</p>
      <ul className="flex flex-col gap-1.5 rounded-2xl bg-morado-claro p-4 text-sm font-extrabold text-morado-osc">
        <li>✅ Confirmar o descartar emergencias</li>
        <li>✅ Avisar cuando la emergencia fue atendida</li>
        <li>✅ Revisar publicaciones reportadas</li>
      </ul>
      <Btn variant="acento" onClick={() => responder(true)}>Acepto ser Guardián</Btn>
      <Btn variant="borde" onClick={() => responder(false)}>Ahora no</Btn>
    </Sheet>
  );
}

export function InvitacionGuardian() {
  const { back } = useApp();
  return (
    <Screen>
      <Header />
      <InvitacionSheet onClose={back} />
    </Screen>
  );
}

/* ---------- 6.7 Ya eres Guardián ---------- */
export function GuardianAceptado() {
  const { reset, go, sector } = useApp();
  return (
    <Screen className="text-center">
      <div className="flex-1" />
      <Circle emoji="🛡️" className="bg-morado" />
      <div><Chip className="bg-morado-claro text-sm text-morado-osc">Guardián de {sector?.name}</Chip></div>
      <H1>¡Ya eres Guardián!</H1>
      <Sub>Te avisaremos cuando un vecino reporte una emergencia o una publicación necesite revisión.</Sub>
      <div className="flex-1" />
      <Btn variant="acento" onClick={() => { reset('perfil'); go('panelGuardian'); }}>Ir a mi panel</Btn>
      <Btn variant="borde" onClick={() => reset('inicio')}>Volver al inicio</Btn>
    </Screen>
  );
}

/* ---------- 3.3 / 4.10 / 6.8 Panel del Guardián ---------- */
export function PanelGuardian() {
  const { user, users, sector, isGuardian, notify, go } = useApp();
  const emergencies = useCollection('emergencies');
  const needs = useCollection('needs');
  const reports = useCollection('reports');
  const services = useCollection('services');
  const favors = useCollection('favors');
  const [descartando, setDescartando] = useState(null);
  const [motivo, setMotivo] = useState('');

  const pendientes = emergencies.filter((e) => e.sectorId === user.sectorId && e.status === 'pendiente');
  const activa = emergencies.find((e) => e.sectorId === user.sectorId && e.status === 'activa');

  const reportadas = useMemo(() => {
    const grupos = {};
    for (const r of reports) {
      const key = `${r.col}:${r.targetId}`;
      grupos[key] = grupos[key] ?? { col: r.col, targetId: r.targetId, motivos: [] };
      grupos[key].motivos.push(r.reason);
    }
    return Object.values(grupos)
      .map((g) => ({ ...g, item: (g.col === 'services' ? services : favors).find((x) => x.id === g.targetId) }))
      .filter((g) => g.item && users.find((u) => u.id === g.item.ownerId)?.sectorId === user.sectorId);
  }, [reports, services, favors, users, user.sectorId]);

  if (!isGuardian) {
    return (
      <Screen>
        <Header />
        <EmptyState emoji="🛡️" title="Solo para Guardianes" />
      </Screen>
    );
  }

  const confirmar = (e) => {
    db.update('emergencies', e.id, (x) => ({ status: 'activa', confirmedBy: user.id, confirmedAt: Date.now(), acks: { ...(x.acks ?? {}), [user.id]: 'visto' } }));
    notify('🚨 Modo emergencia activado. Tus vecinos fueron avisados.');
  };
  const descartar = (e) => {
    db.update('emergencies', e.id, { status: 'descartada', motivo: motivo.trim(), reviewedBy: user.id, reviewedAt: Date.now() });
    setDescartando(null);
    setMotivo('');
    notify('Reporte descartado. Avisamos al vecino.');
  };
  const cerrarEmergencia = (e) => {
    db.update('emergencies', e.id, (x) => ({ status: 'atendida', endedAt: Date.now(), closedBy: user.id, endSeen: { ...(x.endSeen ?? {}), [user.id]: true } }));
    notify('🕊️ Emergencia marcada como atendida');
  };
  const moderar = (g, aprobar) => {
    db.removeWhere('reports', (r) => r.col === g.col && r.targetId === g.targetId);
    db.update(g.col, g.targetId, aprobar ? { hidden: false } : { hidden: true, status: 'oculto' });
    notify(aprobar ? 'Publicación aprobada y visible otra vez' : 'Publicación ocultada');
  };

  const pedidos = activa ? needs.filter((n) => n.emergencyId === activa.id) : [];
  const sinAtender = pedidos.filter((n) => n.status === 'abierto').length;
  const ayudantes = new Set(pedidos.map((n) => n.helperId).filter(Boolean)).size;
  const aSalvo = activa ? Object.values(activa.acks ?? {}).filter((a) => a === 'bien').length : 0;

  return (
    <Screen className="gap-3">
      <Header title="Mi perfil" />
      <div className="flex items-center gap-3 rounded-[20px] border-2 border-morado bg-morado-claro p-3.5">
        <span className="text-3xl" aria-hidden="true">🛡️</span>
        <div>
          <div className="font-black">Panel del Guardián</div>
          <div className="text-sm font-semibold text-gris">{sector?.name}</div>
        </div>
      </div>

      <h2 className="text-lg font-black">Emergencias por confirmar</h2>
      {pendientes.length === 0 && <div className="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">🙌 No hay reportes pendientes</div>}
      {pendientes.map((e) => {
        const tipo = emergenciaById(e.tipo);
        const autor = users.find((u) => u.id === e.reporterId);
        return (
          <div key={e.id} className="flex flex-col gap-2.5 rounded-3xl border-2 border-rojo bg-white p-4">
            <div className="flex items-center justify-between">
              <Chip className="bg-rojo-claro text-rojo-osc">{tipo.emoji} {tipo.label.toUpperCase()}</Chip>
              <span className="text-xs font-semibold text-gris">{hace(e.createdAt)}</span>
            </div>
            {e.texto && <p className="text-lg font-extrabold">“{e.texto}”</p>}
            {e.foto && <img src={e.foto} alt="Foto del reporte" className="max-h-48 rounded-2xl object-cover" />}
            <div className="text-sm font-semibold text-gris">Reportado por {autor?.id === user.id ? 'ti' : nombreVisible(autor)} · Mz. {autor?.manzana}</div>
            {descartando === e.id ? (
              <>
                <TextArea value={motivo} onChange={(ev) => setMotivo(ev.target.value)} placeholder="Motivo (opcional). Ej: Los bomberos ya controlaron la acequia." />
                <Btn variant="borde" onClick={() => descartar(e)}>Descartar reporte</Btn>
                <button type="button" className="min-h-[44px] text-sm font-bold text-gris" onClick={() => setDescartando(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Si confirmas, se activará el modo emergencia para todo {sector?.name}.</p>
                <Btn variant="rojo" onClick={() => confirmar(e)}>✓ Confirmar emergencia</Btn>
                <Btn variant="borde" onClick={() => setDescartando(e.id)}>Descartar</Btn>
              </>
            )}
          </div>
        );
      })}

      {activa && (
        <>
          <h2 className="text-lg font-black text-rojo-osc">🚨 Emergencia activa · {emergenciaById(activa.tipo).label}</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[pedidos.length, 'pedidos de ayuda'], [pedidos.length - sinAtender, 'atendidos'], [ayudantes + aSalvo, 'vecinos a salvo o ayudando']].map(([n, l]) => (
              <div key={l} className="rounded-2xl border border-linea bg-white p-2">
                <div className="text-2xl font-black">{n}</div>
                <div className="text-[11px] font-bold leading-tight text-gris">{l}</div>
              </div>
            ))}
          </div>
          {sinAtender > 0 && <div className="rounded-2xl border border-ambar bg-ambar-claro p-3 text-sm font-bold">⚠️ Aún hay {sinAtender} pedido(s) sin atender. Revisa el mapa antes de cerrar.</div>}
          <Btn onClick={() => cerrarEmergencia(activa)}>✓ Marcar emergencia como atendida</Btn>
          <Btn variant="borde" onClick={() => go('mapa')}>Ver mapa de ayuda</Btn>
        </>
      )}

      <h2 className="text-lg font-black">Publicaciones reportadas ({reportadas.length})</h2>
      {reportadas.length === 0 && <div className="rounded-2xl border border-linea bg-white p-4 font-semibold text-gris">Todo en orden 👌</div>}
      {reportadas.map((g) => (
        <div key={`${g.col}:${g.targetId}`} className="flex flex-col gap-2 rounded-[20px] border-2 border-ambar bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <Chip className="bg-ambar-claro text-tinta">{g.item.hidden ? 'Oculta automáticamente' : 'En revisión'}</Chip>
            <span className="text-xs font-bold text-gris">{g.motivos.length} reporte(s)</span>
          </div>
          <p className="font-bold">“{g.item.descripcion ?? g.item.titulo}”</p>
          <p className="text-sm font-semibold text-gris">Motivo más común: {mayoria(g.motivos)}</p>
          <div className="flex gap-2">
            <Btn variant="borde" className="!min-h-[48px] !text-base" onClick={() => moderar(g, true)}>Aprobar</Btn>
            <Btn className="!min-h-[48px] !text-base" onClick={() => moderar(g, false)}>Ocultar</Btn>
          </div>
        </div>
      ))}
    </Screen>
  );
}

function mayoria(lista) {
  const c = {};
  lista.forEach((x) => (c[x] = (c[x] ?? 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
}

/* ---------- 6.9 Reportar publicación ---------- */
export function Reportar({ col, id }) {
  const { user, back, notify } = useApp();
  const reports = useCollection('reports');
  const [motivo, setMotivo] = useState(MOTIVOS_REPORTE[0]);
  const yaReporto = reports.some((r) => r.col === col && r.targetId === id && r.userId === user.id);

  const enviar = () => {
    db.create('reports', { col, targetId: id, userId: user.id, reason: motivo });
    const total = db.list('reports').filter((r) => r.col === col && r.targetId === id).length;
    if (total >= REPORTES_PARA_OCULTAR) db.update(col, id, { hidden: true });
    notify('Gracias. Un Guardián lo revisará.');
    back();
  };

  return (
    <Screen>
      <Header title="Reportar" />
      <H1>¿Por qué reportas esta publicación?</H1>
      {yaReporto ? (
        <EmptyState emoji="✅" title="Ya enviaste un reporte">Un Guardián lo está revisando.</EmptyState>
      ) : (
        <>
          <div className="flex flex-col gap-2" role="radiogroup">
            {MOTIVOS_REPORTE.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={motivo === m} onClick={() => setMotivo(m)} className={`flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold ${motivo === m ? 'border-petroleo bg-petroleo-claro' : 'border-linea bg-white'}`}>
                {m}
                {motivo === m && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
          <Sub className="text-sm">Un Guardián lo revisará. Tu nombre no se muestra a quien publicó. Con {REPORTES_PARA_OCULTAR} reportes, la publicación se oculta mientras se revisa.</Sub>
          <div className="flex-1" />
          <Btn onClick={enviar}>Enviar reporte</Btn>
        </>
      )}
    </Screen>
  );
}
