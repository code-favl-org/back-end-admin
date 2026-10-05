import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marca un controlador o ruta como de ACCESO ANÓNIMO.
 * Por defecto TODO exige sesión (AuthGuard global); `@Public()` es la excepción.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
