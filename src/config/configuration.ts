/**
 * Configuración tipada. Lee las MISMAS variables que back-end-public (.env):
 * base de datos (DB_*) y autenticación (AUTH_*, *_COOKIE*). Se obtiene inyectando
 * `APP_CONFIG` (atajo: `@InjectConfig()`); nadie debería leer `process.env` por su cuenta.
 */
export interface AppConfig {
  env: 'development' | 'production' | 'test';
  isProd: boolean;
  /** PORT (por defecto 3000). */
  port: number;
  /** Registra peticiones HTTP en consola y `logs/http-requests.log` (REQUEST_LOG, por defecto true). */
  requestLog: boolean;
  /** MariaDB: DB_HOST, DB_PORT (3306), DB_USERNAME, DB_PASSWORD, DB_NAME, DB_SYNCHRONIZE. */
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
  };
  auth: {
    /** AUTH_JWT_SECRET (mínimo 32 bytes): firma los access/refresh JWT. Debe ser el mismo que usa back-end-public. */
    jwtSecret: string;
    accessTokenTtlMs: number;
    refreshTokenTtlMs: number;
    /** Vida máxima de las cookies (AUTH_COOKIE_TTL_DAYS). */
    cookieTtlMs: number;
    /** Tope de toda la sesión, sin importar los refresh (AUTH_SESSION_ABSOLUTE_TTL_DAYS). */
    absoluteSessionTtlMs: number;
    /** Bypass local de login sin persistir sesiones (AUTH_DEV_LOGIN_BYPASS=true). */
    devLoginBypass: boolean;
    /** ACCESS_COOKIE / REFRESH_COOKIE: nombres de las cookies con los tokens. */
    accessCookie: string;
    refreshCookie: string;
    /**
     * Path de las cookies del backoffice = ADMIN_COOKIE_PATH (/admin). Los *_COOKIE_PATH
     * (/api) son del sitio público: ahí el navegador no mandaría las cookies a /admin.
     */
    cookiePath: string;
    /** ADMIN_COOKIE / ADMIN_COOKIE_ROLES: cookie marcadora (rol) que también setea back-end-public. Nunca se usa para autorizar. */
    adminCookie: string;
    adminCookieRoles: string[];
    /** Cookies solo por HTTPS: solo en producción (igual que back-end-public). */
    cookieSecure: boolean;
  };
}

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`Config inválida: falta la variable de entorno ${name}`);
  return value;
}

/** Entero positivo; vacío/ausente => `fallback`. */
function positiveInt(env: NodeJS.ProcessEnv, name: string, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0 || n > max) {
    throw new Error(`Config inválida: ${name}="${raw}" (entero positivo)`);
  }
  return n;
}

/** Lee una bandera booleana estricta; ausente o vacía equivale a false. */
function booleanFlag(env: NodeJS.ProcessEnv, name: string, fallback = false): boolean {
  const value = env[name];
  if (value === undefined || value === '') return fallback;
  if (value === 'false') return false;
  if (value === 'true') return true;
  throw new Error(`Config inválida: ${name} debe ser "true" o "false"`);
}

/**
 * Lee y VALIDA las variables de entorno una sola vez, al arrancar.
 * @param env Variables a leer (por defecto `process.env`; se inyecta en los tests).
 * @throws Error con el nombre de la variable cuando falta o es inválida.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`Config inválida: NODE_ENV="${nodeEnv}"`);
  }
  const isProd = nodeEnv === 'production';
  const dbSynchronize = booleanFlag(env, 'DB_SYNCHRONIZE');
  if (dbSynchronize && nodeEnv !== 'development') {
    throw new Error('Config inválida: DB_SYNCHRONIZE=true solo se permite con NODE_ENV=development');
  }
  const bypassValue = env.AUTH_DEV_LOGIN_BYPASS;
  if (bypassValue !== undefined && bypassValue !== 'true' && bypassValue !== 'false') {
    throw new Error('Config inválida: AUTH_DEV_LOGIN_BYPASS debe ser "true" o "false"');
  }
  const devLoginBypass = bypassValue === 'true';
  if (devLoginBypass && nodeEnv !== 'development') {
    throw new Error('Config inválida: AUTH_DEV_LOGIN_BYPASS solo se permite con NODE_ENV=development');
  }

  const jwtSecret = required(env, 'AUTH_JWT_SECRET');
  if (Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('Config inválida: AUTH_JWT_SECRET debe tener al menos 32 bytes');
  }

  return {
    env: nodeEnv as AppConfig['env'],
    isProd,
    port: positiveInt(env, 'PORT', 3000, 65535),
    requestLog: booleanFlag(env, 'REQUEST_LOG', true),
    db: {
      host: required(env, 'DB_HOST'),
      port: positiveInt(env, 'DB_PORT', 3306, 65535),
      username: required(env, 'DB_USERNAME'),
      password: required(env, 'DB_PASSWORD'),
      database: required(env, 'DB_NAME'),
      synchronize: dbSynchronize,
    },
    auth: {
      jwtSecret,
      accessTokenTtlMs: positiveInt(env, 'AUTH_ACCESS_TOKEN_TTL_MINUTES', 15) * MINUTE_MS,
      refreshTokenTtlMs: positiveInt(env, 'AUTH_REFRESH_TOKEN_TTL_DAYS', 7) * DAY_MS,
      cookieTtlMs: positiveInt(env, 'AUTH_COOKIE_TTL_DAYS', 7) * DAY_MS,
      absoluteSessionTtlMs: positiveInt(env, 'AUTH_SESSION_ABSOLUTE_TTL_DAYS', 30) * DAY_MS,
      devLoginBypass,
      accessCookie: env.ACCESS_COOKIE || 'favl_access',
      refreshCookie: env.REFRESH_COOKIE || 'favl_refresh',
      cookiePath: env.ADMIN_COOKIE_PATH || '/admin',
      adminCookie: env.ADMIN_COOKIE || 'ADMIN_COOKIE',
      adminCookieRoles: (env.ADMIN_COOKIE_ROLES ?? 'admin,superadmin')
        .split(',')
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean),
      cookieSecure: isProd,
    },
  };
}
