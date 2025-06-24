import { Scene, SceneEnter, Ctx, On } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { Context } from '$/libs/interfaces/context.interface';
import { Markup } from 'telegraf';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { ConfigKeys } from '$/constants/app.constants';
import { WeeklyShow } from '$/modules/news/news.config';

@Injectable()
@Scene('create-post')
export class CreatePostScene {
  constructor(private readonly configService: ConfigService) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    ctx.scene.session.step = 'url';
    await ctx.reply(
      'Отправьте ссылку на новость:',
      Markup.keyboard([['❌ Отменить']])
        .resize()
        .oneTime(),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context & { message: Message.TextMessage }) {
    const text = ctx.message.text;

    if (text === '❌ Отменить') {
      await ctx.reply(
        'Создание поста отменено',
        Markup.keyboard([['📝 Создать пост']]).resize(),
      );
      return await ctx.scene.leave();
    }

    if (!text.startsWith('https://') || !text.includes('pwnews.net')) {
      await ctx.reply('Пожалуйста, отправьте корректную ссылку c pwnews.net');
      return;
    }

    const channelId = this.configService.get(ConfigKeys.CHANNEL_USERNAME);
    if (!channelId) {
      await ctx.reply('Ошибка: ID канала не настроен');
      return await ctx.scene.leave();
    }

    const response = await fetch('https://pwnews.net/news/1-0-23');
    const html = await response.text();
    const linkMatch = html.match(/href="([^"]+)">Обзор /);
    const link = linkMatch ? `pwnews.net${linkMatch[1]}` : text;

    const textMessageMatch = html.match(
      /<div class="textmessage">(.*?)<\/div>/s,
    );
    const newsTitle = html.match(/<title>(.*?)<\/title>/);
    const imageMatch = html.match(/<img[^>]+src="([^">]+)"/);

    const textMessage = textMessageMatch
      ? textMessageMatch[1]
          .replace(/<p.*?>/g, '')
          .split('<')[0]
          .trim()
      : '';

    const title =
      'Читать обзор ' +
      Object.values(WeeklyShow).find((show) =>
        newsTitle[1].toUpperCase().includes(show),
      );

    const inlineKeyboard = {
      inline_keyboard: [[{ text: title.trim().toUpperCase(), url: text }]],
    };

    if (imageMatch && imageMatch[1]) {
      const imageUrl = imageMatch[1].startsWith('http')
        ? imageMatch[1]
        : `https://pwnews.net${imageMatch[1]}`;

      await ctx.telegram.sendPhoto(channelId, imageUrl, {
        caption: `${textMessage} \n\n${text}`,
        reply_markup: inlineKeyboard,
      });
    } else {
      await ctx.telegram.sendMessage(channelId, `${textMessage} \n\n${text}`, {
        reply_markup: inlineKeyboard,
      });
    }

    await ctx.reply(
      'Пост успешно опубликован! 🎉',
      Markup.keyboard([['📝 Создать пост']]).resize(),
    );

    await ctx.scene.leave();
  }
}
