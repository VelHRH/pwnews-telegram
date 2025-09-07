import { Update, Ctx, Hears, On } from 'nestjs-telegraf';
import { Context } from '$/libs/interfaces/context.interface';
import { NewsService } from './news.service';
import { CheckAdmin } from '../../decorators/check-admin.decorator';

@Update()
export class NewsUpdate {
  constructor(private readonly newsService: NewsService) {}

  @Hears('📝 Опубликовать обзор')
  @CheckAdmin()
  async onPublishReview(@Ctx() ctx: Context) {
    await this.newsService.publishReview(ctx);
  }

  @Hears('✅ Опубликовать обзор')
  @CheckAdmin()
  async onPublishReviewConfirm(@Ctx() ctx: Context) {
    await this.newsService.handleReviewResponse(ctx, '✅ Опубликовать обзор');
  }

  @Hears('📝 Изменить текст обзора')
  @CheckAdmin()
  async onModifyReviewText(@Ctx() ctx: Context) {
    await this.newsService.handleReviewResponse(
      ctx,
      '📝 Изменить текст обзора',
    );
  }

  @Hears('❌ Отменить публикацию обзора')
  @CheckAdmin()
  async onCancelReview(@Ctx() ctx: Context) {
    await this.newsService.handleReviewResponse(
      ctx,
      '❌ Отменить публикацию обзора',
    );
  }

  @Hears('🎉 Опубликовать результаты PPV/спецшоу')
  @CheckAdmin()
  async onPublishPPVResults(@Ctx() ctx: Context) {
    await this.newsService.publishPPVResults(ctx);
  }

  @Hears('Опубликовать результаты еженедельника')
  @CheckAdmin()
  async onPublishResults(@Ctx() ctx: Context) {
    await this.newsService.publishWeeklyResults(ctx);
  }

  @Hears('✅ Да')
  @CheckAdmin()
  async onConfirmYes(@Ctx() ctx: Context) {
    await this.newsService.handleWeeklyConfirmation(ctx, true);
  }

  @Hears('❌ Нет')
  @CheckAdmin()
  async onConfirmNo(@Ctx() ctx: Context) {
    await this.newsService.handleWeeklyConfirmation(ctx, false);
  }

  @Hears('Сейчас')
  @CheckAdmin()
  async onPPVNow(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'Сейчас');
  }

  @Hears('В 7:30')
  @CheckAdmin()
  async onPPV730(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 7:30');
  }

  @Hears('В 8:30')
  @CheckAdmin()
  async onPPV830(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 8:30');
  }

  @Hears('В 9:00')
  @CheckAdmin()
  async onPPV900(@Ctx() ctx: Context) {
    await this.newsService.handlePPVTimeSelection(ctx, 'В 9:00');
  }

  @On('text')
  @CheckAdmin()
  async onTextMessage(@Ctx() ctx: Context) {
    const text = (ctx.message as any)?.text;

    if (!text) return;

    // Check if the message contains a pwnews.net URL
    const urlMatch = text.match(/(https?:\/\/(?:www\.)?pwnews\.net[^\s]+)/);

    if (urlMatch) {
      const url = urlMatch[1];
      await ctx.reply(`Обрабатываю ссылку: ${url}`);
      await this.newsService.publishPPVResults(ctx, url);
    } else {
      // Handle potential review text modification
      await this.newsService.handleReviewResponse(ctx, text);
    }
  }
}
