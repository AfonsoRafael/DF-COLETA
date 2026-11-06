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
import { ProblemasService } from './problemas.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('problemas')
export class ProblemasController {
  constructor(private readonly problemasService: ProblemasService) {}

  /** Lista completa — usada apenas pelo painel admin. */
  @Get()
  @UseGuards(AuthGuard)
  buscarTodos() {
    return this.problemasService.buscarTodos();
  }

  /** Relato de problema — público. */
  @Post()
  criar(@Body() dto: any) {
    return this.problemasService.criar(dto);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard)
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.problemasService.alterarStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.problemasService.remover(id);
  }
}
