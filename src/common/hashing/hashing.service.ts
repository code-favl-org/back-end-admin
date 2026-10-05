import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';

// scrypt con N=2^15, r=8, p=3 (~32 MiB por hash, valores recomendados por OWASP).
const N = 32768;
const R = 8;
const P = 3;
const KEYLEN = 64;
const MAXMEM = 64 * 1024 * 1024;

function derive(plain: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(plain, salt, KEYLEN, { N: n, r, p, maxmem: MAXMEM }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

/**
 * Hash de contraseñas. Formato guardado:  scrypt$N$r$p$<salt b64>$<hash b64>
 * Los parámetros viajan dentro del hash, así se puede subir el costo más
 * adelante sin invalidar los hashes viejos.
 */
@Injectable()
export class HashingService {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(plain, salt, N, R, P);
    return ['scrypt', N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [scheme, n, r, p, saltB64, keyB64] = stored.split('$');
    if (scheme !== 'scrypt' || !keyB64) return false;
    const expected = Buffer.from(keyB64, 'base64');
    const actual = await derive(plain, Buffer.from(saltB64, 'base64'), +n, +r, +p);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
