import { createHmac } from 'crypto';

const SECRET = process.env.ADMIN_SESSION_SECRET ?? 'dev-secret-change-in-production';
const PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

export const SESSION_COOKIE = 'dental_admin';
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

/** Genera el token de sesión firmado con HMAC */
export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/** Verifica que el token sea válido y no haya expirado */
export function verifySessionToken(token: string): boolean {
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return false;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = createHmac('sha256', SECRET).update(payload).digest('hex');

  if (sig !== expectedSig) return false;

  // Verificar expiración
  const parts = payload.split(':');
  const ts = Number(parts[1]);
  if (isNaN(ts)) return false;

  return Date.now() - ts < SESSION_MAX_AGE * 1000;
}

/** Comprueba si la contraseña introducida es correcta */
export function checkPassword(password: string): boolean {
  // Comparación en tiempo constante para evitar timing attacks
  const expected = createHmac('sha256', SECRET).update(PASSWORD).digest('hex');
  const provided = createHmac('sha256', SECRET).update(password).digest('hex');
  return expected === provided;
}
