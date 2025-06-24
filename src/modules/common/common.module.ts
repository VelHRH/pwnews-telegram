import { Module } from '@nestjs/common';
import { KeyboardService } from './services/keyboard.service';

@Module({
  providers: [KeyboardService],
  exports: [KeyboardService],
})
export class CommonModule {}
