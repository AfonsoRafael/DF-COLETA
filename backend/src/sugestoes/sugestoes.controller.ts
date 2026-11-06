import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { SugestoesService } from './sugestoes.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('sugestoes')
export class SugestoesController {
  constructor(private readonly sugestoesService: SugestoesService) {}

  /** Lista completa — usada apenas pelo painel admin. */
  @Get()
  @UseGuards(AuthGuard)
  buscarTodos() {
    return this.sugestoesService.buscarTodos();
  }

  /** Envio de sugestão — público. */
  @Post()
  criar(@Body() dto: any) {
    return this.sugestoesService.criar(dto);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.sugestoesService.alterarStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.sugestoesService.remover(id);
  }
}
