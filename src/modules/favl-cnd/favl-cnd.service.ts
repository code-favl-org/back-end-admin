import { Injectable, Logger } from '@nestjs/common';

/**
 * MOCKUP: la CND (Copa Nacional de Distancia) todavía no expone una API propia.
 * Se consulta una URL de ejemplo para dejar armado el circuito externo; cuando
 * exista el endpoint real, se reemplaza acá.
 */
const CND_API_URL = 'https://example.com';

export interface CndApiResult {
  url: string;
  ok: boolean;
  status: number | null;
  detalle: string;
}

@Injectable()
export class FavlCndService {
  private readonly logger = new Logger(FavlCndService.name);

  async consultarApiExterna(): Promise<CndApiResult> {
    try {
      const response = await fetch(CND_API_URL, { headers: { Accept: 'application/json' } });
      return {
        url: CND_API_URL,
        ok: response.ok,
        status: response.status,
        detalle: response.ok
          ? 'La API externa respondió correctamente.'
          : 'La API externa respondió con error.',
      };
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error);
      this.logger.warn(`No se pudo consultar la API externa de CND: ${detalle}`);
      return {
        url: CND_API_URL,
        ok: false,
        status: null,
        detalle: 'No se pudo contactar la API externa.',
      };
    }
  }
}
