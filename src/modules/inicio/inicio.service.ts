import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { Home } from './entity/home.entity';

/** Portada tal como la usan el formulario y la vista: `titulo`, `subtitulo`, `descripcion` e `imagenUrl`. */
export interface PortadaInicio {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  /** URL de la imagen de portada (`/static/upload/...`), o null si no hay ninguna. */
  imagenUrl: string | null;
}

/** Cambios de imagen que no vienen de los campos de texto: no se envían si el formulario no los toca. */
export interface CambiosDeImagen {
  /** URL de la imagen recién subida: si viene, reemplaza a la anterior. */
  imagenUrl?: string;
  /** El usuario pidió sacar la imagen actual. */
  quitar?: boolean;
}

/** Portada sin datos: la pantalla tiene que poder abrirse aunque la tabla todavía no tenga filas. */
const PORTADA_VACIA: PortadaInicio = { titulo: '', subtitulo: '', descripcion: '', imagenUrl: null };

/** Contenido de la portada del sitio: la única fila de `home`, editable desde `/admin/web/inicio`. */
@Injectable()
export class InicioService {
  constructor(@InjectRepository(Home) private readonly home: Repository<Home>) {}

  /**
   * Textos e imagen actuales de la portada.
   *
   * Sin filas devuelve los campos vacíos en lugar de fallar: la fila se crea la primera vez que
   * alguien guarda desde el formulario, y la pantalla tiene que abrirse igual.
   */
  async obtener(): Promise<PortadaInicio> {
    const fila = await this.filaActual();
    if (!fila) return { ...PORTADA_VACIA };

    return {
      titulo: fila.title ?? '',
      subtitulo: fila.subtitle ?? '',
      descripcion: fila.description ?? '',
      imagenUrl: fila.imageUrl ?? null,
    };
  }

  /**
   * Guarda la portada: actualiza la fila actual o la crea si todavía no hay ninguna.
   *
   * Solo se escriben los campos que vienen en el pedido: si llega incompleto (por ejemplo, probando
   * desde Swagger) el resto queda como estaba, sin borrar contenido. Lo mismo con la imagen: si no
   * se sube un archivo ni se pide quitarla, se conserva la actual.
   *
   * Si se reemplaza o se quita la imagen, el archivo viejo se borra de `public/upload` **después** de
      * que el guardado salió bien (el borrado deduce la carpeta de la propia URL guardada, así funciona
      * igual para `/upload/inicio/...` y para las imágenes viejas que quedaron en la raíz); si se subió un
      * archivo y además se marcó "quitar", gana el archivo.
   *
   * @param dto Campos del formulario; los que no vengan se conservan.
   * @param cambios Imagen nueva y/o pedido de quitarla.
   */
  async guardar(dto: Partial<PortadaInicio>, cambios: CambiosDeImagen = {}): Promise<void> {
    const fila = await this.filaActual();
    const anterior = fila?.imageUrl ?? null;

    // undefined = no se toca la imagen (el formulario no mandó nada al respecto).
    const imagen = cambios.imagenUrl ?? (cambios.quitar ? null : undefined);

    const datos = {
      title: dto.titulo ?? fila?.title ?? '',
      subtitle: dto.subtitulo ?? fila?.subtitle ?? '',
      description: dto.descripcion ?? fila?.description ?? '',
    };

    if (fila) await this.home.update(fila.id, imagen === undefined ? datos : { ...datos, imageUrl: imagen });
    else await this.home.save(this.home.create({ ...datos, imageUrl: imagen ?? null }));

    // Recién cuando el guardado salió bien: la imagen reemplazada ya no la usa nadie.
    if (imagen !== undefined && anterior && anterior !== imagen) eliminarImagenSubida(anterior);
  }

  /**
   * Fila que se está editando: la última por `id` (la portada es una sola).
   *
   * Se usa `find` + `take` porque `findOne` de TypeORM exige condiciones (`where`) y acá no hay
   * ninguna con la que buscar: la tabla tiene una sola fila.
   */
  private async filaActual(): Promise<Home | null> {
    const [fila] = await this.home.find({ order: { id: 'DESC' }, take: 1 });
    return fila ?? null;
  }
}
