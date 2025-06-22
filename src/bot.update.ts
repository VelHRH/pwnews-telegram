import { Context } from 'libs/interfaces/context.interface';
import { Ctx, Start, Update } from 'nestjs-telegraf';

@Update()
export class BotUpdate {
  @Start()
  async startBot(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    console.log('User ID:', userId);

    if ([123].includes(userId)) {
      await ctx.reply('Добро пожаловать в панель администратора!');
      await ctx.scene.enter('admin');
    } else {
      await ctx.reply('Привет! Добро пожаловать в бота.');
      await ctx.scene.enter('home');
    }
  }
}
