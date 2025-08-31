import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsUpdate } from './news.update';
import { NewsTasks } from './news.tasks';
import { CommonModule } from '../common/common.module';
import { BotProviderModule } from '$/bot/bot.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CommonModule, BotProviderModule, ConfigModule],
  providers: [NewsService, NewsUpdate, NewsTasks],
  exports: [NewsService],
})
export class NewsModule {}
