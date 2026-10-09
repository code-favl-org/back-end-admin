import { randomBytes } from 'crypto';
import { mkdirSync, rmSync } from 'fs';
import { basename, extname, join, resolve, sep } from 'path';
import { BadRequestException } from '@nestjs/common';
import { diskStorage, type Options as MulterOptions } from 'multer';

/** Raíz física de las imágenes subidas: dentro de `public`, que main.ts sirve bajo `/static/`. */
export const UPLOAD_DIR = join(process.cwd(), 'public', 'upload');

/** Ruta pública de esa raíz; es la base de la URL que se guarda en la base (ver main.ts). */
export const UPLOAD_URL_PREFIX = '/upload';

/** Tope por archivo: 2 MB, igual que el formulario de noticias. */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Formatos aceptados, con la extensión que se le da al archivo guardado.
 * SVG queda afuera a propósito: es un documento que puede traer scripts, no una imagen inofensiva.
 */
const EXTENSION_POR_TIPO: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

/** Subida de imágenes preparada para un uso concreto, con su carpeta dentro de `public/upload`. */
export interface SubidaDeImagenes {
  /** Para `@UseInterceptors(FileInterceptor('campo', subida.opciones))`. */
  opciones: MulterOptions;
  /** URL pública del archivo recién subido: es lo que se guarda en la base. */
  urlDe(nombre: string): string;
}

/**
 * Nombre del archivo guardado: parte del original (sin acentos ni símbolos) más una marca única.
 * La extensión sale del tipo de contenido aceptado, nunca del nombre que manda el navegador: así no
 * se puede guardar un `.html` o un `.js` haciéndolo pasar por imagen.
 */
function nombreArchivo(originalname: string, mimetype: string): string {
  const base = basename(originalname, extname(originalname))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  const marca = `${Date.now()}-${randomBytes(4).toString('hex')}`;
  return `${base ? `${base}-` : ''}${marca}${EXTENSION_POR_TIPO[mimetype]}`;
}

/**
 * Carpeta relativa segura dentro de `public/upload`: minúsculas, números, guiones y barras.
 * Se valida al preparar la subida (viene del código, no del usuario) para que un valor mal escrito
 * falle al arrancar y no escriba archivos fuera de lugar.
 */
function normalizarCarpeta(carpeta: string): string {
  const limpia = carpeta.replace(/^\/+|\/+$/g, '');
  if (limpia === '') return '';
  if (!/^[a-z0-9][a-z0-9/_-]*$/.test(limpia) || limpia.includes('..')) {
    throw new Error(`Carpeta de subida inválida: "${carpeta}"`);
  }
  return limpia;
}

/**
 * Prepara la subida de imágenes en `public/upload/<carpeta>`, servidas como `/upload/<carpeta>/...`.
 *
 * Las opciones del interceptor y el armado de la URL van juntos a propósito: la carpeta donde se
 * escribe el archivo y la ruta que se guarda en la base tienen que ser la misma, así no se pueden
 * desincronizar.
 *
 * @param carpeta Subcarpeta de `public/upload` para este uso (`'noticias'`, `'inicio'`, …). No tiene
 *   valor por defecto a propósito: cada uso decide dónde guardar, en vez de caer en la raíz sin querer.
 *   Para usar la raíz hay que pedirlo explícitamente con `imageUploads('')`.
 */
export function imageUploads(carpeta: string): SubidaDeImagenes {
  const relativa = normalizarCarpeta(carpeta);
  const destino = relativa ? join(UPLOAD_DIR, relativa) : UPLOAD_DIR;
  const urlBase = relativa ? `${UPLOAD_URL_PREFIX}/${relativa}` : UPLOAD_URL_PREFIX;

  return {
    opciones: {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            mkdirSync(destino, { recursive: true });
            cb(null, destino);
          } catch (error) {
            cb(error as Error, destino);
          }
        },
        filename: (_req, file, cb) => cb(null, nombreArchivo(file.originalname, file.mimetype)),
      }),
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        if (!EXTENSION_POR_TIPO[file.mimetype]) {
          // Con un error multer corta el pedido: el archivo no se guarda y el filtro de subida
          // del backoffice devuelve este mensaje al formulario.
          cb(new BadRequestException(`Formato no permitido (${file.mimetype}). Usá PNG, JPG, WEBP o GIF (máx. 2 MB).`));
          return;
        }
        cb(null, true);
      },
    },
    urlDe: (nombre: string) => `${urlBase}/${nombre}`,
  };
}

/**
 * Ruta relativa a `public/upload` de una URL guardada, o null si no es un archivo nuestro.
 *
 * Se toma lo que sigue a `/upload/`, así funciona igual para la raíz y para las subcarpetas
 * (`/upload/news/x.png`) y también para las filas viejas con `/static/upload/...`. Las URLs externas
 * (`https://...`, `//host/...`) no son nuestras y no se tocan.
 */
function rutaRelativaDeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return null;

  const sinQuery = url.split('?')[0].split('#')[0];
  const marca = `${UPLOAD_URL_PREFIX}/`;
  const desde = sinQuery.indexOf(marca);
  const relativa = (desde >= 0 ? sinQuery.slice(desde + marca.length) : sinQuery).replace(/^\/+/, '');

  return relativa !== '' && !relativa.includes('..') ? relativa : null;
}

/**
 * Borra la imagen subida a la que apunta una URL guardada, si el archivo está dentro de `UPLOAD_DIR`.
 * Nunca lanza: si no hay nada que borrar, si la URL es externa o si el borrado falla, el guardado sigue.
 */
export function eliminarImagenSubida(url: string | null | undefined): void {
  const relativa = rutaRelativaDeUrl(url);
  if (!relativa) return;

  const raiz = resolve(UPLOAD_DIR);
  const ruta = resolve(raiz, relativa);
  // La URL viene de la base, pero igual se comprueba que apunte dentro de la carpeta de subidas.
  if (ruta !== raiz && !ruta.startsWith(raiz + sep)) return;

  try {
    rmSync(ruta, { force: true });
  } catch {
    // Queda un archivo huérfano en disco: no vale la pena romper el guardado por eso.
  }
}
