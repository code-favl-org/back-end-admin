import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiClientGuard } from './api-client.guard';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Registra los guards globales (valen para TODA la app, no hace falta importarlos
 * por módulo). El orden importa: primero se exige sesión, luego se chequean roles;
 * el de la API solo mira rutas /api/*.
 */
@Module({
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ApiClientGuard }, // solo actúa sobre /api/*
  ],
})
export class GuardsModule {}
