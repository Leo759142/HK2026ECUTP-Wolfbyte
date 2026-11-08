/** Paleta AYNI (la misma que las variables del archivo de Figma).
 *  Regla de marca: el ROJO se usa SOLO para emergencias. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        crema: '#FBF7F0',
        tinta: '#143D48',
        gris: '#5B6870',
        linea: '#EAE3D6',
        mapa: '#EEF0EA',
        manzana: '#DDE3DC',
        wa: '#25D366',
        petroleo: { DEFAULT: '#0F4C5C', claro: '#E2EDEF', osc: '#0A3540' },
        morado: { DEFAULT: '#7B2CBF', claro: '#F1E8FA', osc: '#5A1E8F' },
        ambar: { DEFAULT: '#E8B04B', claro: '#FBF0D9' },
        rojo: { DEFAULT: '#D7263D', claro: '#FDE7EA', osc: '#A3142A', fondo: '#FFF5F5' },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
