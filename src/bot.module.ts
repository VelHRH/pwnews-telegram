import { Module, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotUpdate } from './bot.update';
import { telegrafOptions } from './constants/telegraf.config';
import { NewsModule } from './modules/news/news.module';
import { CommonModule } from './modules/common/common.module';
import { BotProviderModule } from './bot/bot.module';
import { Telegraf } from 'telegraf';
import { BOT_NAME } from './bot.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync(telegrafOptions()),
    NewsModule,
    CommonModule,
    BotProviderModule,
  ],
  providers: [BotUpdate],
})
export class BotModule implements OnApplicationBootstrap {
  constructor(@Inject(BOT_NAME) private readonly bot: Telegraf) {}

  async onApplicationBootstrap() {
    // Настраиваем автоматический реконнект при ошибках
    this.bot.catch((err: any, ctx) => {
      console.error(`Ошибка для ${ctx.updateType}`, err);

      // Пробуем переподключиться при критических ошибках
      if (err.code === 'EFATAL' || err.code === 'ETIMEDOUT') {
        console.log('Пробуем переподключиться...');
        this.bot.launch();
      }
    });
  }
}
