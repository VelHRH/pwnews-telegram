import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BotUpdate } from './bot.update';
import { telegrafOptions } from './constants/telegraf.config';
import { TelegrafModule } from 'nestjs-telegraf';
import { HomeScene } from './scenes/home.scene';
import { AdminScene } from './scenes/admin.scene';
import { session } from 'telegraf';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync(telegrafOptions()),
  ],
  providers: [BotUpdate, HomeScene, AdminScene],
})
export class BotModule {}
