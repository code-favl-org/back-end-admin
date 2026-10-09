import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * Portada del sitio: una sola fila con los textos que se editan en `/admin/web/inicio`.
 *
 * Los nombres de columna son los de la tabla `home` que ya existe en la base (`sub_title`,
 * `image_url`, `datetime(3)`): se declaran explícitos para que `DB_SYNCHRONIZE` no invente
 * columnas nuevas ni altere la tabla (si no coincidiera, el texto guardado quedaría en una
 * columna vieja y la pantalla se vería vacía).
 */
@Entity({ name: 'home' })
export class Home {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 240, nullable: true })
  title: string | null;

  @Column({ name: 'sub_title', type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3, nullable: true })
  updatedAt: Date | null;
}
