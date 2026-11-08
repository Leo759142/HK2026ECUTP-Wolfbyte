/* 0.x y 1.x · Portada, tutorial, ingreso, registro y creación de sector. */
import { useState } from 'react';
import { useApp } from '../AppContext';
import { db, useStored } from '../storage';
import { CODIGO_DEMO } from '../data';
import { USUARIO_DEMO_ID } from '../seed';
import { nombreVisible } from '../util';
import { Avatar, Btn, Chip, Circle, Field, H1, Header, Input, LangChip, LinkBtn, Pills, Screen, Sub, TextArea } from '../ui';

const LETRAS = 'ABCDEFGHIJ'.split('');

/* ---------- 0.1 Portada ---------- */
export function Portada() {
  const { go, t, startSession } = useApp();
  return (
    <Screen className="items-center pb-9 text-center">
      <div className="self-end">
        <LangChip />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <img src="/logo.jpg" alt="AYNI" className="w-64 rounded-3xl" />
        <H1>{t('lema')}</H1>
        <Sub>Servicios recomendados por tus vecinos, favores sin dinero y apoyo cuando más se necesita.</Sub>
      </div>
      <Btn onClick={() => go('tutorial')}>{t('crearCuenta')}</Btn>
      <Btn variant="borde" onClick={() => go('telefono', { mode: 'login' })}>
        {t('yaTengo')}
      </Btn>
      <LinkBtn onClick={() => startSession(USUARIO_DEMO_ID)}>Entrar como vecina de prueba (Rosa)</LinkBtn>
    </Screen>
  );
}

/* ---------- 1.1–1.3 Tutorial ---------- */
const PASOS_TUTORIAL = [
  { emoji: '🤝', titulo: 'Hoy por ti,\nmañana por mí', texto: 'Encuentra gasfiteros, profes y más, recomendados por tus propios vecinos.', fondo: 'bg-petroleo', boton: 'blanco' },
  { emoji: '🔄', titulo: 'Pide o presta\nsin dinero', texto: 'Presta tu escalera, regala lo que te sobra o intercambia lo que sabes hacer.', fondo: 'bg-petroleo', boton: 'blanco' },
  { emoji: '🛡️', titulo: 'En emergencias,\nnos cuidamos', texto: 'Si pasa algo grave, AYNI cambia a modo emergencia para coordinar ayuda entre vecinos.', fondo: 'bg-rojo', boton: 'blanco' },
];

export function Tutorial({ desdePerfil = false }) {
  const { go, back } = useApp();
  const [paso, setPaso] = useState(0);
  const p = PASOS_TUTORIAL[paso];
  const terminar = () => (desdePerfil ? back() : go('telefono', { mode: 'registro' }));
  return (
    <div className={`flex flex-1 flex-col gap-6 px-7 pb-10 pt-5 text-white ${p.fondo}`}>
      <button type="button" onClick={terminar} className="min-h-[48px] self-end text-base font-extrabold opacity-85">
        Saltar
      </button>
      <div className="flex h-64 items-center justify-center rounded-[32px] bg-white/15">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-6xl" aria-hidden="true">
          {p.emoji}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="whitespace-pre-line text-3xl font-black leading-tight">{p.titulo}</h1>
        <p className="text-lg font-semibold opacity-90">{p.texto}</p>
      </div>
      <div className="flex-1" />
      <div className="flex justify-center gap-2" aria-label={`Paso ${paso + 1} de 3`}>
        {PASOS_TUTORIAL.map((_, i) => (
          <span key={i} className={`h-2.5 rounded-full ${i === paso ? 'w-7 bg-white' : 'w-2.5 bg-white/40'}`} />
        ))}
      </div>
      <Btn variant="blanco" className={paso === 2 ? '!text-rojo' : ''} onClick={() => (paso < 2 ? setPaso(paso + 1) : terminar())}>
        {paso < 2 ? 'Siguiente →' : desdePerfil ? 'Listo' : 'Empezar'}
      </Btn>
    </div>
  );
}

function Progreso({ paso }) {
  return (
    <div className="flex gap-1.5" aria-label={`Paso ${paso} de 4`}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= paso ? 'bg-petroleo' : 'bg-linea'}`} />
      ))}
    </div>
  );
}

/* ---------- 0.2 / 1.4 Número de celular ---------- */
export function Telefono({ mode = 'registro' }) {
  const { go, users } = useApp();
  const [draft, setDraft] = useStored('registro', {});
  const [phone, setPhone] = useState(draft.phone ?? '');
  const [error, setError] = useState('');
  const valido = /^9\d{8}$/.test(phone);
  const existente = users.find((u) => u.phone === `51${phone}`);

  const continuar = () => {
    if (mode === 'login' && !existente) return setError('No encontramos ese número. Toca "Crear cuenta" para registrarte.');
    if (mode === 'registro' && existente) return setError('Ese número ya tiene cuenta. Vuelve e ingresa con "Ya tengo cuenta".');
    setDraft({ ...draft, phone });
    return go('codigo', { mode });
  };

  return (
    <Screen>
      <Header title={mode === 'registro' ? 'Paso 1 de 4' : 'Ingresar'} />
      {mode === 'registro' && <Progreso paso={1} />}
      <H1>{mode === 'registro' ? '¿Cuál es tu número de celular?' : '¡Hola de nuevo! 👋'}</H1>
      <Sub>{mode === 'registro' ? 'Te enviaremos un código por SMS para verificar que eres tú.' : 'Escribe tu número y te enviaremos un código para entrar. No necesitas contraseña.'}</Sub>
      <div className="flex gap-2.5">
        <div className="flex min-h-[56px] w-24 items-center justify-center rounded-2xl border-2 border-linea bg-white font-bold">🇵🇪 +51</div>
        <Input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          aria-label="Número de celular"
          placeholder="987 654 321"
          maxLength={9}
          className="min-h-[56px] flex-1 text-lg"
          value={phone}
          onChange={(e) => {
            setError('');
            setPhone(e.target.value.replace(/\D/g, ''));
          }}
        />
      </div>
      {error && <p className="text-sm font-bold text-morado-osc">{error}</p>}
      <p className="text-sm font-semibold text-gris">🔒 Tus vecinos no verán tu número. Solo se usa para WhatsApp cuando tú lo decidas.</p>
      <div className="flex-1" />
      <Btn disabled={!valido} onClick={continuar}>Enviar código</Btn>
    </Screen>
  );
}

/* ---------- 0.3 / 1.5 Código SMS ---------- */
export function Codigo({ mode = 'registro' }) {
  const { go, back, users, startSession } = useApp();
  const [draft] = useStored('registro', {});
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const verificar = () => {
    if (code !== CODIGO_DEMO) return setError('Código incorrecto. Revisa el SMS e inténtalo otra vez.');
    if (mode === 'login') {
      const user = users.find((u) => u.phone === `51${draft.phone}`);
      return user ? startSession(user.id) : setError('No encontramos tu cuenta.');
    }
    return go('nombre');
  };

  return (
    <Screen>
      <Header title={mode === 'registro' ? 'Paso 2 de 4' : 'Ingresar'} />
      {mode === 'registro' && <Progreso paso={2} />}
      <H1>Escribe el código</H1>
      <Sub>Lo enviamos por SMS al +51 {draft.phone}</Sub>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="Código de 4 dígitos"
        maxLength={4}
        placeholder="• • • •"
        className="min-h-[64px] text-center text-3xl font-black tracking-[0.6em]"
        value={code}
        onChange={(e) => {
          setError('');
          setCode(e.target.value.replace(/\D/g, ''));
        }}
      />
      {error && <p className="text-sm font-bold text-morado-osc">{error}</p>}
      <div className="rounded-2xl bg-ambar-claro px-4 py-3 text-sm font-bold">🧪 Modo demostración: el código es {CODIGO_DEMO}. En producción llegaría por SMS.</div>
      <LinkBtn onClick={back}>Cambiar número</LinkBtn>
      <div className="flex-1" />
      <Btn disabled={code.length !== 4} onClick={verificar}>
        {mode === 'login' ? 'Entrar' : 'Verificar'}
      </Btn>
    </Screen>
  );
}

/* ---------- 1.6 Nombre ---------- */
export function Nombre() {
  const { go } = useApp();
  const [draft, setDraft] = useStored('registro', {});
  const [firstName, setFirst] = useState(draft.firstName ?? '');
  const [lastName, setLast] = useState(draft.lastName ?? '');
  const valido = firstName.trim().length >= 2 && lastName.trim().length >= 2;
  return (
    <Screen>
      <Header title="Paso 3 de 4" />
      <Progreso paso={3} />
      <H1>¿Cómo te llamas?</H1>
      <Sub>Así tus vecinos sabrán quién recomienda, presta o pide ayuda.</Sub>
      <Field label="Nombre">
        <Input autoComplete="given-name" value={firstName} onChange={(e) => setFirst(e.target.value)} placeholder="Rosa" />
      </Field>
      <Field label="Apellido">
        <Input autoComplete="family-name" value={lastName} onChange={(e) => setLast(e.target.value)} placeholder="Mendoza" />
      </Field>
      {valido && (
        <div className="flex flex-col gap-2 rounded-[20px] bg-petroleo-claro p-3.5">
          <div className="text-sm font-extrabold text-petroleo-osc">Así te verán tus vecinos:</div>
          <div className="flex items-center gap-3">
            <Avatar letter={firstName.trim()[0].toUpperCase()} className="h-10 w-10 bg-ambar" />
            <div>
              <div className="font-black">{nombreVisible({ firstName: firstName.trim(), lastName })}</div>
              <div className="text-xs font-semibold text-gris">Vecino(a) nuevo(a)</div>
            </div>
          </div>
        </div>
      )}
      <p className="text-sm font-semibold text-gris">🔒 Tu apellido completo no se muestra. Si ofreces un oficio, podrás elegir mostrarlo. No pedimos DNI.</p>
      <div className="flex-1" />
      <Btn
        disabled={!valido}
        onClick={() => {
          setDraft({ ...draft, firstName: firstName.trim(), lastName: lastName.trim() });
          go('ubicacion');
        }}
      >
        Continuar
      </Btn>
    </Screen>
  );
}

/* ---------- 1.7 Ubicación ---------- */
export function Ubicacion() {
  const { go, notify } = useApp();
  const [draft, setDraft] = useStored('registro', {});
  const [manual, setManual] = useState(false);
  const [address, setAddress] = useState(draft.address ?? '');
  const [buscando, setBuscando] = useState(false);

  const permitir = () => {
    if (!navigator.geolocation) {
      setManual(true);
      return;
    }
    setBuscando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Se guarda redondeado (~100 m): nunca la ubicación exacta.
        const location = { lat: Number(pos.coords.latitude.toFixed(3)), lng: Number(pos.coords.longitude.toFixed(3)) };
        setDraft({ ...draft, location });
        setBuscando(false);
        go('zona');
      },
      () => {
        setBuscando(false);
        notify('No pudimos obtener tu ubicación. Elige tu zona en la lista.');
        go('zona');
      },
      { timeout: 8000 }
    );
  };

  return (
    <Screen>
      <Header title="Paso 4 de 4" />
      <Progreso paso={4} />
      <Circle emoji="📍" className="bg-petroleo-claro" />
      <H1>Activa tu ubicación</H1>
      <Sub>La usamos para mostrarte lo que hay cerca y confirmar que vives en el barrio.</Sub>
      <ul className="flex flex-col gap-2 text-[15px] font-bold">
        <li>✅ Solo usamos tu zona, nunca tu dirección exacta</li>
        <li>✅ Puedes cambiarla cuando quieras</li>
        <li>✅ En una emergencia ayuda a que te encuentren</li>
      </ul>
      {manual && (
        <Field label="Tu dirección o una referencia" hint="Solo la verán los Guardianes durante una emergencia.">
          <TextArea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ej: Calle Los Pinos 123, frente al parque" />
        </Field>
      )}
      <div className="flex-1" />
      {manual ? (
        <Btn
          disabled={address.trim().length < 5}
          onClick={() => {
            setDraft({ ...draft, address: address.trim() });
            go('zona');
          }}
        >
          Continuar
        </Btn>
      ) : (
        <>
          <Btn onClick={permitir} disabled={buscando}>
            {buscando ? 'Buscando tu zona…' : '📍 Permitir ubicación'}
          </Btn>
          <LinkBtn onClick={() => setManual(true)}>Prefiero escribir mi dirección</LinkBtn>
        </>
      )}
    </Screen>
  );
}

function crearUsuario(draft, sectorId, manzana) {
  return db.create('users', {
    firstName: draft.firstName,
    lastName: draft.lastName,
    phone: `51${draft.phone}`,
    sectorId,
    manzana,
    location: draft.location ?? null,
    address: draft.address ?? '',
    verified: true,
    showFullName: false,
    inviteAnswered: null,
  });
}

/* ---------- 1.8 Tu zona ---------- */
export function Zona() {
  const { go, sectors, startSession } = useApp();
  const [draft, setDraft] = useStored('registro', {});
  const [sectorId, setSectorId] = useState(sectors[0]?.id ?? '');
  const sector = sectors.find((s) => s.id === sectorId);
  const [manzana, setManzana] = useState('');

  const confirmar = () => {
    const user = crearUsuario(draft, sectorId, manzana);
    setDraft({});
    startSession(user.id, 'bienvenida');
  };

  return (
    <Screen>
      <Header title="Paso 4 de 4" />
      <Progreso paso={4} />
      <H1>📍 Elige tu zona</H1>
      <Sub>{draft.location ? 'Estos sectores están cerca de tu ubicación.' : 'Elige el sector donde vives.'}</Sub>
      <div className="flex flex-col gap-2" role="radiogroup">
        {sectors.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={sectorId === s.id}
            onClick={() => {
              setSectorId(s.id);
              setManzana('');
            }}
            className={`flex min-h-[56px] items-center justify-between rounded-2xl border-2 px-4 text-left font-bold ${sectorId === s.id ? 'border-petroleo bg-petroleo-claro' : 'border-linea bg-white'}`}
          >
            {s.name}
            <span className="text-xs font-semibold text-gris">{s.manzanas.length} manzanas</span>
          </button>
        ))}
      </div>
      {sector && (
        <>
          <div className="text-sm font-extrabold text-gris">¿En qué manzana vives?</div>
          <Pills options={sector.manzanas.map((m) => ({ id: m, label: `Mz. ${m}` }))} value={manzana} onChange={setManzana} />
        </>
      )}
      <LinkBtn onClick={() => go('crearSector')}>Mi sector no aparece: crearlo</LinkBtn>
      <div className="flex-1" />
      <Btn disabled={!sectorId || !manzana} onClick={confirmar}>
        Confirmar mi zona
      </Btn>
    </Screen>
  );
}

/* ---------- 0.4–0.5 Crear sector (el fundador es el primer Guardián) ---------- */
export function CrearSector() {
  const { startSession } = useApp();
  const [draft, setDraft] = useStored('registro', {});
  const [name, setName] = useState('');
  const [cantidad, setCantidad] = useState('6');
  const [manzana, setManzana] = useState('');
  const letras = LETRAS.slice(0, Number(cantidad));

  const crear = () => {
    const sector = db.create('sectors', { name: name.trim(), manzanas: letras, guardianIds: [] });
    const user = crearUsuario(draft, sector.id, manzana);
    db.update('sectors', sector.id, { guardianIds: [user.id], founderId: user.id });
    db.update('users', user.id, { inviteAnswered: 'fundador' });
    setDraft({});
    startSession(user.id, 'primerGuardian');
  };

  return (
    <Screen>
      <Header title="Nuevo sector" />
      <div className="rounded-[20px] bg-morado-claro p-4">
        <div className="text-lg font-black text-morado-osc">🧭 Tu zona aún no está en AYNI</div>
        <div className="text-sm font-semibold text-morado-osc">¡Sé el primero en abrirla! Tus vecinos podrán unirse después y tú serás su primer Guardián.</div>
      </div>
      <Field label="Nombre del sector">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Los Jardines · Sector 3" />
      </Field>
      <Field label="¿Cuántas manzanas tiene tu sector?">
        <Pills
          options={['4', '6', '8', '10']}
          value={cantidad}
          onChange={(v) => {
            setCantidad(v);
            setManzana('');
          }}
        />
      </Field>
      <Field label="¿En cuál vives?">
        <Pills options={letras.map((m) => ({ id: m, label: m }))} value={manzana} onChange={setManzana} />
      </Field>
      <div className="flex-1" />
      <Btn variant="acento" disabled={name.trim().length < 3 || !manzana} onClick={crear}>
        Crear sector
      </Btn>
    </Screen>
  );
}

/* ---------- 0.6 Eres el primer Guardián ---------- */
export function PrimerGuardian() {
  const { go, sector } = useApp();
  return (
    <Screen className="text-center">
      <div className="flex-1" />
      <Circle emoji="🛡️" className="bg-morado" />
      <div>
        <Chip className="bg-morado-claro text-morado-osc">Guardián fundador</Chip>
      </div>
      <H1>¡Eres el primer Guardián de {sector?.name ?? 'tu sector'}!</H1>
      <Sub>Cuidarás que tu sector sea un lugar de confianza.</Sub>
      <ul className="flex flex-col gap-2 rounded-[20px] border border-linea bg-white p-4 text-left text-[15px] font-bold">
        <li>✅ Confirmar o descartar emergencias</li>
        <li>✅ Avisar cuando la emergencia fue atendida</li>
        <li>✅ Revisar publicaciones reportadas</li>
      </ul>
      <div className="flex-1" />
      <Btn onClick={() => go('bienvenida')}>Entendido, continuar</Btn>
    </Screen>
  );
}

/* ---------- 1.9 Bienvenida ---------- */
export function Bienvenida() {
  const { reset, user, sector, users } = useApp();
  const vecinos = users.filter((u) => u.sectorId === user?.sectorId).length;
  return (
    <div className="flex flex-1 flex-col items-center gap-4 bg-petroleo px-7 pb-10 pt-6 text-center text-white">
      <div className="flex-1" />
      <Circle emoji="🎉" className="bg-white" />
      <h1 className="text-3xl font-black leading-tight">¡Bienvenido(a) a AYNI, {user?.firstName}!</h1>
      <Chip className="bg-white text-petroleo-osc">✅ Vecino(a) verificado(a)</Chip>
      <p className="text-lg font-semibold opacity-90">
        Ya eres parte de {sector?.name}. {vecinos} vecinos ya están aquí.
      </p>
      <div className="grid w-full grid-cols-3 gap-2.5">
        {[['🔧', 'Oficios'], ['🤝', 'Favores'], ['🛡️', 'Cuidarnos']].map(([e, l]) => (
          <div key={l} className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 p-3 text-sm font-extrabold">
            <span className="text-2xl" aria-hidden="true">{e}</span>
            {l}
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <Btn variant="blanco" onClick={() => reset('inicio')}>
        Entrar a AYNI →
      </Btn>
    </div>
  );
}
