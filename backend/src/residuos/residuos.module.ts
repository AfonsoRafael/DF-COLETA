import { Module } from '@nestjs/common';
import { ResiduosController } from './residuos.controller';
import { ResiduosService } from './residuos.service';

@Module({
  controllers: [ResiduosController],
  providers: [ResiduosService],
})
export class ResiduosModule {}
