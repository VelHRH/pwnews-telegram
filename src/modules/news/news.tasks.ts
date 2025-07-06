import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { NewsService } from './news.service';
import { ConfigKeys } from '$/constants/app.constants';
import { Context } from '$/libs/interfaces/context.interface';

@Injectable()
export class NewsTasks {
  private readonly logger = new Logger(NewsTasks.name);
  private readonly bot: Telegraf;

  constructor(
    private readonly newsService: NewsService,
    private readonly configService: ConfigService,
  ) {
    const botToken = this.configService.get(ConfigKeys.TELEGRAM_BOT_TOKEN);
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }
    this.bot = new Telegraf(botToken);
  }

  @Cron('0 30 7 * * *')
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
    }
  }
}
