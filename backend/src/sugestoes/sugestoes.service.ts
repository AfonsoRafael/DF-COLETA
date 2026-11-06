import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SUGESTOES_MOCK } from '../mock/dados-mock';
import { SupabaseService } from '../supabase/supabase.service';

/** Valores aceitos pelo check constraint da tabela `sugestoes`. */
const STATUS_VALIDOS = ['PENDENTE', 'APROVADO', 'REJEITADO'];

@Injectable()
export class SugestoesService {
  private sugestoes: any[] = SUGESTOES_MOCK.map((s) => ({
    ...s,
    status: 'PENDENTE',
  }));
  private proximoId =
    Math.max(0, ...SUGESTOES_MOCK.map((s) => Number(s.id) || 0)) + 1;

  constructor(private readonly supabase: SupabaseService) {}

  async buscarTodos() {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('sugestoes')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return (data || []).map((s) => ({
        ...s,
        id: Number(s.id),
        status: s.status || 'PENDENTE',
      }));
    }

    return [...this.sugestoes].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }

  async criar(dto: any) {
    const registro = {
      nome_local: dto.nome_local ?? dto.nomeLocal ?? null,
      endereco: dto.endereco ?? null,
      cidade: dto.cidade ?? null,
      nome_autor: dto.nome_autor ?? dto.nomeAutor ?? null,
      email_autor: dto.email_autor ?? dto.emailAutor ?? null,
      texto_sugestao: dto.texto_sugestao ?? dto.textoSugestao ?? null,
      residuos_sugeridos:
        dto.residuos_sugeridos ??
        dto.residuosSugeridos ??
        (Array.isArray(dto.residuos) ? dto.residuos.join(', ') : null),
    };

    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('sugestoes')
        .insert(registro)
        .select('*')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { ...data, id: Number(data.id) };
    }

    const novo = {
      ...registro,
      id: this.proximoId++,
      status: 'PENDENTE',
      data: new Date().toISOString(),
    };
    this.sugestoes.push(novo);
    return novo;
  }

  async alterarStatus(id: number, status: string) {
    const novoStatus = String(status || '').toUpperCase();

    if (!STATUS_VALIDOS.includes(novoStatus)) {
      throw new BadRequestException(
        `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}.`,
      );
    }

    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('sugestoes')
        .update({ status: novoStatus })
        .eq('id', id)
        .select('*');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Sugestão #${id} não encontrada`);
      }
      return { ...data[0], id: Number(data[0].id) };
    }

    const sugestao = this.sugestoes.find((s) => Number(s.id) === id);
    if (!sugestao) throw new NotFoundException(`Sugestão #${id} não encontrada`);
    sugestao.status = novoStatus;
    return sugestao;
  }

  async remover(id: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('sugestoes')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Sugestão #${id} não encontrada`);
      }
      return { mensagem: `Sugestão #${id} removida` };
    }

    const idx = this.sugestoes.findIndex((s) => Number(s.id) === id);
    if (idx !== -1) this.sugestoes.splice(idx, 1);
    return { mensagem: `Sugestão #${id} removida` };
  }
}
