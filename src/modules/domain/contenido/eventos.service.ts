import { Injectable, NotFoundException } from '@nestjs/common';
import { EVENTOS_SEED } from './data/eventos.seed';

export interface FiltroEventos {
  /** `parapente`, `paramotor`, `ala-delta` o `general`. Vacío o `todos` = sin filtrar. */
  modalidad?: string;
  /** `inscripciones-abiertas`, `proximamente`, `en-curso` o `finalizado`. */
  estado?: string;
}

/** Eventos y competencias del sitio ("Novedades"). TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class EventosService {
  private readonly eventos = EVENTOS_SEED;

  /** Eventos filtrados por modalidad y/o estado, del más próximo al más lejano. */
  async listar({ modalidad, estado }: FiltroEventos = {}) {
    return this.eventos
      .filter((e) => !modalidad || modalidad === 'todos' || e.modalidad === modalidad)
      .filter((e) => !estado || e.estado === estado)
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
  }

  /** @throws NotFoundException si no existe un evento con ese slug. */
  async obtenerPorSlug(slug: string) {
    const evento = this.eventos.find((e) => e.slug === slug);
    if (!evento) throw new NotFoundException('Evento no encontrado');
    return evento;
  }
}
