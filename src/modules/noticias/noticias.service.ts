import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { marcado } from '../../common/forms';
import { eliminarImagenSubida } from '../../common/upload/image-upload';
import { User } from '../users/entities/user.entity';
import { EstadoNoticia, NewsArticle } from './entity/news-article.entity';

/** Categorías que se ofrecen en el formulario aunque todavía no haya noticias con ellas. */
const CATEGORIAS_SUGERIDAS = ['Eventos', 'Competiciones', 'Institucional', 'Prensa'];

/** Máximos del formulario, para no guardar valores absurdos en columnas acotadas. */
const MAX_TAGS = 10;

/** Cambios de portada que no vienen de los campos de texto (mismo criterio que en `inicio`). */
export interface CambiosDePortada {
  /** URL de la imagen recién subida: si viene, reemplaza a la anterior. */
  imagenUrl?: string;
  /** El usuario pidió sacar la portada actual. */
  quitar?: boolean;
}

/** Autor de una noticia nueva: sale del usuario que la crea. */
export interface AutorNoticia {
  id: number;
  nombre: string;
}

/** Campos del formulario, tal como llegan (texto sin validar). */
export interface FormularioNoticia {
  titulo?: string;
  resumen?: string;
  contenido?: string;
  estado?: string;
  fecha?: string;
  categoria?: string;
  /** Etiquetas separadas por coma. */
  tags?: string;
  destacadaEnHero?: string | string[];
  quitarPortada?: string | string[];
}

/** Fila del listado, con la fecha ya en dd/mm/aaaa (como la muestra la tabla). */
export interface NoticiaListado {
  id: string;
  titulo: string;
  fecha: string;
  autor: string;
  categoria: string;
  estado: EstadoNoticia;
}

/** Noticia para el formulario: `fecha` en aaaa-mm-dd (lo que espera `<input type="date">`). */
export interface NoticiaDetalle {
  id: string;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  fecha: string;
  autor: string;
  categoria: string;
  tags: string[];
  destacadaEnHero: boolean;
  estado: EstadoNoticia;
  /** URL de la portada guardada (`/upload/...`), o null si no hay. */
  portadaUrl: string | null;
}

/** "2026-03-02" -> "02/03/2026" (sin pasar por Date, para no correr el día por zona horaria). */
const aDdMmAaaa = (iso: string) => iso.split('-').reverse().join('/');

/** Fecha de hoy en aaaa-mm-dd, tomando el día local (no UTC). */
function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Valor aaaa-mm-dd, o '' si el campo viene vacío o con otra cosa. */
function fechaIso(valor?: string): string {
  const texto = (valor ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : '';
}

/** Fecha de la base (columna `date`) como aaaa-mm-dd, sea string o Date. */
function aIso(valor: string | Date | null): string {
  if (!valor) return '';
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : valor.slice(0, 10);
}

/**
 * Estado tal como lo entiende el sistema: en la base puede haber quedado el valor viejo
 * con mayúscula, así que se normaliza al leer. Todo lo que empieza con "pub" es publicado.
 */
function estadoNormalizado(status: string | null): EstadoNoticia {
  return (status ?? '').toLowerCase().startsWith('pub') ? 'publicada' : 'borrador';
}

/** Estado válido para guardar, o undefined si el valor no es uno de los permitidos. */
function estadoValido(valor?: string): EstadoNoticia | undefined {
  const texto = (valor ?? '').trim().toLowerCase();
  return texto === 'publicada' || texto === 'borrador' ? texto : undefined;
}

/** Etiquetas del formulario (texto separado por comas) como lista sin repetidos ni vacíos. */
function tagsDe(valor?: string): string[] {
  const partes = (valor ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return [...new Set(partes)].slice(0, MAX_TAGS);
}

/** URL legible a partir del título: minúsculas, sin acentos ni símbolos. */
function slugify(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

/**
 * Noticias del sitio: lee y escribe la tabla `news_articles`, la misma que usa back-end-public
 * para la API pública y el sitio. Una sola forma de datos para los dos lados.
 */
@Injectable()
export class NoticiasService {
  constructor(
    @InjectRepository(NewsArticle) private readonly repo: Repository<NewsArticle>,
    @InjectRepository(User) private readonly usuarios: Repository<User>,
  ) {}

  /** Categorías para el selector del formulario: las sugeridas más las que ya se usaron. */
  async categorias(): Promise<string[]> {
    const filas = await this.repo
      .createQueryBuilder('noticia')
      .select('DISTINCT noticia.category', 'categoria')
      .where('noticia.category IS NOT NULL')
      .andWhere("noticia.category <> ''")
      .getRawMany<{ categoria: string }>();

    const usadas = filas.map((f) => f.categoria).filter((c) => !CATEGORIAS_SUGERIDAS.includes(c));
    return [...CATEGORIAS_SUGERIDAS, ...new Set(usadas)];
  }

  /** Todas las noticias (publicadas y borradores) para el backoffice, de la más nueva a la más vieja. */
  async listar(): Promise<NoticiaListado[]> {
    // Sin `content`: el cuerpo puede pesar MB (imágenes pegadas como data URL) y el listado no lo usa.
    const filas = await this.repo.find({
      select: { id: true, title: true, publishedDate: true, status: true, category: true, authorId: true },
      order: { publishedDate: 'DESC', id: 'DESC' },
    });
    const autores = await this.nombresDeAutores(filas.map((f) => f.authorId));

    return filas.map((fila) => {
      const fecha = aIso(fila.publishedDate);
      return {
        id: String(fila.id),
        titulo: fila.title ?? '',
        fecha: fecha ? aDdMmAaaa(fecha) : '',
        autor: autores.get(Number(fila.authorId)) ?? '',
        categoria: fila.category ?? '',
        estado: estadoNormalizado(fila.status),
      };
    });
  }

  /**
   * Lo que se muestra al público (API): solo las publicadas, de la más nueva a la más vieja,
   * SIN datos internos (autor, estado, categoría). Misma forma que devuelve back-end-public.
   */
  async listarPublicadas() {
    const filas = await this.repo.find({
      where: { status: 'publicada' },
      order: { publishedDate: 'DESC', id: 'DESC' },
    });

    return filas.map((fila) => ({
      id: Number(fila.id),
      slug: fila.slug,
      titulo: fila.title,
      destacadaEnHero: Boolean(fila.isFeaturedInHero),
      tags: fila.tags ?? [],
      resumen: fila.summary,
      imagen: fila.imageUrl,
      fecha: fila.publishedDate,
    }));
  }

  /** Una noticia con todos sus campos, para el formulario de edición. */
  async obtener(id: string): Promise<NoticiaDetalle> {
    const fila = await this.buscar(id);
    const autor = (await this.nombresDeAutores([fila.authorId])).get(Number(fila.authorId)) ?? '';

    return {
      id: String(fila.id),
      slug: fila.slug ?? '',
      titulo: fila.title ?? '',
      resumen: fila.summary ?? '',
      contenido: fila.content ?? '',
      fecha: aIso(fila.publishedDate),
      autor,
      categoria: fila.category ?? '',
      tags: fila.tags ?? [],
      destacadaEnHero: Boolean(fila.isFeaturedInHero),
      estado: estadoNormalizado(fila.status),
      portadaUrl: fila.imageUrl ?? null,
    };
  }

  /**
   * Crea una noticia con los datos del formulario.
   *
   * El autor es el usuario logueado (la tabla guarda `author_id`, no un nombre). El título es el
   * único campo obligatorio; el resto queda vacío y la noticia arranca como borrador.
   */
  async crear(dto: FormularioNoticia, autor: AutorNoticia, portada: CambiosDePortada = {}): Promise<void> {
    const titulo = (dto.titulo ?? '').trim();
    if (!titulo) throw new BadRequestException('El título es obligatorio.');

    await this.repo.save(
      this.repo.create({
        slug: await this.slugUnico(titulo),
        title: titulo,
        summary: (dto.resumen ?? '').trim() || null,
        content: dto.contenido || null,
        imageUrl: portada.imagenUrl ?? null,
        publishedDate: fechaIso(dto.fecha) || hoyIso(),
        status: estadoValido(dto.estado) ?? 'borrador',
        category: (dto.categoria ?? '').trim() || null,
        tags: tagsDe(dto.tags),
        isFeaturedInHero: marcado(dto.destacadaEnHero),
        authorId: autor.id > 0 ? autor.id : null,
      }),
    );
  }

  /**
   * Guarda los cambios de una noticia.
   *
   * Solo se escriben los campos que vienen en el pedido: si llega incompleto (por ejemplo, probando
   * desde Swagger) el resto queda como estaba. El `slug` no cambia al editar el título, porque es la
   * dirección pública de la noticia; solo se genera si el registro todavía no tenía.
   */
  async actualizar(id: string, dto: FormularioNoticia, portada: CambiosDePortada = {}): Promise<void> {
    const fila = await this.buscar(id);
    const anterior = fila.imageUrl ?? null;

    const cambios: Partial<NewsArticle> = {};
    if (dto.titulo !== undefined) {
      const titulo = dto.titulo.trim();
      if (!titulo) throw new BadRequestException('El título es obligatorio.');
      cambios.title = titulo;
    }
    if (dto.resumen !== undefined) cambios.summary = dto.resumen.trim() || null;
    if (dto.contenido !== undefined) cambios.content = dto.contenido || null;
    if (dto.categoria !== undefined) cambios.category = dto.categoria.trim() || null;
    if (dto.tags !== undefined) cambios.tags = tagsDe(dto.tags);
    if (dto.destacadaEnHero !== undefined) cambios.isFeaturedInHero = marcado(dto.destacadaEnHero);

    const estado = estadoValido(dto.estado);
    if (estado) cambios.status = estado;

    const fecha = fechaIso(dto.fecha);
    if (fecha) cambios.publishedDate = fecha;

    // undefined = no se toca la portada (el formulario no mandó nada al respecto).
    const imagen = portada.imagenUrl ?? (portada.quitar ? null : undefined);
    if (imagen !== undefined) cambios.imageUrl = imagen;

    if (!fila.slug) cambios.slug = await this.slugUnico(cambios.title ?? fila.title ?? '', fila.id);

    await this.repo.update(fila.id, cambios);

    // Recién cuando el guardado salió bien: la portada reemplazada ya no la usa nadie.
    if (imagen !== undefined && anterior && anterior !== imagen) eliminarImagenSubida(anterior);
  }

  // ---------------------------------------------------------------- internos

  /** Busca por id; si no existe (o el id no es un número), responde 404. */
  private async buscar(id: string): Promise<NewsArticle> {
    const numero = Number(id);
    const fila = Number.isSafeInteger(numero) ? await this.repo.findOne({ where: { id: numero } }) : null;
    if (!fila) throw new NotFoundException('La noticia no existe.');
    return fila;
  }

  /** Nombres de usuario de los autores, en una sola consulta (para no consultar por fila). */
  private async nombresDeAutores(ids: Array<number | null>): Promise<Map<number, string>> {
    const numeros = [...new Set(ids.map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))];
    if (numeros.length === 0) return new Map();

    const usuarios = await this.usuarios.find({ where: { id: In(numeros) }, select: ['id', 'usuario'] });
    return new Map(usuarios.map((u) => [u.id, u.usuario]));
  }

  /** Slug libre a partir del título: agrega `-2`, `-3`… si ya está usado. El de `excluirId` no cuenta. */
  private async slugUnico(titulo: string, excluirId?: number): Promise<string> {
    const base = slugify(titulo) || `noticia-${Date.now()}`;

    for (let n = 1; ; n++) {
      const candidato = (n === 1 ? base : `${base}-${n}`).slice(0, 220);
      const existente = await this.repo.findOne({ where: { slug: candidato }, select: ['id'] });
      if (!existente || existente.id === excluirId) return candidato;
    }
  }
}
