import { Injectable } from '@nestjs/common';

/** Banners de la portada del sitio. TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class BannersService {
  /** Todos los banners, activos o no. */
  async listar() {
    return [
      { titulo: 'Banner principal', detalle: 'Activo desde 01/03/2026', imagen: 'https://placehold.co/600x200/0d6efd/fff?text=Banner+1' },
      { titulo: 'Banner secundario', detalle: 'Inactivo', imagen: 'https://placehold.co/600x200/20c997/fff?text=Banner+2' },
    ];
  }
}
