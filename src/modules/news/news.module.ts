import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsUpdate } from './news.update';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [NewsService, NewsUpdate],
  exports: [NewsService],
})
export class NewsModule {}
