import { Global, Inject, Module } from '@nestjs/common';
import { loadConfig } from './configuration';

export const APP_CONFIG = Symbol('APP_CONFIG');

/** Atajo: `constructor(@InjectConfig() private readonly config: AppConfig)` */
export const InjectConfig = () => Inject(APP_CONFIG);

@Global()
@Module({
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
