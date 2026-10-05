import { Injectable } from '@nestjs/common';
import { STATS_SEED } from './data/stats.seed';

/** Cifras institucionales de la portada (años, pilotos, clubes...). TODO: calcularlas desde la base. */
@Injectable()
export class StatsService {
  async obtener() {
    return STATS_SEED;
  }
}
