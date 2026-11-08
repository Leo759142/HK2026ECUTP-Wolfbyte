/* Componentes reutilizables (equivalen a los componentes del archivo de Figma).
 * Reglas de accesibilidad: áreas táctiles de mínimo 48px, íconos siempre con texto. */
import { cloneElement, isValidElement, useId, useRef } from 'react';
import { useApp } from '../AppContext';
import { NUMEROS_EMERGENCIA } from '../data';
import { Icon, emojiToIcon } from './iconos.jsx';

const BOTON = {
  primario: 'bg-petroleo text-white',
  acento: 'bg-morado text-white',
  rojo: 'bg-rojo text-white',
  borde: 'bg-white text-tinta border-2 border-linea',
  wa: 'bg-wa text-white',
  blanco: 'bg-white text-petroleo',
  bordeBlanco: 'bg-transparent text-white border-2 border-white',
};

export function Btn({ variant = 'primario', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-lg font-black leading-tight transition active:scale-[.98] disabled:opacity-40 disabled:active:scale-100 ${BOTON[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkBtn({ className = '', ...props }) {
  return (
    <button
      type="button"
      className={`min-h-[48px] w-full text-center text-sm font-extrabold text-petroleo underline-offset-4 hover:underline ${className}`}
      {...props}
    />
  );
}

export function Screen({ className = '', children }) {
  return <div className={`flex flex-1 flex-col gap-4 px-5 pb-6 pt-4 ${className}`}>{children}</div>;
}

export function Header({ title, right, onBack, light = false }) {
  const { back } = useApp();
  return (
    <div className="-ml-2 flex items-center gap-1">
      <button
        type="button"
        aria-label="Volver"
        onClick={onBack ?? back}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl font-black ${light ? 'text-white active:bg-white/15' : 'text-tinta active:bg-linea'}`}
      >
        <Icon name="volver" className="text-2xl font-black" />
      </button>
      <div className={`min-w-0 flex-1 truncate text-base font-extrabold ${light ? 'text-white' : 'text-gris'}`}>{title}</div>
      {right}
    </div>
  );
}

export const H1 = ({ className = '', children }) => <h1 className={`text-2xl font-black leading-tight ${className}`}>{children}</h1>;
export const Sub = ({ className = '', children }) => <p className={`text-base font-semibold leading-snug text-gris ${className}`}>{children}</p>;
export const Label = ({ children }) => <div className="text-sm font-extrabold text-gris">{children}</div>;

export function Chip({ className = 'bg-petroleo-claro text-petroleo-osc', children }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${className}`}>{children}</span>;
}

export const ChipPendiente = () => <Chip className="border border-dashed border-gris bg-white text-gris"><Icon name="reloj" className="text-gris" /> Pendiente de enviar</Chip>;

export function Card({ onClick, className = '', children }) {
  const base = `flex w-full gap-3 rounded-[20px] border border-linea bg-white p-3.5 text-left ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${base} transition active:scale-[.99]`}>
      {children}
    </button>
  ) : (
    <div className={base}>{children}</div>
  );
}

const CAMPO = 'w-full rounded-2xl border-2 border-linea bg-white px-4 text-base font-semibold text-tinta placeholder:text-gris/70 focus:border-morado focus:outline-none';

export const Input = ({ className = '', ...props }) => <input className={`${CAMPO} min-h-[52px] ${className}`} {...props} />;
export const TextArea = ({ className = '', ...props }) => <textarea rows={3} className={`${CAMPO} resize-none py-3 ${className}`} {...props} />;
export const Select = ({ className = '', ...props }) => <select className={`${CAMPO} min-h-[52px] ${className}`} {...props} />;

/** Campo con título. Si contiene un input/textarea/select, la etiqueta se vincula con htmlFor;
 *  si contiene grupos de botones, se usa role="group" (un <label> alrededor de varios botones
 *  hace que el navegador active siempre el primero). */
export function Field({ label, hint, children }) {
  const id = useId();
  const campoSimple = isValidElement(children) && [Input, TextArea, Select].includes(children.type);
  if (campoSimple) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-extrabold text-gris">{label}</label>
        {cloneElement(children, { id })}
        {hint && <span className="text-xs font-semibold text-gris">{hint}</span>}
      </div>
    );
  }
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1.5">
      <div id={id} className="text-sm font-extrabold text-gris">{label}</div>
      {children}
      {hint && <span className="text-xs font-semibold text-gris">{hint}</span>}
    </div>
  );
}

/** Pestañas tipo "segmento" (Presto · Regalo · Intercambio). */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-linea p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[48px] flex-1 rounded-xl px-2 text-sm font-extrabold ${value === o.id ? 'bg-white text-morado-osc shadow-sm' : 'text-gris'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Opciones simples en fila (Unas horas · 1 día · Varios días). */
export function Pills({ options, value, onChange, tone = 'morado' }) {
  const on = tone === 'rojo' ? 'border-rojo bg-rojo text-white' : 'border-morado bg-morado text-white';
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const id = typeof o === 'string' ? o : o.id;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={`min-h-[48px] flex-1 rounded-2xl border-2 px-3 text-sm font-extrabold ${value === id ? on : 'border-linea bg-white text-tinta'}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

const TONO_OPCION = {
  morado: 'border-morado bg-morado-claro text-morado-osc',
  rojo: 'border-rojo bg-rojo-claro text-rojo-osc',
  petroleo: 'border-petroleo bg-petroleo-claro text-petroleo-osc',
};
const COLS = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };

/** Botones grandes con ícono y texto (tipo de emergencia, necesidades, etiquetas). */
export function OptionGrid({ options, value, onChange, multi = false, cols = 3, tone = 'morado' }) {
  const isOn = (id) => (multi ? value.includes(id) : value === id);
  const toggle = (id) => {
    if (!multi) return onChange(id);
    return onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return (
    <div className={`grid gap-2.5 ${COLS[cols]}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={isOn(o.id)}
          onClick={() => toggle(o.id)}
          className={`flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-center text-xs font-extrabold leading-tight ${isOn(o.id) ? TONO_OPCION[tone] : 'border-linea bg-white text-tinta'}`}
        >
          {o.icon ? (
            <Icon name={o.icon} className="text-2xl" />
          ) : emojiToIcon(o.emoji) ? (
            <Icon name={emojiToIcon(o.emoji)} className="text-2xl" />
          ) : (
            <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-[56px] w-full items-center gap-3 text-left">
      <span className="flex-1">
        <span className="block text-base font-bold">{label}</span>
        {hint && <span className="block text-xs font-semibold text-gris">{hint}</span>}
      </span>
      <span className={`flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition ${checked ? 'justify-end bg-morado' : 'justify-start bg-linea'}`}>
        <span className="h-[26px] w-[26px] rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

export function Stepper({ value, onChange, min = 1, max = 20 }) {
  const btn = 'flex h-12 w-12 items-center justify-center rounded-full border-2 border-linea bg-white text-2xl font-black disabled:opacity-40';
  return (
    <div className="flex items-center gap-4">
      <button type="button" aria-label="Menos" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-6 text-center text-2xl font-black">{value}</span>
      <button type="button" aria-label="Más" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

/** Estados técnicos de la PWA: en línea (punto verde) o sin conexión (cintillo). */
export function ConnectionStatus() {
  const { online, t } = useApp();
  if (online) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-gris">
        <span className="h-2.5 w-2.5 rounded-full bg-wa" aria-hidden="true" />
        {t('enLinea')}
      </div>
    );
  }
  return (
    <div role="status" className="rounded-xl border border-ambar bg-ambar-claro px-3 py-2 text-sm font-bold">
      <Icon name="fa-wifi" /> {t('sinConexion')}
    </div>
  );
}

export function LangChip({ className = '' }) {
  const { go, settings } = useApp();
  return (
    <button
      type="button"
      onClick={() => go('ajustes')}
      aria-label="Cambiar idioma"
      className={`flex h-12 min-w-[72px] items-center justify-center gap-1 rounded-full border-[1.5px] border-linea bg-white px-3 text-sm font-extrabold text-tinta ${className}`}
    >
      <Icon name="fa-globe" /> {(settings?.lang ?? 'es').toUpperCase()}
    </button>
  );
}

export function Avatar({ letter, src = '/avatar-default.png', className = 'h-11 w-11 bg-ambar text-lg' }) {
  return (
    <img
      src={src}
      alt={letter ? `Avatar ${letter}` : 'Avatar'}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}

export function Circle({ emoji, className = 'bg-petroleo-claro' }) {
  return (
    <div className={`mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-5xl ${className}`} aria-hidden="true">
      {emoji}
    </div>
  );
}

export function EmptyState({ emoji, title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-linea bg-white px-5 py-8 text-center">
      <span className="text-4xl" aria-hidden="true">{emoji}</span>
      <div className="text-base font-black">{title}</div>
      {children && <div className="text-sm font-semibold text-gris">{children}</div>}
    </div>
  );
}

/** Hoja inferior (sheet) sobre la pantalla actual. */
export function Sheet({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-petroleo-osc/70" onClick={onClose}>
      <div role="dialog" aria-modal="true" className="flex max-h-[92dvh] w-full max-w-[430px] flex-col gap-3 overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-3" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto h-[5px] w-11 rounded-full bg-linea" />
        {children}
      </div>
    </div>
  );
}

/** Pantalla completa encima de todo (alertas de emergencia). */
export function FullOverlay({ className = 'bg-crema', children }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-petroleo-osc/40">
      <div role="alertdialog" aria-modal="true" className={`flex w-full max-w-[430px] flex-col overflow-y-auto ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function NumerosEmergencia() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {NUMEROS_EMERGENCIA.map((n) => (
        <a key={n.numero} href={`tel:${n.numero}`} className="flex min-h-[52px] flex-col items-center justify-center rounded-2xl border-2 border-rojo bg-white text-rojo-osc">
          <span className="text-sm font-black">{n.emoji} {n.numero}</span>
          <span className="text-[11px] font-bold">{n.label}</span>
        </a>
      ))}
    </div>
  );
}

export function PhotoPicker({ value, onChange }) {
  const input = useRef(null);
  const { notify } = useApp();
  const elegir = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onChange(await comprimirImagen(file));
    } catch {
      notify('No se pudo leer la foto');
    }
  };
  return (
    <div className="flex items-center gap-3">
      {value && <img src={value} alt="Foto adjunta" className="h-14 w-14 rounded-xl object-cover" />}
      <button type="button" onClick={() => input.current?.click()} className="min-h-[48px] rounded-full border-2 border-linea bg-white px-4 text-sm font-extrabold">
        <Icon name="fa-camera" /> {value ? 'Cambiar foto' : 'Agregar foto (opcional)'}
      </button>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="min-h-[48px] px-2 text-sm font-bold text-gris">
          Quitar
        </button>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={elegir} />
    </div>
  );
}

/** Pasos de un proceso (estado del reporte o del pedido de ayuda). */
export function Steps({ items }) {
  return (
    <ol className="flex flex-col gap-3 rounded-[20px] border border-linea bg-white p-4">
      {items.map(([icono, titulo, detalle, activo], i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">{icono}</span>
          <span className="flex-1">
            <span className={`block text-[15px] font-black ${activo ? 'text-tinta' : 'text-gris'}`}>{titulo}</span>
            {detalle && <span className="block text-xs font-semibold text-gris">{detalle}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function EmergencyBanner({ emergencia, tipo }) {
  return (
    <div className="bg-rojo px-5 pb-3 pt-3 text-sm font-extrabold text-white" role="status">
      <Icon name="fa-triangle-exclamation" /> Modo emergencia · {tipo?.label ?? 'Emergencia'}
      {emergencia?.zona && <span className="font-semibold opacity-90"> · {emergencia.zona}</span>}
    </div>
  );
}

