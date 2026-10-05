import { Injectable } from '@nestjs/common';
import { GALERIA_SEED } from './data/galeria.seed';

export interface FiltroGaleria {
  /** `parapente`, `paramotor`, `aladelta` o `novedades`. Vacío o `todos` = todas. */
  categoria?: string;
  /** Cantidad máxima de fotos a devolver. */
  limit?: number;
}

/** Tope del `limit` que se acepta, para que nadie pida el pool entero de una vez. */
const LIMIT_MAXIMO = 60;

/** Galería de fotos del sitio. TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class GaleriaService {
  private readonly fotos = GALERIA_SEED;

  /**
   * Devuelve una muestra AL AZAR de la categoría pedida: así cada visita ve
   * una tanda distinta (el frontend delega acá el muestreo, no recorta él).
   */
  async listar({ categoria, limit }: FiltroGaleria = {}) {
    const pool = this.fotos.filter((f) => !categoria || categoria === 'todos' || f.categoria === categoria);
    const n = Number.isInteger(limit) && limit > 0 ? Math.min(limit, LIMIT_MAXIMO) : pool.length;
    return mezclar(pool).slice(0, n);
  }
}

/** Fisher-Yates sobre una copia (no altera el pool original). */
function mezclar<T>(items: readonly T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
