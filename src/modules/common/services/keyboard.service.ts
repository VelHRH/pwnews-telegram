import { Injectable } from '@nestjs/common';
import { Markup } from 'telegraf';

@Injectable()
export class KeyboardService {
  getMainKeyboard() {
    return Markup.keyboard([
      ['📝 Опубликовать обзор'],
      ['🎉 Опубликовать результаты PPV/спецшоу'],
      ['Опубликовать результаты еженедельника'],
    ])
      .resize()
      .placeholder('Нажмите, чтобы создать пост');
  }

  getCancelKeyboard() {
    return Markup.keyboard([['❌ Отменить']])
      .resize()
      .oneTime();
  }
}
