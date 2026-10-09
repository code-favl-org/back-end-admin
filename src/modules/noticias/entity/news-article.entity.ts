import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Estados de una noticia en la base (`status`). Solo `publicada` sale al sitio público. */
export const ESTADOS_NOTICIA = ['borrador', 'publicada'] as const;
export type EstadoNoticia = (typeof ESTADOS_NOTICIA)[number];

/**
 * Noticia del sitio: la tabla `news_articles`, compartida con back-end-public.
 *
 * Las columnas y sus tipos son los MISMOS que declara back-end-public: si difirieran, la
 * sincronización de TypeORM (`DB_SYNCHRONIZE`) alteraría la tabla en cada arranque.
 *
 * `content` y `category` no estaban en el esquema original; las agrega
 * `private/sql/2026-10-09-news-articles-content-category.sql`.
 */
@Entity({ name: 'news_articles' })
export class NewsArticle {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 220, nullable: true })
  slug: string | null;

  @Column({ type: 'varchar', length: 240, nullable: true })
  title: string | null;

  @Column({ name: 'is_featured_in_hero', type: 'boolean', nullable: true })
  isFeaturedInHero: boolean | null;

  @Column({ name: 'tags_json', type: 'simple-json', nullable: true })
  tags: string[] | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  /**
   * Cuerpo de la noticia (HTML del editor).
   *
   * `longtext` y no `text`: el editor pega las imágenes como data URL dentro del HTML, así que un
   * cuerpo con una captura supera los 64 KB de `text` y el guardado falla con
   * "Data too long for column 'content'".
   */
  @Column({ type: 'longtext', nullable: true })
  content: string | null;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'published_date', type: 'date', nullable: true })
  publishedDate: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  status: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  category: string | null;

  @Column({ name: 'author_id', type: 'bigint', unsigned: true, nullable: true })
  authorId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3, nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, nullable: true })
  updatedAt: Date | null;
}
