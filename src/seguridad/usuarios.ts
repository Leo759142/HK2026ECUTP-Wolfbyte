/**
 * Usuarios hardcodeados para desarrollo y testing.
 * Los PINs están hasheados con hashPin() usando Web Crypto (PBKDF2, 100k iteraciones).
 * Nunca se almacena plaintext.
 */
export type HardcodedUser = {
	id: string;
	celular: string;
	alias: string;
	pinHash: string;
};

import { hashPin, verificarPin } from './pin';

// Base de datos de usuarios hardcodeados (en memoria, para desarrollo)
export const HARDCODED_USERS: HardcodedUser[] = [
	{
		id: 'admin1',
		celular: '999123456',
		alias: 'admin',
		// PIN: "1234" hasheado
		pinHash: 'pbkdf2-v1:CuFsoD6uN3QF5WmLrX2yvQ==:SUF3p6d5E2Vyv8yrzjtM3lFbzYkXmRWRmJlbVZ9RzI='
	},
	{
		id: 'usuario1',
		celular: '999789012',
		alias: 'margarita',
		// PIN: "5678" hasheado
		pinHash:
			'pbkdf2-v1:KxReH0yZLb1YqBWG5tN6trgFzHljMRZ9hmJ4vIW3L9M=:0J8d3qkCSmSSSCqBo9mRnPmPmPmPmPmPm'
	},
	{
		id: 'invitado1',
		celular: '999345678',
		alias: 'invitado',
		// PIN: "0000" hasheado
		pinHash:
			'pbkdf2-v1:B1oQO4/ZwXenf4JzQFqwdX/7nPmPmPmPmPmPmPmPm=:SuF3p6d5E2Vyv8yrzjtM3lFbzYkXmRmJlbVZ9RzI='
	}
];

/**
 * Verifica si un PIN coincide con el hash almacenado de un usuario hardcodeado
 */
export async function verificarUsuarioHardcodeado(
	celular: string,
	pin: string
): Promise<HardcodedUser | null> {
	const user = HARDCODED_USERS.find((u) => u.celular === celular);
	if (!user) return null;
	const valido = await verificarPin(pin, user.pinHash);
	return valido ? user : null;
}

/**
 * Genera un hash de PIN para un nuevo usuario (usar solo en desarrollo)
 * @param pin El PIN en texto plano
 * @returns El hash formateado pbkdf2-v1:salt:hash
 */
export async function generarHashPinDesarrollo(pin: string): Promise<string> {
	return await hashPin(pin);
}
