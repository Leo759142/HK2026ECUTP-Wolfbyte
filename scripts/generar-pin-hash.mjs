import crypto from 'node:crypto';

const SALT_BYTES = 16;
const pin = '1234';

const salt = crypto.randomBytes(SALT_BYTES);
const saltB64 = salt.toString('base64');

// Compatible con la lógica de verificarPin() en src/seguridad/pin.ts:
// digest(SHA-256, pin + base64(salt))
const pinPlusSalt = pin + saltB64;
const hash = crypto.createHash('sha256').update(pinPlusSalt).digest();
const hashB64 = hash.toString('base64');

console.log(`pbkdf2-v1:${saltB64}:${hashB64}`);
