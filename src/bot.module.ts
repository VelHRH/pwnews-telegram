import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotUpdate } from './bot.update';
import { CreatePostScene } from './scenes/create-post.scene';
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
  providers: [BotUpdate, CreatePostScene],
})
export class BotModule {}
