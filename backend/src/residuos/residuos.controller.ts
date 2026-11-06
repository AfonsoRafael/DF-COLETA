import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ResiduosService } from './residuos.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('residuos')
export class ResiduosController {
  constructor(private readonly residuosService: ResiduosService) {}

  @Get()
  buscarTodos() {
    return this.residuosService.buscarTodos();
  }

  @Post()
  @UseGuards(AuthGuard)
  criar(@Body() dto: any) {
    return this.residuosService.criar(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.residuosService.atualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.residuosService.remover(id);
  }
}
