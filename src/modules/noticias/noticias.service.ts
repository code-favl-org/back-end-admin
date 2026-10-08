import { Injectable } from '@nestjs/common';

/** Estados posibles de una noticia. Solo las `Publicada` salen al sitio público. */
export type EstadoNoticia = 'Publicada' | 'Borrador';

/** Noticia tal como se guarda. La fecha va en ISO (aaaa-mm-dd); el backoffice la muestra dd/mm/aaaa. */
export interface Noticia {
  id: number;
  slug: string;
  titulo: string;
  resumen: string;
  imagen: string;
  fecha: string;
  autor: string;
  categoria: string;
  tags: string[];
  /** Si aparece en el carrusel de la portada del sitio. */
  destacadaEnHero: boolean;
  estado: EstadoNoticia;
}

/** "2026-03-02" -> "02/03/2026" (sin pasar por Date, para no correr el día por zona horaria). */
const aDdMmAaaa = (iso: string) => iso.split('-').reverse().join('/');

/**
 * Noticias del sitio. TODO: reemplazar por la base.
 * Una sola forma de datos para todos: el backoffice usa `listar()` / `obtener()`
 * y el sitio público (API) usa `listarPublicadas()`.
 */
@Injectable()
export class NoticiasService {
  private readonly noticias: Noticia[] = [
    {
      id: 1, slug: 'nuevo-record-argentino-ala-delta', titulo: 'Nuevo récord argentino en ala delta',
      resumen: 'El piloto cordobés Martín Díaz estableció un nuevo récord de distancia: 340 km sin motor.',
      imagen: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      fecha: '2026-03-02', autor: 'Admin', categoria: 'Competiciones',
      tags: ['Ala Delta', 'Récord', 'Distancia'], destacadaEnHero: true, estado: 'Publicada',
    },
    {
      id: 2, slug: 'copa-paramotor-noa-inscripciones', titulo: 'Copa Paramotor del NOA — Inscripciones abiertas',
      resumen: 'La competencia más esperada del norte argentino abre su inscripción para julio 2026.',
      imagen: 'https://www.polinithor.com/wp-content/uploads/2017/06/20240213-1-96.jpg',
      fecha: '2026-02-18', autor: 'Admin', categoria: 'Eventos',
      tags: ['Paramotor', 'Competencia', 'Inscripciones'], destacadaEnHero: true, estado: 'Publicada',
    },
    {
      id: 3, slug: 'campeonato-nacional-parapente-cobertura',
      titulo: 'Campeonato Nacional de Parapente: así se vivió la semana en Merlo',
      resumen: 'Más de 200 pilotos se dieron cita en San Luis para el evento más importante del año.',
      imagen: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&q=80',
      fecha: '2026-01-20', autor: 'Admin', categoria: 'Eventos',
      tags: ['Parapente', 'Campeonato', 'Cobertura'], destacadaEnHero: true, estado: 'Publicada',
    },
    {
      id: 4, slug: 'asamblea-anual', titulo: 'Asamblea anual',
      resumen: 'Convocatoria a la asamblea anual de la federación.',
      imagen: '', fecha: '2026-03-05', autor: 'Admin', categoria: 'Institucional',
      tags: ['Institucional'], destacadaEnHero: false, estado: 'Borrador',
    },
  ];

  categorias(): string[] {
    return ['Eventos', 'Competiciones', 'Institucional', 'Prensa'];
  }

  /** Todas las noticias (publicadas y borradores) para el backoffice, con la fecha ya en dd/mm/aaaa. */
  async listar() {
    return this.noticias.map((n) => ({ ...n, fecha: aDdMmAaaa(n.fecha) }));
  }

  /**
   * Lo que se muestra al público (API): solo las publicadas, de la más nueva a la
   * más vieja, SIN datos internos (autor, estado, categoría).
   */
  async listarPublicadas() {
    return this.noticias
      .filter((n) => n.estado === 'Publicada')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(({ id, slug, titulo, destacadaEnHero, tags, resumen, imagen, fecha }) => ({
        id, slug, titulo, destacadaEnHero, tags, resumen, imagen, fecha,
      }));
  }

  /** Detalle de una noticia (hoy devuelve siempre la misma de ejemplo, sin importar `id`). */
  async obtener(id: string) {
    return {
      id,
      titulo: 'Campeonato Argentino 2026',
      resumen: 'El campeonato nacional se disputará en marzo en la provincia de Córdoba.',
      contenido:
        '<p>La Federación Argentina de Vuelo Libre se complace en anunciar el <strong>Campeonato Argentino 2026</strong>, que se llevará a cabo durante el mes de marzo en la provincia de Córdoba.</p>' +
        '<p>El evento reunirá a los mejores pilotos del país en las categorías de <em>ala delta</em> y <em>parapente</em>.</p>' +
        '<h2>Sede y fechas</h2>' +
        '<p>La competencia se desarrollará en el valle de Punilla, con base en la localidad de <strong>La Cumbre</strong>.</p>' +
        '<blockquote>Esperamos superar los 120 participantes de la edición anterior.</blockquote>' +
        '<h2>Inscripciones</h2>' +
        '<ul><li>Socios FAVL: sin cargo</li><li>No socios: $15.000</li><li>Cierre de inscripción: 28 de febrero</li></ul>' +
        '<p>Más información en la sección de contacto.</p>',
      estado: 'publicada',
      fecha: '2026-03-15',
      autor: 'Administrador',
      categoria: 'Eventos',
      portada: 'photo1.png',
      portadaUrl: '/static/assets/img/photo1.png',
    };
  }

  /** Crea una noticia. @param dto Campos del formulario, sin validar todavía. */
  async crear(dto: Record<string, string>) {
    console.log('Nueva noticia:', dto); // TODO: validar + guardar (+ subir portada con multer)
  }

  /** Modifica la noticia `id`. @param dto Campos del formulario, sin validar todavía. */
  async actualizar(id: string, dto: Record<string, string>) {
    console.log('Actualizar noticia', id, dto); // TODO
  }
}
