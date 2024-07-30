import { Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  constructor() {}

  @Start()
  startBot(ctx: Context) {
    console.log(ctx);
    ctx.reply("Hi, I'm VEL's bot 😉");
  }
}
