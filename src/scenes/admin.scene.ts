import { Context } from 'libs/interfaces/context.interface';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';

@Scene('admin')
export class AdminScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в панель администратора PWNews! 🛠\nЗдесь вы можете управлять новостями и рассылками.',
    );
  }
}
