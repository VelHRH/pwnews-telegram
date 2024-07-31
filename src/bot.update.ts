import { Context } from 'libs/interfaces/context.interface';
import { Ctx, Start, Update } from 'nestjs-telegraf';

@Update()
export class BotUpdate {
  @Start()
  async startBot(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    if ([123].includes(userId)) {
      await ctx.scene.enter('admin'); // TODO: implement scene in ctx
    } else {
      await ctx.scene.enter('home');
    }
  }
}
