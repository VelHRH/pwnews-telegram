import { Update, Ctx, Hears, On } from 'nestjs-telegraf';
import { Context } from '$/libs/interfaces/context.interface';
import { NewsService } from './news.service';
import { KeyboardService } from '../common/services/keyboard.service';

@Update()
export class NewsUpdate {
  constructor(
    private readonly newsService: NewsService,
    private readonly keyboardService: KeyboardService,
  ) {}

  @Hears('📝 Опубликовать обзор')
  async onPublishReview(@Ctx() ctx: Context) {
    await this.newsService.publishReview(ctx);
    await ctx.reply(
      'Пост успешно опубликован! 🎉',
      this.keyboardService.getMainKeyboard(),
    );
  }

  @Hears('🎉 Опубликовать результаты PPV/спецшоу')
  async onPublishPPVResults(@Ctx() ctx: Context) {
    await this.newsService.publishPPVResults(ctx);
  }

  @Hears('Опубликовать результаты еженедельника')
  async onPublishResults(@Ctx() ctx: Context) {
    await this.newsService.publishWeeklyResults(ctx);
  }

  @Hears('✅ Да')
  async onConfirmYes(@Ctx() ctx: Context) {
    await this.newsService.handleWeeklyConfirmation(ctx, true);
  }

  @Hears('❌ Нет')
  async onConfirmNo(@Ctx() ctx: Context) {
    await this.newsService.handleWeeklyConfirmation(ctx, false);
  }

  @Hears('Сейчас')
  async onPPVNow(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'Сейчас');
  }

  @Hears('В 7:30')
  async onPPV730(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 7:30');
  }

  @Hears('В 8:30')
  async onPPV830(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 8:30');
  }

  @Hears('В 9:00')
  async onPPV900(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 9:00');
  }

  @On('text')
  async onTextMessage(@Ctx() ctx: Context) {
    const text = (ctx.message as any)?.text;

    if (!text) return;

    // Check if the message contains a pwnews.net URL
    const urlMatch = text.match(/(https?:\/\/(?:www\.)?pwnews\.net[^\s]+)/);

    if (urlMatch) {
      const url = urlMatch[1];
      await ctx.reply(`Обрабатываю ссылку: ${url}`);
      await this.newsService.publishPPVResults(ctx, url);
    }
  }
}
