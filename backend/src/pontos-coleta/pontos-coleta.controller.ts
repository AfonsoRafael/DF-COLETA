import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PontosColetaService } from './pontos-coleta.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * Controller de Pontos de Coleta.
 * Rotas públicas: GET /pontos-coleta e GET /pontos-coleta/:id
 * Rotas admin: POST, PUT, PATCH e DELETE (protegidas pelo AuthGuard).
 */
@Controller('pontos-coleta')
export class PontosColetaController {
  constructor(private readonly pontosColetaService: PontosColetaService) {}

  /**
   * GET /pontos-coleta
   * Filtros: ?residuo=1&cidade=Brasília&busca=ecoponto&tipo=FARMACIA
   */
  @Get()
  buscarTodos(
    @Query('residuo') residuo?: string,
    @Query('cidade') cidade?: string,
    @Query('busca') busca?: string,
    @Query('tipo') tipo?: string,
    @Query('estabelecimento') estabelecimento?: string,
    @Query('todos') todos?: string,
  ) {
    return this.pontosColetaService.buscarTodos({
      residuo,
      cidade,
      busca,
      tipo,
      estabelecimento,
      todos,
    });
  }

  /**
   * GET /pontos-coleta/:id
   */
  @Get(':id')
  buscarPorId(@Param('id', ParseIntPipe) id: number) {
    return this.pontosColetaService.buscarPorId(id);
  }

  /**
   * POST /pontos-coleta (admin)
   */
  @Post()
  @UseGuards(AuthGuard)
  criar(@Body() dto: any) {
    return this.pontosColetaService.criar(dto);
  }

  /**
   * PUT /pontos-coleta/:id (admin)
   */
  @Put(':id')
  @UseGuards(AuthGuard)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.pontosColetaService.atualizar(id, dto);
  }

  /**
   * PATCH /pontos-coleta/:id/status (admin)
   * Body: { status: "ATIVO" | "INATIVO" }
   */
  @Patch(':id/status')
  @UseGuards(AuthGuard)
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: 'ATIVO' | 'INATIVO',
  ) {
    return this.pontosColetaService.alterarStatus(id, status);
  }

  /**
   * DELETE /pontos-coleta/:id (admin)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.pontosColetaService.remover(id);
  }
}
