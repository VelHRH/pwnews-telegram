import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { NewsService } from './news.service';
import { Context } from '$/libs/interfaces/context.interface';
import { BOT_NAME } from '$/bot.provider';

@Injectable()
export class NewsTasks {
  private readonly logger = new Logger(NewsTasks.name);

  constructor(
    private readonly newsService: NewsService,
    private readonly configService: ConfigService,
    @Inject(BOT_NAME) private readonly bot: Telegraf,
  ) {}

  @Cron('0 30 4 * * *')
  async publishResultsDaily(): Promise<void> {
    this.logger.log('Starting daily results publication at 7:30 Moscow time');

    // Создаем реальный контекст для автоматического выполнения
    const realContext = {
      reply: (message: string) => {
        this.logger.warn(`Auto-publish warning: ${message}`);
      },
      telegram: this.bot.telegram,
    } as Context;

    try {
      await this.newsService.publishWeeklyResults(realContext);
      this.logger.log('Daily results publication completed successfully');
    } catch (error) {
      this.logger.error('Error in daily results publication:', error);

      // При ошибке пробуем переподключить бота
      try {
        await this.bot.telegram.getMe();
      } catch (e) {
        this.logger.error('Failed to reconnect bot:', e);
      }
    }
  }
}
