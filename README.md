# FAVL (NestJS + React)

Backend NestJS (API + backoffice con Nunjucks) y sitio público en React (`frontend/`).

    npm install
    npm run start:dev          # backend en :3000 (backoffice y API)
    npm run dev:frontend       # sitio público en :5173 (reenvía /api al backend; requiere pnpm, ver frontend/README.md)

Para servir todo desde un solo puerto (como en producción): `npm run build:all` y `npm run start:prod`;
el sitio queda en http://localhost:3000/.

| Qué            | URL                                   | Acceso                         |
| -------------- | ------------------------------------- | ------------------------------ |
| Sitio público  | http://localhost:3000/ (dev: :5173)   | Anónimo (recibe cookie de visitante) |
| API            | http://localhost:3000/api/noticias    | Cookie de visitante (ver abajo) |
| Backoffice     | http://localhost:3000/admin           | Sesión + rol según la sección  |

En desarrollo se crean usuarios de ejemplo (contraseña `favl1234`, o `SEED_PASSWORD`):
`admin@`, `secretaria@`, `tesoreria@`, `comunicacion@` + `favl.local`. Ver `.env.example`.

### Cómo se ingresa

El sitio público (menú) tiene un botón **Ingresar** que lleva a `/admin/login`. Al loguearse, cada usuario
cae en la página de su rol (definida en `LANDING`, `backoffice/access.ts`), salvo que venga de una
ruta protegida: en ese caso vuelve a ella.

| Rol          | Página de inicio       |
| ------------ | ---------------------- |
| Admin        | `/admin/panel`         |
| Secretaría   | `/admin/socios`        |
| Tesorería    | `/admin/socios/cuotas` |
| Comunicación | `/admin/web/noticias`  |

### Login de desarrollo (probar roles rápido)

Con `DEV_LOGIN` activo (por defecto lo está fuera de producción), `/admin/login` muestra debajo
del formulario un panel **Modo desarrollo** con los usuarios de ejemplo: un clic y se entra como
ese usuario, sin contraseña. Para cambiar de rol: *Cerrar sesión* y elegir otro.

- Se apaga con `DEV_LOGIN=false`. En producción la app **no arranca** si `DEV_LOGIN=true`.
- Con el login apagado, `POST /admin/dev-login` responde 404.
- Código: `backoffice/auth/dev-login.controller.ts`.

### Documentación de rutas (Swagger)

La UI de Swagger queda en **`/admin/docs`** y el OpenAPI crudo en `/admin/docs/openapi.json`
(con el `PORT` del `.env`: p. ej. http://localhost:5000/admin/docs). Lista todas las rutas del
backoffice con sus formularios; para probar una privada alcanza con hacer `POST /admin/login`
desde la propia UI, que deja la sesión en cookies. Se configura en `src/config/swagger.config.ts`.

## Estructura

    frontend/                  Sitio público (React + Vite). Se compila a frontend/dist y Nest lo sirve en `/`.
    src/
      common/                  Base compartida. No depende de nada de modules/.
        config/                Variables de entorno tipadas y validadas (AppConfig)
        types/                 Role, AuthUser, canAccess(), tipado de req.user
        hashing/               HashingService (scrypt)
        decorators/            @Public(), @Roles(...), @CurrentUser()
        guards/                AuthGuard + RolesGuard (globales)
      modules/
        core/                  Infraestructura: usuarios, sesión del backoffice,
                               identificación de clientes de la API (api-auth/), motor de vistas
        domain/                Lógica de negocio: socios, clubes, contenido
        api/                   /api/...    JSON para el sitio público (un controlador por recurso)
        public/                /           sirve el frontend compilado (SpaFallbackFilter)
        backoffice/            /admin/...  administración con roles
          access.ts            Matriz rol -> sección (única fuente de verdad)
          menu.ts              Menú lateral (se filtra solo según el rol)
          <seccion>/views/     Vistas de cada sección
          shared/views/        Layout, partials y macros

Alias: `@common/*` -> `src/common/*`, `@modules/*` -> `src/modules/*`.

### Dependencias permitidas

    common  <-  core  <-  domain  <-  api · public · backoffice

- `common` no importa de `modules`; `domain` no sabe quién lo consume.
- `api`, `public` y `backoffice` **no se importan entre sí**: comparten código vía `domain`.

## Acceso: cómo funciona

- **Todo exige sesión por defecto** (`AuthGuard` global). Lo anónimo se marca con `@Public()`.
  Olvidarse el decorador da un 401 visible, nunca una puerta abierta.
- **Roles**: `@Roles(...ACCESS.socios)` en la clase o en el método (el método pisa a la clase).
  `Admin` siempre pasa. Sin `@Roles`, alcanza con estar logueado.
- **Agregar una sección al backoffice**: 1) sumarla a `ACCESS`, 2) `@Roles(...ACCESS.x)` en su
  controlador, 3) `roles: ACCESS.x` en `menu.ts`.
- **Agregar un rol**: sumarlo a `Role` y a `ROLE_LABELS` (`common/types/role.ts`) y a `LANDING`
  (`backoffice/access.ts`); TypeScript avisa si falta alguno.
- **Autenticación**: cookie firmada (HMAC) solo con el id de usuario; los roles se leen en cada
  request. Toda la lógica de la cookie (crear, leer, borrar) está en `SessionService`. Solo rige bajo `/admin`: `api` y `public` no ven sesiones.
- Sin sesión, `/admin/*` redirige a `/admin/login`; sin permiso muestra la página 403.

## Cookies y acceso a la API

El sitio usa **dos cookies**, ambas firmadas (HMAC) y `HttpOnly`:

| Cookie          | Quién                  | Path     | Dura                | Código                         |
| --------------- | ---------------------- | -------- | ------------------- | ------------------------------ |
| `favl_visitor`  | Todo navegador anónimo | `/`      | 30 días (renovable) | `core/api-auth/visitor.service.ts` |
| `favl_session`  | Usuario registrado     | `/admin` | 8 horas             | `core/auth/session.service.ts` |

**Para qué la de visitante**: que `/api/*` no sea una puerta abierta. Todo pedido a la API
(`ApiClientGuard`, global) necesita un cliente identificado, y cada cliente tiene un límite de
uso (`API_RATE_LIMIT_PER_MIN`, por navegador y por IP). Sin cookie válida la API responde `401` con
`code: "visitor_required"`.

- La cookie se entrega al abrir **cualquier página** del sitio (`VisitorMiddleware`), antes de la primera
  llamada a la API. (En desarrollo con `dev:frontend` el HTML lo sirve Vite, no Nest: ahí la cookie llega por
  el reintento de abajo.) Si un pedido llega sin ella, esa misma respuesta `401` la trae y el frontend
  reintenta una vez (`frontend/src/services/http.js`).
- **Alcance real**: una cookie anónima no es un secreto; un scraper puede conseguirla abriendo el sitio como
  cualquier navegador. Lo que cambia es que ya no alcanza con pegarle directo a `/api`: tiene que comportarse
  como un visitante, y entonces queda sujeto al límite por cookie y por IP, y se lo puede cortar.
- Las respuestas de `/api` salen con `Cache-Control: private` y `Vary: Cookie` (ningún CDN las reparte a quien
  no se identificó).

### Opción B: otros sitios con API key o JWT

`ApiClientMiddleware` prueba una lista ordenada de **estrategias** (`ApiAuthStrategy`) y deja el resultado en
`req.client`; los controladores y el guard no saben cuál se usó. Hoy hay una (`VisitorCookieStrategy`, opción A).
Para sumar otra:

1. Crear una clase que implemente `ApiAuthStrategy` (ej.: leer `X-API-Key` o `Authorization: Bearer <jwt>` y
   devolver `{ kind: 'apikey', id }`).
2. Agregarla, antes de la cookie, a `API_AUTH_STRATEGIES` (`core/api-auth/api-auth.module.ts`).
3. Si se consume desde otro dominio desde un navegador, habilitar CORS para esos orígenes (hoy no hay: el
   sitio y la API comparten dominio). Un servidor que llama a la API no lo necesita.

El límite de uso ya cuenta por `req.client.id`, así que cada key tendría el suyo.

### Frontend: ajustes hechos para integrarlo

- `vite.config.js`: `base: '/'` (links directos como `/novedades/x` cargan bien) y proxy `/api` -> `:3000` en desarrollo.
- `.env`: `VITE_API_URL=/api` (mismo origen: la cookie viaja sola).
- `src/services/http.js`: reintento único ante `visitor_required`.
- `Navbar.jsx`: **Ingresar** enlaza a `/admin/login`. El login de usuarios registrados es el del backoffice;
  el modal propio de login, `Mi perfil` y `Mi espacio` del frontend quedan sin backend (ver abajo).

## Pendiente antes de producción

- **API de usuarios registrados del frontend**: `/api/auth/login|refresh|logout|forgot-password|reset-password`,
  `/me/profile`, etc. no existen (`/api/auth/me` responde siempre 401). Hay que decidir si esas pantallas
  (Mi perfil, Mi espacio, recuperar contraseña) se eliminan del frontend o se implementan.
- Los servicios de `domain` (eventos, galería, sitios, stats, pilotos, noticias) usan datos de ejemplo
  (`domain/**/data/*.seed.ts`, copiados de `frontend/src/mocks`).
- El límite de uso es en memoria (por instancia): con varias instancias, moverlo a Redis.
- `/api/verificarPiloto/:id` es una consulta pública por DNI/licencia: es el endpoint más atractivo para
  scraping (enumerar números). Conviene un límite propio más estricto que el general.
- `UsersService` usa datos en memoria: conectarlo a la base.
- Token **CSRF** en los formularios POST (hoy solo mitiga `SameSite=Lax`).
- **Límite de intentos** en `POST /admin/login`.
- Detrás de un proxy/HTTPS definir `SESSION_SECRET` (obligatoria en producción).
