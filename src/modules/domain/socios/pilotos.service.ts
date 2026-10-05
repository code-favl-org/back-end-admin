import { Injectable, NotFoundException } from '@nestjs/common';
import { PILOTOS_SEED } from './data/pilotos.seed';

/** Verificación pública de pilotos ("Verificar piloto"). TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class PilotosService {
  private readonly pilotos = PILOTOS_SEED;

  /**
   * Busca un piloto por DNI o por número de licencia y devuelve SOLO lo que
   * puede verse públicamente (nunca el DNI).
   *
   * @param identificador DNI o licencia (ej.: `30111222` o `07-00451`). Ya viene validado por el controlador.
   * @throws NotFoundException si no hay coincidencia.
   */
  async verificar(identificador: string) {
    const p = this.pilotos.find((x) => x.dni === identificador || x.licencia === identificador);
    if (!p) throw new NotFoundException('No encontramos un piloto con ese DNI o licencia.');
    const { dni: _dni, ...publico } = p;
    return publico;
  }
}
