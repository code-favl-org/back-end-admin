import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/authorization';
import { Role } from '../../common/types/role';
import { FavlCndService } from './favl-cnd.service';

/** MOCKUP: todavía no hay datos reales; la vista solo muestra el estado de la API externa. */
@ApiTags('FAVL - CND')
@Roles(Role.piloto)
@Controller('admin/favl-pilots/cnd')
export class FavlCndController {
  constructor(private readonly cnd: FavlCndService) {}

  @Get()
  async miCnd(@Res() response: Response) {
    return response.render('favl-cnd/views/mi-cnd', {
      titulo: 'Mi CND',
      api: await this.cnd.consultarApiExterna(),
    });
  }
}
