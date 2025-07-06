import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotUpdate } from './bot.update';
import { telegrafOptions } from './constants/telegraf.config';
import { NewsModule } from './modules/news/news.module';
import { CommonModule } from './modules/common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TelegrafModule.forRootAsync(telegrafOptions()),
    NewsModule,
    CommonModule,
  ],
  providers: [BotUpdate],
})
export class BotModule {}
