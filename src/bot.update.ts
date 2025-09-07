import { Start, Update, Ctx } from 'nestjs-telegraf';
import { Context } from './libs/interfaces/context.interface';
import { KeyboardService } from './modules/common/services/keyboard.service';
import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from './constants/app.constants';

@Update()
export class BotUpdate {
  constructor(
    private readonly keyboardService: KeyboardService,
    private readonly configService: ConfigService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const adminsList = this.configService
      .get<string>(ConfigKeys.ADMINS_LIST)
      ?.split(',')
      .map((username) => username.trim().replace('@', ''));

    if (!ctx.from?.username || !adminsList?.includes(ctx.from.username)) {
      await ctx.reply('Извините, у вас нет доступа к этому боту.');
      return;
    }

    await ctx.reply(
      'Добро пожаловать! 👋',
      this.keyboardService.getMainKeyboard(),
    );
  }
}
