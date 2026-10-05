import { Injectable } from '@nestjs/common';

/** TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class ClubesService {
  private readonly clubes = ['Club Cóndor', 'Ala Delta Sur', 'Club Andino'];

  /** Nombres de los clubes (para los selectores de formularios). */
  async nombres(): Promise<string[]> {
    return this.clubes;
  }
}
