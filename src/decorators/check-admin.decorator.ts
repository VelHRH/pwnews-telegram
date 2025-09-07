import { ConfigService } from '@nestjs/config';
import { ConfigKeys } from '../constants/app.constants';
import { Context } from '../libs/interfaces/context.interface';

export function CheckAdmin() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const ctx = args.find((arg): arg is Context => 'telegram' in arg);
      if (!ctx) {
        return;
      }

      // this refers to the class instance where the decorator is used
      const configService = (this as any).configService;
      if (!configService || !(configService instanceof ConfigService)) {
        console.error('ConfigService not found in the class');
        return;
      }

      const adminsList = configService
        .get<string>(ConfigKeys.ADMINS_LIST)
        ?.split(',')
        .map((username) => username.trim().replace('@', ''));

      if (!ctx.from?.username || !adminsList?.includes(ctx.from.username)) {
        await ctx.reply('Извините, у вас нет доступа к этому боту.');
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
