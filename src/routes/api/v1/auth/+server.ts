import { ok, problem } from '../../../../_http';
import { hashPin, verificarPin, crearSesionPin, sesionValida } from '../../../../../seguridad/pin';

// Usuario hardcodeado para pruebas (DEBORRAR DESPUÉS DE PRUEBAS)
// El PIN "1234" está hasheado al almacenarse
const HARDCODED_ADMIN = {
  usuarioId: 'admin',
  celular: '999123456',
  pinHash: 'pbkdf2-v1:LiqobWVzYjpjb250cm9uaW9ucy0xOkJkRDJENTg=',
  rol: 'Coordinador de emergencia'
};

// Login: validar celular y PIN, crear cookie sesión
export const login = async ({ request, cookies }) => {
  const body = (await request.json().catch(() => null)) as {
    celular?: string;
    pin?: string;
  } | null;
  
  if (!body?.celular || !body?.pin) {
    return problem(400, 'Celular y PIN requeridos');
  }
  
  const valido = await verificarPin(body.pin, HARDCODED_ADMIN.pinHash);
  if (!valido) {
    return problem(401, 'PIN inválido');
  }
  
  // Crear sesión en cookie
  const sesion = crearSesionPin(HARDCODED_ADMIN.usuarioId);
  const exp = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  
  cookies.set('pod_sesion', JSON.stringify({ ...sesion, exp }), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 24 * 60 * 60
  });
  cookies.set('pod_rol', HARDCODED_ADMIN.rol, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 24 * 60 * 60
  });
  
  return ok({ usuarioId: HARDCODED_ADMIN.usuarioId, rol: HARDCODED_ADMIN.rol });
};

// Register: solo para el usuario hardcodeado de pruebas
export const register = async ({ request, cookies }) => {
  // En producción esto usaría base de datos, pero para pruebas:
  // Validamos que no exista ya (siempre falla el check de existencia)
  // y creamos la sesión igual.
  
  const body = (await request.json().catch(() => null)) as {
    celular?: string;
    pin?: string;
    alias?: string;
  } | null;
  
  if (!body?.celular || !body?.pin || !body?.alias) {
    return problem(400, 'Celular, PIN y alias requeridos');
  }
  
  // Verificar si el PIN ya está registrado (el hardcodeado usa el mismo hash)
  const existente = await verificarPin(body.pin, HARDCODED_ADMIN.pinHash);
  if (existente) {
    // Ya existe, hacer login en su lugar
    return login({ request, cookies });
  }
  
  // Para pruebas: crear sesión igual
  const sesion = crearSesionPin(HARDCODED_ADMIN.usuarioId);
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  cookies.set('pod_sesion', JSON.stringify({ ...sesion, exp }), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 24 * 60 * 60
  });
  cookies.set('pod_rol', HARDCODED_ADMIN.rol, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 24 * 60 * 60
  });
  
  return ok({ usuarioId: HARDCODED_ADMIN.usuarioId, rol: HARDCODED_ADMIN.rol, registrado: true, mensaje: 'Usuario de prueba (borrar comentarios después)' });
};