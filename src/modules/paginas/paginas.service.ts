import { Injectable } from '@nestjs/common';

/** Páginas estáticas del sitio ("Quiénes somos", "Contacto"...). TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class PaginasService {
  /** Todas las páginas, publicadas o en borrador. */
  async listar() {
    return [
      { titulo: 'Quiénes somos', slug: '/quienes-somos', estado: 'Publicada' },
      { titulo: 'Contacto', slug: '/contacto', estado: 'Publicada' },
      { titulo: 'Reglamento', slug: '/reglamento', estado: 'Borrador' },
    ];
  }
}
