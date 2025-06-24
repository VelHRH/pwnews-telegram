import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions } from 'nestjs-telegraf';
import { ConfigKeys } from './app.constants';
import { session } from 'telegraf';

export const telegrafOptions = (): TelegrafModuleAsyncOptions => ({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const token = configService.get<string>(ConfigKeys.TELEGRAM_BOT_TOKEN);
    if (!token) {
      throw new Error('BOT_TOKEN is not defined in environment variables');
    }
    return {
      token,
      middlewares: [session()],
    };
  },
  imports: [ConfigModule],
});
