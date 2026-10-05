import { Injectable } from '@nestjs/common';
import { SITIOS_SEED } from './data/sitios.seed';

export interface FiltroSitios {
  /** `parapente`, `paramotor` o `ala-delta`. Vacío o `todos` = todas. */
  modalidad?: string;
  /** `sitio`, `club` o `escuela`. Vacío = todos. */
  tipo?: string;
}

/** Puntos del mapa público: sitios de vuelo, clubes y escuelas. TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class SitiosService {
  private readonly sitios = SITIOS_SEED;

  async listar({ modalidad, tipo }: FiltroSitios = {}) {
    return this.sitios
      .filter((s) => !modalidad || modalidad === 'todos' || s.modalidades.includes(modalidad))
      .filter((s) => !tipo || s.tipo === tipo);
  }
}
