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
import { ComentariosService } from './comentarios.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('comentarios')
export class ComentariosController {
  constructor(private readonly comentariosService: ComentariosService) {}

  /** Lista completa — usada apenas pelo painel admin. */
  @Get()
  @UseGuards(AuthGuard)
  buscarTodos() {
    return this.comentariosService.buscarTodos();
  }

  /** Comentários de um ponto — público. */
  @Get('ponto/:pontoId')
  buscarPorPonto(@Param('pontoId', ParseIntPipe) pontoId: number) {
    return this.comentariosService.buscarPorPonto(pontoId);
  }

  /** Envio de comentário — público. */
  @Post()
  criar(@Body() dto: any) {
    return this.comentariosService.criar(dto);
  }

  /** Curtir/descurtir um comentário — público. */
  @Patch(':id/curtir')
  curtir(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.comentariosService.curtir(id, dto);
  }

  /** Resposta oficial da equipe — apenas administradores autenticados. */
  @Post(':id/responder')
  @UseGuards(AuthGuard)
  responderOficial(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.comentariosService.responderOficial(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.comentariosService.remover(id);
  }
}
