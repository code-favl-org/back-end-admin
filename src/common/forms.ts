/**
 * Los checkbox de un formulario llegan como texto. Cuando van acompañados de un input oculto con el
 * mismo nombre (patrón para distinguir "sin marcar" de "no vino en el pedido") llegan dos valores,
 * por ejemplo `["no", "si"]`: cuenta el último, que es el del checkbox.
 */
export function marcado(valor: string | string[] | undefined | null): boolean {
  const ultimo = Array.isArray(valor) ? valor[valor.length - 1] : valor;
  return ['on', 'si', 'sí', 'true', '1'].includes((ultimo ?? '').toLowerCase());
}
