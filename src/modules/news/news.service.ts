import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '$/constants/app.constants';
import { WeeklyShow } from '$/modules/news/news.config';
import { Context } from '$/libs/interfaces/context.interface';

@Injectable()
export class NewsService {
  constructor(private readonly configService: ConfigService) {}

  async publishReview(ctx: Context): Promise<void> {
    const channelId = this.configService.get(ConfigKeys.CHANNEL_USERNAME);
    if (!channelId) {
      await ctx.reply('Ошибка: ID канала не настроен');
      return;
    }

    const responseAllReviews = await fetch('https://pwnews.net/news/1-0-23');
    const htmlAllReviews = await responseAllReviews.text();
    const linkMatch = htmlAllReviews.match(/href="([^"]+)">Обзор /);
    const url = linkMatch ? `https://pwnews.net${linkMatch[1]}` : '';

    if (!url) {
      await ctx.reply('Не удалось получить ссылку на обзор');
      return;
    }

    const response = await fetch(url);
    const html = await response.text();

    const title = html.match(/<title>(.*?)<\/title>/);
    const textMessageMatch = html.match(
      /<div class="textmessage">(.*?)<\/div>/s,
    );
    const imageMatch = html.match(/<img[^>]+src="([^">]+)"/);

    const textMessage = textMessageMatch
      ? textMessageMatch[1]
          .replace(/<p.*?>/g, '')
          .split('<')[0]
          .trim()
      : '';

    const postButtonTitle =
      'Читать обзор ' +
      Object.values(WeeklyShow).find((show) =>
        title[1].toUpperCase().includes(show),
      );

    const inlineKeyboard = {
      inline_keyboard: [[{ text: postButtonTitle.trim().toUpperCase(), url }]],
    };

    if (imageMatch && imageMatch[1]) {
      const imageUrl = imageMatch[1].startsWith('http')
        ? imageMatch[1]
        : `https://pwnews.net${imageMatch[1]}`;

      await ctx.telegram.sendPhoto(channelId, imageUrl, {
        caption: `${textMessage} \n\n${url}`,
        reply_markup: inlineKeyboard,
      });
    } else {
      await ctx.telegram.sendMessage(channelId, `${textMessage} \n\n${url}`, {
        reply_markup: inlineKeyboard,
      });
    }
  }

  async publishResults(ctx: Context): Promise<void> {
    const channelId = this.configService.get(ConfigKeys.CHANNEL_USERNAME);
    if (!channelId) {
      await ctx.reply('Ошибка: ID канала не настроен');
      return;
    }

    const responseAllReviews = await fetch('https://pwnews.net/stuff/');
    const htmlAllReviews = await responseAllReviews.text();
    const linkMatch = htmlAllReviews.match(
      /href="([^"]+)">Результаты (WWE|AEW) /,
    );

    const url = linkMatch ? `https://pwnews.net${linkMatch[1]}` : '';

    if (!url) {
      await ctx.reply('Не удалось получить ссылку на обзор');
      return;
    }

    const response = await fetch(url);
    const html = await response.text();

    const title = html.match(/<title>(.*?)<\/title>/);
    const imageMatch = html.match(/<img[^>]+src="([^">]+)"/);
    const show = Object.values(WeeklyShow).find((show) =>
      title[1].toUpperCase().includes(show),
    );

    const text = `Итоги и результаты сегодняшнего эфира ${show.slice(0, 1).toUpperCase()}${show.slice(1).toLowerCase()} (+ онлайн запись шоу)`;
    const inlineKeyboard = {
      inline_keyboard: [[{ text: 'Результаты'.toUpperCase(), url }]],
    };

    if (imageMatch && imageMatch[1]) {
      const imageUrl = imageMatch[1].startsWith('http')
        ? imageMatch[1]
        : `https://pwnews.net${imageMatch[1]}`;

      await ctx.telegram.sendPhoto(channelId, imageUrl, {
        caption: `${text} \n\n• Результаты: ${url}`,
        reply_markup: inlineKeyboard,
      });
    } else {
      await ctx.telegram.sendMessage(channelId, `${text} \n\n${url}`, {
        reply_markup: inlineKeyboard,
      });
    }
  }
}
