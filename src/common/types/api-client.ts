/**
 * Quién hace un pedido a la API (`/api/*`), sea cual sea el mecanismo con que
 * se identificó. Los controladores y guards trabajan con esto, no con cookies:
 * así se puede sumar un mecanismo nuevo sin tocar ningún endpoint.
 *
 *  - `visitor`: navegador anónimo del sitio público (cookie `favl_visitor`).
 *  - `user`:    usuario registrado.                         (reservado)
 *  - `apikey`:  otro sitio/servicio con API key o JWT.      (reservado, ver ApiAuthStrategy)
 */
export interface ApiClient {
  kind: 'visitor' | 'user' | 'apikey';
  /** Identificador estable del cliente (id de visitante, de usuario o de la key). Sirve para el límite de uso. */
  id: string;
}
