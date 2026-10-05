import { Injectable } from '@nestjs/common';

/** TODO: reemplazar los datos de ejemplo por la base. */
@Injectable()
export class SociosService {
  /** Padrón de socios. */
  async listar() {
    return [
      { numero: '001', nombre: 'Juan Pérez', dni: '30.123.456', club: 'Club Cóndor', estado: 'Activo' },
      { numero: '002', nombre: 'María Gómez', dni: '28.456.789', club: 'Ala Delta Sur', estado: 'Activo' },
      { numero: '003', nombre: 'Carlos Rodríguez', dni: '25.987.654', club: 'Club Andino', estado: 'Inactivo' },
    ];
  }

  /** Da de alta un socio. @param dto Campos del formulario, sin validar todavía. */
  async crear(dto: Record<string, string>) {
    // TODO: validar con DTO + guardar
    console.log('Nuevo socio:', dto);
  }

  /** Estado de cuotas por socio y mes: `meses` son las columnas, `cuotas` una fila por socio. */
  async cuotas() {
    return {
      meses: ['Enero', 'Febrero', 'Marzo'],
      cuotas: [
        { socio: 'Juan Pérez', pagos: ['Pagada', 'Pagada', 'Pagada'], estado: 'Al día', color: 'success' },
        { socio: 'María Gómez', pagos: ['Pagada', 'Impaga', 'Impaga'], estado: 'Debe 2', color: 'warning' },
        { socio: 'Carlos Rodríguez', pagos: ['Pagada', 'Pagada', 'Pendiente'], estado: 'Debe 1', color: 'warning' },
      ],
    };
  }
}
