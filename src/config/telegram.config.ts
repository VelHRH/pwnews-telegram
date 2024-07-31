import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions } from 'nestjs-telegraf';

export const telegrafOptions = (): TelegrafModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    token: configService.get('TELEGRAM_BOT_TOKEN'),
  }),
  imports: [ConfigModule],
});
