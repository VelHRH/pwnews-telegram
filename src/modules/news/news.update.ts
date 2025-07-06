import { Update, Ctx, Hears } from 'nestjs-telegraf';
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
}
