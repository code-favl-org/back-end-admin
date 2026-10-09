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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
@ApiTags('Usuarios')
@Controller('admin/usuarios')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.admin)
  @Get()
  @Render(LIST_VIEW)
  @ApiOperation({ summary: 'Listado de cuentas', description: 'HTML con todas las cuentas, activas primero.' })
  async listado(@CurrentUser() currentUser: AuthUser) {
    return {
      usuarios: await this.users.listar(),
      puedeAdministrar: currentUser.roles.includes(Role.admin),
    };
  }

  @Roles(Role.admin)
  @Get('nuevo')
  @Render(NEW_VIEW)
  @ApiOperation({ summary: 'Formulario de alta', description: 'HTML con el formulario y los roles disponibles.' })
  nuevo() {
    return { action: LIST_PATH, roles: this.users.roles(), usuario: {} };
  }

  @Roles(Role.admin)
  @Post()
  @ApiOperation({ summary: 'Crear cuenta' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['usuario', 'email', 'role', 'password'],
      properties: {
        usuario: { type: 'string', maxLength: 50, example: 'jperez' },
        email: { type: 'string', format: 'email', maxLength: 254, example: 'jperez@favl.org.ar' },
        role: { type: 'string', description: 'Valor de {Role}: admin, editor, tesorero, cd, club o piloto.', example: 'editor' },
        password: { type: 'string', format: 'password', minLength: 8, example: 'contraseña123' },
      },
    },
  })
  @ApiResponse({ status: 302, description: 'Cuenta creada: redirige al listado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos: vuelve a mostrar el formulario con el error.' })
  @ApiResponse({ status: 409, description: 'Usuario o email repetido: vuelve a mostrar el formulario con el error.' })
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
  @ApiOperation({ summary: 'Formulario de edición', description: 'HTML con el formulario de la cuenta `id`.' })
  async editar(@Param('id', ParseIntPipe) id: number) {
    return {
      action: `${LIST_PATH}/${id}`,
      usuario: await this.users.obtener(id),
      roles: this.users.roles(),
    };
  }

  @Roles(Role.admin)
  @Post(':id')
  @ApiOperation({ summary: 'Guardar cambios de la cuenta' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['usuario', 'email', 'role'],
      properties: {
        usuario: { type: 'string', maxLength: 50, example: 'jperez' },
        email: { type: 'string', format: 'email', maxLength: 254, example: 'jperez@favl.org.ar' },
        role: { type: 'string', description: 'Valor de {Role}: admin, editor, tesorero, cd, club o piloto.', example: 'editor' },
        password: { type: 'string', format: 'password', minLength: 8, description: 'Vacío = no cambiar la contraseña.' },
      },
    },
  })
  @ApiResponse({ status: 302, description: 'Cambios guardados: redirige al listado.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos: vuelve a mostrar el formulario con el error.' })
  @ApiResponse({ status: 404, description: 'La cuenta no existe: vuelve a mostrar el formulario con el error.' })
  @ApiResponse({ status: 409, description: 'Usuario o email repetido: vuelve a mostrar el formulario con el error.' })
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
  @ApiOperation({ summary: 'Desactivar cuenta', description: 'Baja lógica: conserva el registro y bloquea el login.' })
  @ApiResponse({ status: 302, description: 'Redirige al listado.' })
  async desactivar(@Param('id', ParseIntPipe) id: number) {
    await this.users.desactivar(id);
  }

  @Roles(Role.admin)
  @Post(':id/activar')
  @Redirect(LIST_PATH)
  @ApiOperation({ summary: 'Activar cuenta', description: 'Vuelve a habilitar el login de una cuenta dada de baja.' })
  @ApiResponse({ status: 302, description: 'Redirige al listado.' })
  async activar(@Param('id', ParseIntPipe) id: number) {
    await this.users.activar(id);
  }
}
