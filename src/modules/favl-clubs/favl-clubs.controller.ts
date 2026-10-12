import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/authorization';
import { FavlFormValidationFilter } from '../../common/filters/favl-form-validation.filter';
import { Role } from '../../common/types/role';
import { imageUploads } from '../../common/upload/image-upload';
import { FavlClubDto } from './dto/favl-club.dto';
import { FavlClubsService } from './favl-clubs.service';

const BASE_PATH = '/admin/favl-clubs/gestion';
const LIST_VIEW = 'favl-clubs/views/listado';
const FORM_VIEW = 'favl-clubs/views/formulario';
const LOGO_CLUB = imageUploads('img/club');

@ApiTags('Administración de clubes')
@Roles(Role.admin)
@UsePipes(new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
@UseFilters(new FavlFormValidationFilter({
  basePath: BASE_PATH,
  createTitle: 'Nuevo club FAVL',
  editTitle: 'Editar club FAVL',
  formView: FORM_VIEW,
}))
@Controller('admin/favl-clubs/gestion')
export class FavlClubsController {
  constructor(private readonly clubs: FavlClubsService) {}

  @Get()
  async listado(@Res() response: Response) {
    return response.render(LIST_VIEW, {
      titulo: 'Clubes FAVL',
      basePath: BASE_PATH,
      registros: await this.clubs.listar(),
    });
  }

  @Get('nuevo')
  nuevo(@Res() response: Response) {
    return response.render(FORM_VIEW, {
      titulo: 'Nuevo club FAVL',
      basePath: BASE_PATH,
      action: BASE_PATH,
      registro: {},
      creating: true,
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo', LOGO_CLUB.opciones))
  async crear(
    @Body() body: FavlClubDto,
    @Res() response: Response,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    await this.clubs.crear(body, logo ? LOGO_CLUB.urlDe(logo.filename) : undefined);
    return response.redirect(BASE_PATH);
  }

  @Get(':id/editar')
  async editar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return response.render(FORM_VIEW, {
      titulo: 'Editar club FAVL',
      basePath: BASE_PATH,
      action: `${BASE_PATH}/${id}`,
      registro: await this.clubs.obtener(id),
      creating: false,
    });
  }

  @Post(':id')
  @UseInterceptors(FileInterceptor('logo', LOGO_CLUB.opciones))
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: FavlClubDto,
    @Res() response: Response,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    try {
      await this.clubs.actualizar(id, body, logo ? LOGO_CLUB.urlDe(logo.filename) : undefined);
      return response.redirect(BASE_PATH);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;
      return response.status(error.getStatus()).render(FORM_VIEW, {
        titulo: 'Editar club FAVL',
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
    await this.clubs.cambiarEstado(id, false);
    return response.redirect(BASE_PATH);
  }

  @Post(':id/activar')
  async activar(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    await this.clubs.cambiarEstado(id, true);
    return response.redirect(BASE_PATH);
  }
}
