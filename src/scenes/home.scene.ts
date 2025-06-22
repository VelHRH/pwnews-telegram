import { UrlConfig } from '$/constants/urls.config';
import { Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Scene('home')
export class HomeScene {
  @SceneEnter()
  async enterScene(@Ctx() ctx: Context) {
    const replyKeyboard = Object.values(UrlConfig).map((button) =>
      Markup.button.url(button.name, button.url),
    );
    await ctx.reply(
      'Приветствую 😎',
      Markup.inlineKeyboard(replyKeyboard, { columns: 2 }),
    );
  }
}
