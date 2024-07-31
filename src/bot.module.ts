import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotUpdate } from 'bot.update';
import { telegrafOptions } from 'config/telegram.config';
import { TelegrafModule } from 'nestjs-telegraf';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TelegrafModule.forRootAsync(telegrafOptions()),
  ],
  providers: [BotUpdate],
})
export class BotModule {}
