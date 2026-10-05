import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

/** Usuarios del backoffice (hoy en memoria, ver UsersService). */
@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
