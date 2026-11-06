import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RESIDUOS_MOCK } from '../mock/dados-mock';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ResiduosService {
  private residuos: any[] = RESIDUOS_MOCK.map((r) => ({ ...r }));
  private proximoId =
    Math.max(0, ...RESIDUOS_MOCK.map((r) => Number(r.id) || 0)) + 1;

  constructor(private readonly supabase: SupabaseService) {}

  async buscarTodos() {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('residuos')
        .select('id, nome, icone, descricao')
        .order('nome');

      if (error) throw new InternalServerErrorException(error.message);
      return (data || []).map((r) => ({ ...r, id: Number(r.id) }));
    }

    return [...this.residuos].sort((a, b) =>
      String(a.nome).localeCompare(String(b.nome)),
    );
  }

  async criar(dto: any) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('residuos')
        .insert({
          nome: dto.nome,
          icone: dto.icone || null,
          descricao: dto.descricao || null,
        })
        .select('id, nome, icone, descricao')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { ...data, id: Number(data.id) };
    }

    const novo = { ...dto, id: this.proximoId++ };
    this.residuos.push(novo);
    return novo;
  }

  async atualizar(id: number, dto: any) {
    if (this.supabase.disponivel) {
      const campos: Record<string, any> = {};
      for (const chave of ['nome', 'icone', 'descricao']) {
        if (dto[chave] !== undefined) campos[chave] = dto[chave];
      }

      const { data, error } = await this.supabase.db
        .from('residuos')
        .update(campos)
        .eq('id', id)
        .select('id, nome, icone, descricao');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Resíduo #${id} não encontrado`);
      }
      return { ...data[0], id: Number(data[0].id) };
    }

    const idx = this.residuos.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException(`Resíduo #${id} não encontrado`);
    this.residuos[idx] = { ...this.residuos[idx], ...dto };
    return this.residuos[idx];
  }

  async remover(id: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('residuos')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Resíduo #${id} não encontrado`);
      }
      return { mensagem: `Resíduo #${id} removido` };
    }

    const idx = this.residuos.findIndex((r) => r.id === id);
    if (idx === -1) throw new NotFoundException(`Resíduo #${id} não encontrado`);
    this.residuos.splice(idx, 1);
    return { mensagem: `Resíduo #${id} removido` };
  }
}
