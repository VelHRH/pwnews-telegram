import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '$/constants/app.constants';
import { WeeklyShow } from '$/modules/news/news.config';
import { Context } from '$/libs/interfaces/context.interface';
import { Markup } from 'telegraf';
import { KeyboardService } from '../common/services/keyboard.service';

interface PendingPublication {
  text: string;
  url: string;
  videoUrl: string;
  videoImageUrl: string;
  inlineKeyboard: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url: string;
      }>
    >;
  };
}

@Injectable()
export class NewsService {
  private readonly channelId: string;
  private readonly pendingPublications = new Map<number, PendingPublication>();

  constructor(
    private readonly configService: ConfigService,
    private readonly keyboardService: KeyboardService,
  ) {
    this.channelId = this.configService.get(ConfigKeys.CHANNEL_USERNAME);
  }

  async publishReview(ctx: Context): Promise<void> {
    if (!this.channelId) {
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

      await ctx.telegram.sendPhoto(this.channelId, imageUrl, {
        caption: `${textMessage} \n\n${url}`,
        reply_markup: inlineKeyboard,
      });
    } else {
      await ctx.telegram.sendMessage(
        this.channelId,
        `${textMessage} \n\n${url}`,
        {
          reply_markup: inlineKeyboard,
        },
      );
    }
  }

  async publishPPVResults(ctx: Context): Promise<void> {
    if (!this.channelId) {
      await ctx.reply('Ошибка: ID канала не настроен');
      return;
    }

    const response = await fetch('https://pwnews.net/news/1-0-21');
    const html = await response.text();

    const divMatch = html.match(
      /<div[^>]*class="[^"]*vidnovosnew-title[^"]*"[^>]*>(.*?)<\/div>/s,
    );

    if (!divMatch) {
      await ctx.reply('Не удалось найти div с классом "vidnovosnew-title"');
      return;
    }

    const aTagMatch = divMatch[1].match(/<a[^>]*>(.*?)<\/a>/s);

    if (!aTagMatch) {
      await ctx.reply('Не удалось найти a тег внутри div');
      return;
    }

    let cleanedText = aTagMatch[1]
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();

    cleanedText = cleanedText.replace(/Результаты\s+(WWE|AEW)/gi, '');

    const currentYear = new Date().getFullYear();
    cleanedText = cleanedText.replace(
      new RegExp(`\\b${currentYear}\\b`, 'g'),
      '',
    );

    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    await ctx.reply(cleanedText);
  }

  async publishWeeklyResults(ctx: Context): Promise<void> {
    if (!this.channelId) {
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
    const show = Object.values(WeeklyShow).find((show) =>
      title[1].toUpperCase().includes(show),
    );

    const normalizedShow =
      show.slice(0, 1).toUpperCase() + show.slice(1).toLowerCase();

    const dateMatch = title[1].match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dateMatch) {
      await ctx.reply('Не удалось получить дату из заголовка');
      return;
    }

    const [, day, month, year] = dateMatch;
    const postDate = new Date(`${year}-${month}-${day}`);
    const oneDayAgo = new Date(new Date().setHours(0, 0, 0, 0));
    oneDayAgo.setTime(oneDayAgo.getTime() - 24 * 60 * 60 * 1000);

    const responseVideo = await fetch('https://pwnews.net/blog/');
    const htmlVideo = await responseVideo.text();
    const dateSearch = `${day}.${month}.${year}`;

    const lines = htmlVideo.split('\n');
    const targetLine = lines.find(
      (line) => line.includes(normalizedShow) && line.includes(dateSearch),
    );

    let videoUrl = '';
    let videoImageUrl = '';

    if (targetLine) {
      const hrefMatch = targetLine.match(/href="([^"]+)"/);
      const srcMatch = targetLine.match(/src="([^"]+)"/);

      videoUrl = hrefMatch ? `https://pwnews.net${hrefMatch[1]}` : '';
      videoImageUrl = srcMatch
        ? srcMatch[1].startsWith('http')
          ? srcMatch[1]
          : `https://pwnews.net${srcMatch[1]}`
        : '';
    }

    if (!videoUrl || !videoImageUrl) {
      await ctx.reply('Видео для данного эфира не найдено');
      return;
    }

    const text = `Итоги и результаты сегодняшнего эфира ${normalizedShow} (+ онлайн запись шоу)`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: 'Результаты'.toUpperCase(), url },
          { text: 'Смотреть'.toUpperCase(), url: videoUrl },
        ],
      ],
    };

    if (postDate < oneDayAgo) {
      await ctx.sendPhoto(videoImageUrl.replace(/\/s/g, '/'), {
        caption: `${text} \n\n• Результаты: ${url} \n• Смотреть: ${videoUrl}`,
        reply_markup: inlineKeyboard,
      });
      await ctx.reply(
        `Последние результаты (${title[1]}) слишком старые. Действительно ли я должен опубликовть их? Если что, я сам проверяю актуальые результаты каждый день в 7:30.`,
        Markup.keyboard([['✅ Да', '❌ Нет']]).resize(),
      );

      // Сохраняем данные для последующего использования
      if (ctx.from?.id) {
        this.pendingPublications.set(ctx.from.id, {
          text,
          url,
          videoUrl,
          videoImageUrl: videoImageUrl.replace(/\/s/g, '/'),
          inlineKeyboard,
        });
      }

      return;
    }

    await ctx.telegram.sendPhoto(
      this.channelId,
      videoImageUrl.replace(/\/s/g, '/'),
      {
        caption: `${text} \n\n• Результаты: ${url} \n• Смотреть: ${videoUrl}`,
        reply_markup: inlineKeyboard,
      },
    );

    await ctx.reply(`Результаты ${normalizedShow} успешно опубликованы!`);
  }

  async handleWeeklyConfirmation(
    ctx: Context,
    userResponse: boolean,
  ): Promise<void> {
    const userId = ctx.from?.id;

    if (userResponse && userId && this.pendingPublications.has(userId)) {
      const publication = this.pendingPublications.get(userId)!;

      await ctx.telegram.sendPhoto(this.channelId, publication.videoImageUrl, {
        caption: `${publication.text} \n\n• Результаты: ${publication.url} \n• Смотреть: ${publication.videoUrl}`,
        reply_markup: publication.inlineKeyboard,
      });

      await ctx.reply(
        'Пост успешно опубликован! 🎉',
        this.keyboardService.getMainKeyboard(),
      );

      // Очищаем сохраненные данные
      this.pendingPublications.delete(userId);
      return;
    }

    await ctx.reply(
      'Публикация отменена.',
      this.keyboardService.getMainKeyboard(),
    );
    if (userId) {
      this.pendingPublications.delete(userId);
    }
  }
}
