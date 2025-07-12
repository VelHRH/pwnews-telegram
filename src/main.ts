import { NestFactory } from '@nestjs/core';
import { BotModule } from './bot.module';

async function bootstrap() {
  const app = await NestFactory.create(BotModule);
  await app.listen(process.env.PORT || 3000);

  // Устанавливаем webhook, если задан WEBHOOK_DOMAIN
  const webhookDomain = process.env.WEBHOOK_DOMAIN;
  if (webhookDomain) {
    const telegrafModule = app.get<any>('TelegrafModule');
    if (telegrafModule && telegrafModule.botInfo) {
      const bot = telegrafModule.botInfo;
      try {
        await bot.telegram.setWebhook(`${webhookDomain}/telegram`);
        console.log(`Webhook set to ${webhookDomain}/telegram`);
      } catch (err) {
        console.error('Error setting webhook:', err);
      }
    }
  }
}
bootstrap();
