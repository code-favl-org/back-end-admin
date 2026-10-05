import { Injectable } from '@nestjs/common';
import { AppConfig, InjectConfig } from '@common/config';

/** Ventana fija de 1 minuto. */
const WINDOW_MS = 60_000;
/** Por IP se tolera más que por cliente: detrás de una misma IP (colegio, oficina) hay muchos navegadores. */
const IP_FACTOR = 5;
/** Con más claves que esto se limpian las vencidas (evita que el mapa crezca sin tope). */
const PRUNE_AT = 10_000;

/**
 * Límite de uso de la API por cliente (cookie/key) y por IP. Frena a un scraper
 * aunque se haga de cookies nuevas (lo frena la IP) o comparta una (lo frena la cookie).
 *
 * Es EN MEMORIA: vale por instancia. Con varias instancias del servidor conviene
 * moverlo a Redis (misma interfaz).
 */
@Injectable()
export class RateLimitService {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(@InjectConfig() private readonly config: AppConfig) {}

  /**
   * Registra un pedido.
   * @returns `null` si puede seguir; si no, los segundos que debe esperar (para `Retry-After`).
   */
  hit(clientId: string, ip: string): number | null {
    const limit = this.config.api.rateLimitPerMinute;
    if (limit === 0) return null;

    const now = Date.now();
    if (this.hits.size > PRUNE_AT) this.prune(now);

    const waits = [this.count(`c:${clientId}`, limit, now), this.count(`ip:${ip}`, limit * IP_FACTOR, now)];
    const wait = Math.max(...waits.map((w) => w ?? 0));
    return wait > 0 ? wait : null;
  }

  private count(key: string, limit: number, now: number): number | null {
    let entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + WINDOW_MS };
      this.hits.set(key, entry);
    }
    entry.count++;
    return entry.count > limit ? Math.ceil((entry.resetAt - now) / 1000) : null;
  }

  private prune(now: number) {
    for (const [key, e] of this.hits) if (e.resetAt <= now) this.hits.delete(key);
  }
}
