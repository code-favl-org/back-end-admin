import {
  Body,
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Roles } from '../../common/authorization';
import { FavlFormValidationFilter } from '../../common/filters/favl-form-validation.filter';
import { Role } from '../../common/types/role';
import { imageUploads } from '../../common/upload/image-upload';
import { FavlPilotDto } from './dto/favl-pilot.dto';
import { FavlPilotsService } from './favl-pilots.service';

const BASE_PATH = '/admin/favl/pilotos';
const LIST_VIEW = 'favl-pilots/views/listado';
const FORM_VIEW = 'favl-pilots/views/formulario';
const FOTO_PILOTO = imageUploads('img/piloto');

@ApiTags('Administración FAVL - Pilotos')
@Roles(Role.admin)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: BASE_PATH,
  createTitle: 'Nuevo piloto FAVL',
  editTitle: 'Editar piloto FAVL',
  formView: FORM_VIEW,
}))
@Controller('admin/favl/pilotos')
export class FavlPilotsController {
  constructor(private readonly pilots: FavlPilotsService) {}

  @Get()
  async listado(@Res() response: Response) {
    return response.render(LIST_VIEW, {
      titulo: 'Pilotos FAVL',
      basePath: BASE_PATH,
      registros: await this.pilots.listar(),
    });
  }

  @Get('nuevo')
  nuevo(@Res() response: Response) {
    return response.render(FORM_VIEW, {
      titulo: 'Nuevo piloto FAVL',
      basePath: BASE_PATH,
      action: BASE_PATH,
      registro: {},
      creating: true,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('photo', FOTO_PILOTO.opciones))
  async crear(
    @Body() body: FavlPilotDto,
    @Res() response: Response,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo) throw new BadRequestException('La foto del piloto es obligatoria.');
    await this.pilots.crear(body, FOTO_PILOTO.urlDe(photo.filename));
    return response.redirect(BASE_PATH);
  }

  @Get(':id/editar')
  async editar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return response.render(FORM_VIEW, {
      titulo: 'Editar piloto FAVL',
      basePath: BASE_PATH,
      action: `${BASE_PATH}/${id}`,
      registro: await this.pilots.obtener(id),
      creating: false,
    });
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('photo', FOTO_PILOTO.opciones))
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FavlPilotDto,
    @Res() response: Response,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    try {
      await this.pilots.actualizar(
        id,
        body,
        photo ? FOTO_PILOTO.urlDe(photo.filename) : undefined,
      );
      return response.redirect(BASE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Editar piloto FAVL',
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
    await this.pilots.cambiarEstado(id, false);
    return response.redirect(BASE_PATH);
  }

  @Post(':id/activar')
  async activar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.pilots.cambiarEstado(id, true);
    return response.redirect(BASE_PATH);
  }
}
