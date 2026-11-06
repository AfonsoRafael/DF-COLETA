import { Module } from '@nestjs/common';
import { ProblemasController } from './problemas.controller';
import { ProblemasService } from './problemas.service';

@Module({
  controllers: [ProblemasController],
  providers: [ProblemasService],
})
export class ProblemasModule {}
