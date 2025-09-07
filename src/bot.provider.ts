import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { ConfigKeys } from './constants/app.constants';

export const BOT_NAME = 'BOT_PROVIDER';

export const BotProvider: Provider = {
  provide: BOT_NAME,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const token = configService.get<string>(ConfigKeys.TELEGRAM_BOT_TOKEN);
    if (!token) {
      throw new Error('BOT_TOKEN is not defined in environment variables');
    }

    const bot = new Telegraf(token);

    // Добавляем обработку ошибок
    bot.catch((err, ctx) => {
      console.error(`Ошибка для ${ctx.updateType}`, err);
    });
    return bot;
  },
};
