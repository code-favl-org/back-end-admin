import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/authorization';
import { FavlFormValidationFilter } from '../../common/filters/favl-form-validation.filter';
import { Role } from '../../common/types/role';
import { FavlSchoolDto } from './dto/favl-school.dto';
import { FavlSchoolsService } from './favl-schools.service';

const BASE_PATH = '/admin/favl/escuelas';
const LIST_VIEW = 'favl-schools/views/listado';
const FORM_VIEW = 'favl-schools/views/formulario';

@ApiTags('Administración FAVL - Escuelas')
@Roles(Role.admin)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: BASE_PATH,
  createTitle: 'Nueva escuela FAVL',
  editTitle: 'Editar escuela FAVL',
  formView: FORM_VIEW,
}))
@Controller('admin/favl/escuelas')
export class FavlSchoolsController {
  constructor(private readonly schools: FavlSchoolsService) {}

  @Get()
  async listado(@Res() response: Response) {
    return response.render(LIST_VIEW, {
      titulo: 'Escuelas FAVL',
      basePath: BASE_PATH,
      registros: await this.schools.listar(),
    });
  }

  @Get('nuevo')
  nuevo(@Res() response: Response) {
    return response.render(FORM_VIEW, {
      titulo: 'Nueva escuela FAVL',
      basePath: BASE_PATH,
      action: BASE_PATH,
      registro: {},
      creating: true,
    });
  }

  @Post()
  async crear(
    @Body() body: FavlSchoolDto,
    @Res() response: Response,
  ) {
    await this.schools.crear(body);
    return response.redirect(BASE_PATH);
  }

  @Get(':id/editar')
  async editar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return response.render(FORM_VIEW, {
      titulo: 'Editar escuela FAVL',
      basePath: BASE_PATH,
      action: `${BASE_PATH}/${id}`,
      registro: await this.schools.obtener(id),
      creating: false,
    });
  }

  @Post(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FavlSchoolDto,
    @Res() response: Response,
  ) {
    try {
      await this.schools.actualizar(id, body);
      return response.redirect(BASE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Editar escuela FAVL',
        basePath: BASE_PATH,
        action: `${BASE_PATH}/${id}`,
        registro: { id, ...body },
        creating: false,
        error: error.message,
      });
    }
  }

  @Post(':id/desactivar')
  async desactivar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.schools.cambiarEstado(id, false);
    return response.redirect(BASE_PATH);
  }

  @Post(':id/activar')
  async activar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.schools.cambiarEstado(id, true);
    return response.redirect(BASE_PATH);
  }
}
