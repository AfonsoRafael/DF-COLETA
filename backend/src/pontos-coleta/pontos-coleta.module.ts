import { Module } from '@nestjs/common';
import { PontosColetaController } from './pontos-coleta.controller';
import { PontosColetaService } from './pontos-coleta.service';

@Module({
  controllers: [PontosColetaController],
  providers: [PontosColetaService],
})
export class PontosColetaModule {}
