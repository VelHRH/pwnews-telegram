import { Start, Update, Ctx } from 'nestjs-telegraf';
import { Context } from './libs/interfaces/context.interface';
import { KeyboardService } from './modules/common/services/keyboard.service';

@Update()
export class BotUpdate {
  constructor(private readonly keyboardService: KeyboardService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать! 👋',
      this.keyboardService.getMainKeyboard(),
    );
  }
}
