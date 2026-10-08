import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Redirect,
  Res,
  Render,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators';
import { Roles } from '../../common/authorization';
import type { AuthUser } from '../../common/types';
import { Role } from '../../common/types/role';
import { UsersService } from './users.service';

const LIST_PATH = '/admin/usuarios';
const LIST_VIEW = 'users/views/listado';
const NEW_VIEW = 'users/views/nuevo';
const EDIT_VIEW = 'users/views/editar';

/** Toda la administración de cuentas, incluida la lectura, es exclusiva de Admin. */
@Controller('admin/usuarios')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.admin)
  @Get()
  @Render(LIST_VIEW)
  async listado(@CurrentUser() currentUser: AuthUser) {
    return {
      usuarios: await this.users.listar(),
      puedeAdministrar: currentUser.roles.includes(Role.admin),
    };
  }

  @Roles(Role.admin)
  @Get('nuevo')
  @Render(NEW_VIEW)
  nuevo() {
    return { action: LIST_PATH, roles: this.users.roles(), usuario: {} };
  }

  @Roles(Role.admin)
  @Post()
  async crear(@Body() body: Record<string, unknown>, @Res() res: Response) {
    try {
      await this.users.crear(body);
      return res.redirect(LIST_PATH);
    } catch (error) {
      if (!(error instanceof BadRequestException || error instanceof ConflictException)) throw error;
      return res.status(error.getStatus()).render(NEW_VIEW, {
        action: LIST_PATH,
        roles: this.users.roles(),
        usuario: { usuario: body.usuario, email: body.email, role: body.role },
        error: error.message,
      });
    }
  }

  @Roles(Role.admin)
  @Get(':id/editar')
  @Render(EDIT_VIEW)
  async editar(@Param('id', ParseIntPipe) id: number) {
    return {
      action: `${LIST_PATH}/${id}`,
      usuario: await this.users.obtener(id),
      roles: this.users.roles(),
    };
  }

  @Roles(Role.admin)
  @Post(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    try {
      await this.users.actualizar(id, body);
      return res.redirect(LIST_PATH);
    } catch (error) {
      if (!(error instanceof BadRequestException || error instanceof ConflictException || error instanceof NotFoundException)) {
        throw error;
      }
      return res.status(error.getStatus()).render(EDIT_VIEW, {
        action: `${LIST_PATH}/${id}`,
        roles: this.users.roles(),
        usuario: { id, usuario: body.usuario, email: body.email, role: body.role },
        error: error.message,
      });
    }
  }

  @Roles(Role.admin)
  @Post(':id/desactivar')
  @Redirect(LIST_PATH)
  async desactivar(@Param('id', ParseIntPipe) id: number) {
    await this.users.desactivar(id);
  }

  @Roles(Role.admin)
  @Post(':id/activar')
  @Redirect(LIST_PATH)
  async activar(@Param('id', ParseIntPipe) id: number) {
    await this.users.activar(id);
  }
}
