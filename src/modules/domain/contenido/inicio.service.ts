import { Injectable } from '@nestjs/common';

/** Contenido de la portada del sitio. TODO: leer/guardar en la base. */
@Injectable()
export class InicioService {
  /** Textos actuales de la portada. */
  async obtener() {
    return {
      titulo: 'Bienvenidos a FAVL',
      subtitulo: 'Federación Argentina de Vuelo Libre',
      descripcion: 'Somos la federación que agrupa a los clubes y pilotos de vuelo libre de Argentina.',
    };
  }

  /** Guarda los textos de la portada. @param dto Campos del formulario. */
  async guardar(dto: Record<string, string>) {
    console.log('Inicio:', dto); // TODO: guardar
  }
}
