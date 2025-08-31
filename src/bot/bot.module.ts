import { Module } from '@nestjs/common';
import { BotProvider } from '../bot.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [BotProvider],
  exports: [BotProvider],
})
export class BotProviderModule {}
