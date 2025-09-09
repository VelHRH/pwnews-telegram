import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '$/constants/app.constants';
import { Context } from '$/libs/interfaces/context.interface';
import { Markup } from 'telegraf';
import { KeyboardService } from '../common/services/keyboard.service';
import { WeeklyShow, WeeklyShowNames } from './constants/weekly-shows';
import { reviewersNames } from './constants/reviewers';

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

interface PendingPPVPublication {
  cleanedText: string;
  articleUrl: string;
  videoUrl: string;
  imageUrl: string;
  inlineKeyboard: {
    inline_keyboard: Array<
      Array<{
        text: string;
        url: string;
      }>
    >;
  };
}

interface PendingReview {
  text: string;
  imageUrl: string;
  url: string;
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
  private readonly pendingPPVPublications = new Map<
    number,
    PendingPPVPublication
  >();
  private readonly pendingReviews = new Map<number, PendingReview>();

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
          .split('</p>')[0]
          .replace(/<[^>]*>/g, '')
          .replace(/<p.*?>/g, '')
          .split('<')[0]
          .trim()
      : '';

    const filteredTextMessage = textMessage
      .split(/[.!?]+/)
      .filter((sentence) => {
        const cleanSentence = sentence.trim().toLowerCase();
        return !reviewersNames.some((reviewer) =>
          cleanSentence.includes(reviewer.toLowerCase()),
        );
      })
      .join('. ')
      .trim();

    const finalTextMessage = filteredTextMessage.endsWith('.')
      ? filteredTextMessage
      : filteredTextMessage + '.';

    const postButtonTitle =
      'Читать обзор ' +
      Object.values(WeeklyShow).find((show) =>
        title[1].toUpperCase().includes(show),
      );

    const inlineKeyboard = {
      inline_keyboard: [[{ text: postButtonTitle.trim().toUpperCase(), url }]],
    };

    if (!imageMatch?.[1]) {
      await ctx.reply(
        'Не удалось получить изображение для обзора',
        this.keyboardService.getMainKeyboard(),
      );
      return;
    }
    const imageUrl = imageMatch[1].startsWith('http')
      ? imageMatch[1]
      : `https://pwnews.net${imageMatch[1]}`;

    // Store the review data for later use
    if (ctx.from?.id) {
      this.pendingReviews.set(ctx.from.id, {
        text: finalTextMessage,
        imageUrl,
        url,
        inlineKeyboard,
      });
    }

    // Show preview to user
    await ctx.sendPhoto(imageUrl, {
      caption: `${finalTextMessage} \n\n${url.replace('https://', '')}`,
      reply_markup: inlineKeyboard,
    });

    // Show options to publish or modify
    await ctx.reply(
      'Проверьте пост и выберите действие:',
      Markup.keyboard([
        ['✅ Опубликовать обзор'],
        ['📝 Изменить текст обзора'],
        ['❌ Отменить публикацию обзора'],
      ]).resize(),
    );
  }

  async publishPPVResults(ctx: Context, customUrl?: string): Promise<void> {
    if (!this.channelId) {
      await ctx.reply('Ошибка: ID канала не настроен');
      return;
    }

    let ppvData: { cleanedText: string; articleUrl: string; imageUrl: string };

    if (customUrl) {
      // Extract data from custom URL
      const extractedData = await this.extractPPVDataFromUrl(customUrl);
      if (!extractedData) {
        await ctx.reply('Не удалось извлечь данные из предоставленной ссылки');
        return;
      }
      ppvData = extractedData;
    } else {
      // Use default extraction method
      const defaultData = await this.extractPPVData();
      if (!defaultData) {
        await ctx.reply('Не удалось извлечь данные о PPV');
        return;
      }
      ppvData = defaultData;
    }

    const { cleanedText, articleUrl, imageUrl } = ppvData;

    const responseVideo = await fetch('https://pwnews.net/blog/');
    const htmlVideo = await responseVideo.text();

    // Find the first img tag that contains cleanedText and get its wrapping a tag
    const imgRegex =
      /<a[^>]*href="([^"]*)"[^>]*>\s*<img[^>]*alt="([^"]*)"[^>]*>/gs;
    let videoUrl = '';
    let match;

    while ((match = imgRegex.exec(htmlVideo)) !== null) {
      const hrefUrl = match[1];
      const altText = match[2];

      // Check if the alt attribute contains our cleanedText
      if (altText.includes(cleanedText)) {
        videoUrl = hrefUrl.startsWith('http')
          ? hrefUrl
          : `https://pwnews.net${hrefUrl}`;
        break;
      }
    }

    if (!videoUrl) {
      await ctx.reply('Не удалось найти видео для данного эфира');
      return;
    }

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: 'Результаты'.toUpperCase(), url: articleUrl },
          { text: 'Смотреть'.toUpperCase(), url: videoUrl },
        ],
      ],
    };

    // Show preview of the post to the user
    await ctx.sendPhoto(imageUrl.replace(/\/s/g, '/'), {
      caption: `Результаты ${cleanedText} + запись шоу`,
      reply_markup: inlineKeyboard,
    });

    // Store the publication data for later use
    if (ctx.from?.id) {
      this.pendingPPVPublications.set(ctx.from.id, {
        cleanedText,
        articleUrl,
        videoUrl,
        imageUrl,
        inlineKeyboard,
      });
    }

    await ctx.reply(
      'Выберете время публикации или вставьте ссылку на другое шоу',
      Markup.keyboard([
        ['Сейчас', 'В 7:30'],
        ['В 8:30', 'В 9:00'],
      ]).resize(),
    );
  }

  private async extractPPVData(): Promise<{
    cleanedText: string;
    articleUrl: string;
    imageUrl: string;
  } | null> {
    try {
      const response = await fetch('https://pwnews.net/news/1-0-21');
      const html = await response.text();

      const divMatch = html.match(
        /<div[^>]*class="[^"]*vidnovosnew-title[^"]*"[^>]*>(.*?)<\/div>/s,
      );

      if (!divMatch) {
        return null;
      }

      const divIndex = html.indexOf(divMatch[0]);
      const htmlBeforeDiv = html.substring(0, divIndex);
      const srcMatches = htmlBeforeDiv.match(/src="([^"]+)"/g);

      if (!srcMatches?.length) {
        return null;
      }

      const aTagMatch = divMatch[1].match(/<a[^>]*>(.*?)<\/a>/s);

      if (!aTagMatch) {
        return null;
      }

      // Extract href from the a tag
      const hrefMatch = divMatch[1].match(/<a[^>]*href="([^"]*)"[^>]*>/);

      if (!hrefMatch) {
        return null;
      }

      const articleUrl = hrefMatch[1].startsWith('http')
        ? hrefMatch[1]
        : `https://pwnews.net${hrefMatch[1]}`;

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

      const lastSrcMatch = srcMatches[srcMatches.length - 1];
      const imageUrl = `https://pwnews.net${lastSrcMatch.match(/src="([^"]+)"/)[1]}`;

      return {
        cleanedText,
        articleUrl,
        imageUrl,
      };
    } catch (error) {
      console.error('Error extracting PPV data:', error);
      return null;
    }
  }

  private async extractPPVDataFromUrl(url: string): Promise<{
    cleanedText: string;
    articleUrl: string;
    imageUrl: string;
  } | null> {
    try {
      const response = await fetch(url);
      const html = await response.text();

      // Find the first img tag
      const imgMatch = html.match(
        /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/,
      );

      if (!imgMatch) {
        return null;
      }

      const srcUrl = imgMatch[1];
      const altText = imgMatch[2];

      const imageUrl = srcUrl.startsWith('http')
        ? srcUrl
        : `https://pwnews.net${srcUrl}`;

      let cleanedText = altText.trim();

      // Apply the same cleaning logic as extractPPVData
      cleanedText = cleanedText.replace(/Результаты\s+(WWE|AEW)/gi, '');

      const currentYear = new Date().getFullYear();
      cleanedText = cleanedText.replace(
        new RegExp(`\\b${currentYear}\\b`, 'g'),
        '',
      );

      cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

      return {
        cleanedText,
        articleUrl: url,
        imageUrl,
      };
    } catch (error) {
      console.error('Error extracting PPV data from URL:', error);
      return null;
    }
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

    const normalizedShow = WeeklyShowNames[show];

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
        caption: `${text} \n\n• Результаты: ${url.replace('https://', '')} \n• Смотреть: ${videoUrl.replace('https://', '')}`,
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
        caption: `${text} \n\n• Результаты: ${url.replace('https://', '')} \n• Смотреть: ${videoUrl.replace('https://', '')}`,
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
        caption: `${publication.text} \n\n• Результаты: ${publication.url.replace('https://', '')} \n• Смотреть: ${publication.videoUrl.replace('https://', '')}`,
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

  async handlePPVTimeSelection(
    ctx: Context,
    timeChoice: string,
  ): Promise<void> {
    const userId = ctx.from?.id;

    if (!userId || !this.pendingPPVPublications.has(userId)) {
      await ctx.reply('Нет данных для публикации');
      return;
    }

    const publication = this.pendingPPVPublications.get(userId)!;

    switch (timeChoice) {
      case 'Сейчас':
        await this.publishPPVImmediately(ctx, publication);
        break;
      case 'В 7:30':
        await this.schedulePPVPublication(ctx, publication, 7, 30);
        break;
      case 'В 8:30':
        await this.schedulePPVPublication(ctx, publication, 8, 30);
        break;
      case 'В 9:00':
        await this.schedulePPVPublication(ctx, publication, 9, 0);
        break;
      default:
        await ctx.reply('Неизвестный выбор времени');
        return;
    }

    // Clear the stored data
    this.pendingPPVPublications.delete(userId);
  }

  private async publishPPVImmediately(
    ctx: Context,
    publication: PendingPPVPublication,
  ): Promise<void> {
    await ctx.telegram.sendPhoto(
      this.channelId,
      publication.imageUrl.replace(/\/s/g, '/'),
      {
        caption: `Результаты ${publication.cleanedText} + запись шоу`,
        reply_markup: publication.inlineKeyboard,
      },
    );

    await ctx.reply(
      'PPV результаты успешно опубликованы! 🎉',
      this.keyboardService.getMainKeyboard(),
    );
  }

  async handleReviewResponse(ctx: Context, response: string): Promise<void> {
    const userId = ctx.from?.id;
    if (!userId || !this.pendingReviews.has(userId)) {
      await ctx.reply(
        'Нет данных для публикации. Пожалуйста, начните заново.',
        this.keyboardService.getMainKeyboard(),
      );
      return;
    }

    const review = this.pendingReviews.get(userId)!;

    switch (response) {
      case '✅ Опубликовать обзор':
        await ctx.telegram.sendPhoto(this.channelId, review.imageUrl, {
          caption: `${review.text} \n\n${review.url}`,
          reply_markup: review.inlineKeyboard,
        });
        await ctx.reply(
          'Обзор успешно опубликован! 🎉',
          this.keyboardService.getMainKeyboard(),
        );
        this.pendingReviews.delete(userId);
        break;

      case '📝 Изменить текст обзора':
        await ctx.reply(
          'Пожалуйста, введите новый текст для обзора:',
          this.keyboardService.getCancelKeyboard(),
        );
        break;

      case '❌ Отменить публикацию обзора':
        await ctx.reply(
          'Публикация отменена.',
          this.keyboardService.getMainKeyboard(),
        );
        this.pendingReviews.delete(userId);
        break;

      default:
        // Handle text input for review modification
        if (this.pendingReviews.has(userId)) {
          const review = this.pendingReviews.get(userId)!;
          // Update the review text
          review.text = response;
          this.pendingReviews.set(userId, review);

          // Show preview with new text
          await ctx.sendPhoto(review.imageUrl, {
            caption: `${response} \n\n${review.url}`,
            reply_markup: review.inlineKeyboard,
          });

          // Show publish/modify options again
          await ctx.reply(
            'Проверьте обновленный пост и выберите действие:',
            Markup.keyboard([
              ['✅ Опубликовать обзор'],
              ['📝 Изменить текст обзора'],
              ['❌ Отменить публикацию обзора'],
            ]).resize(),
          );
        }
        break;
    }
  }

  private async schedulePPVPublication(
    ctx: Context,
    publication: PendingPPVPublication,
    hour: number,
    minute: number,
  ): Promise<void> {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    // If the scheduled time is in the past for today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    // Store the timeout info for potential cleanup
    const timeoutId = setTimeout(async () => {
      try {
        await ctx.telegram.sendPhoto(
          this.channelId,
          publication.imageUrl.replace(/\/s/g, '/'),
          {
            caption: `Результаты ${publication.cleanedText} + запись шоу`,
            reply_markup: publication.inlineKeyboard,
          },
        );
        console.log(
          `Successfully sent scheduled PPV publication at ${scheduledTime}`,
        );
      } catch (error) {
        console.error('Error sending scheduled PPV publication:', error);
      }
    }, delay);

    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    await ctx.reply(
      `PPV результаты запланированы на ${timeStr} ${scheduledTime.toLocaleDateString()}. Публикация произойдет автоматически через ${Math.round(delay / 1000 / 60)} минут.`,
      this.keyboardService.getMainKeyboard(),
    );

    console.log(
      `PPV publication scheduled for ${scheduledTime}, timeout ID: ${timeoutId}`,
    );
  }
}
