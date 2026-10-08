import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { APP_CONFIG, AppConfig, InjectConfig } from '../config';

/** Emite un aviso de conexión exitosa solo durante el desarrollo local. */
@Injectable()
class DatabaseConnectionLogger implements OnModuleInit {
  private readonly logger = new Logger(DatabaseConnectionLogger.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectConfig() private readonly config: AppConfig,
  ) {}

  onModuleInit(): void {
    if (this.config.env === 'development' && this.dataSource.isInitialized) {
      this.logger.log(`Conexión a MariaDB establecida (${this.config.db.database}).`);
    }
  }
}

/**
 * Conexión TypeORM a MariaDB con las variables DB_* del .env (las de back-end-public).
 * Las entidades se registran solas (`autoLoadEntities`) desde los módulos que usan
 * `TypeOrmModule.forFeature([...])`. No se ejecutan migraciones. La sincronización
 * automática se controla con `DB_SYNCHRONIZE` y solo puede activarse en desarrollo.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        type: 'mariadb' as const,
        host: config.db.host,
        port: config.db.port,
        username: config.db.username,
        password: config.db.password,
        database: config.db.database,
        autoLoadEntities: true,
        synchronize: config.db.synchronize,
        verboseRetryLog: config.env === 'development',
      }),
    }),
  ],
  providers: [DatabaseConnectionLogger],
})
export class DatabaseModule {}
