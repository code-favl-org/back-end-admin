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
import { FavlNewPilotsService } from './favl-new-pilots.service';

const BASE_PATH = '/admin/favl/solicitudes-piloto';
const LIST_VIEW = 'favl-pilots/views/solicitudes-listado';
const FORM_VIEW = 'favl-pilots/views/solicitudes-formulario';
const FOTO_PILOTO = imageUploads('img/piloto');

@ApiTags('Administración FAVL - Solicitudes de piloto')
@Roles(Role.admin)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: BASE_PATH,
  createTitle: 'Nueva solicitud de piloto',
  editTitle: 'Editar solicitud de piloto',
  formView: FORM_VIEW,
}))
@Controller('admin/favl/solicitudes-piloto')
export class FavlNewPilotsController {
  constructor(private readonly newPilots: FavlNewPilotsService) {}

  @Get()
  async listado(@Res() response: Response) {
    return response.render(LIST_VIEW, {
      titulo: 'Solicitudes de piloto',
      basePath: BASE_PATH,
      registros: await this.newPilots.listar(),
    });
  }

  @Get('nuevo')
  nuevo(@Res() response: Response) {
    return response.render(FORM_VIEW, {
      titulo: 'Nueva solicitud de piloto',
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
    await this.newPilots.crear(body, FOTO_PILOTO.urlDe(photo.filename));
    return response.redirect(BASE_PATH);
  }

  @Get(':id/editar')
  async editar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return response.render(FORM_VIEW, {
      titulo: 'Editar solicitud de piloto',
      basePath: BASE_PATH,
      action: `${BASE_PATH}/${id}`,
      registro: await this.newPilots.obtener(id),
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
      await this.newPilots.actualizar(
        id,
        body,
        photo ? FOTO_PILOTO.urlDe(photo.filename) : undefined,
      );
      return response.redirect(BASE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Editar solicitud de piloto',
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
    await this.newPilots.cambiarEstado(id, false);
    return response.redirect(BASE_PATH);
  }

  @Post(':id/activar')
  async activar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.newPilots.cambiarEstado(id, true);
    return response.redirect(BASE_PATH);
  }
}
