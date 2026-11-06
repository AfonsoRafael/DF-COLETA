import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PROBLEMAS_MOCK } from '../mock/dados-mock';
import { SupabaseService } from '../supabase/supabase.service';

/** Valores aceitos pelo check constraint da tabela `problemas`. */
const SEVERIDADES_VALIDAS = ['BAIXA', 'MEDIA', 'ALTA'];
const STATUS_VALIDOS = ['PENDENTE', 'EM_ANALISE', 'RESOLVIDO'];

@Injectable()
export class ProblemasService {
  private problemas: any[] = PROBLEMAS_MOCK.map((p) => ({ ...p }));
  private proximoId =
    Math.max(0, ...PROBLEMAS_MOCK.map((p) => Number(p.id) || 0)) + 1;

  constructor(private readonly supabase: SupabaseService) {}

  async buscarTodos() {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('problemas')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return (data || []).map((p) => ({ ...p, id: Number(p.id) }));
    }

    return [...this.problemas].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
    );
  }

  async criar(dto: any) {
    const severidade = String(dto.severidade || 'MEDIA').toUpperCase();

    const registro = {
      ponto_coleta_id: Number(dto.ponto_coleta_id ?? dto.pontoColetaId) || null,
      nome_autor: dto.nome_autor ?? dto.nomeAutor ?? null,
      email_autor: dto.email_autor ?? dto.emailAutor ?? null,
      tipo_problema: dto.tipo_problema ?? dto.tipoProblema ?? null,
      severidade: SEVERIDADES_VALIDAS.includes(severidade) ? severidade : 'MEDIA',
      texto_problema: dto.texto_problema ?? dto.textoProblema ?? '',
      // Todo relato nasce pendente; a moderação é feita pelo painel.
      status: 'PENDENTE',
    };

    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('problemas')
        .insert(registro)
        .select('*')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return { ...data, id: Number(data.id) };
    }

    const novo = {
      ...registro,
      id: this.proximoId++,
      data: new Date().toISOString(),
    };
    this.problemas.push(novo);
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
        .from('problemas')
        .update({ status: novoStatus })
        .eq('id', id)
        .select('*');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Problema #${id} não encontrado`);
      }
      return { ...data[0], id: Number(data[0].id) };
    }

    const problema = this.problemas.find((p) => Number(p.id) === id);
    if (!problema) throw new NotFoundException(`Problema #${id} não encontrado`);
    problema.status = novoStatus;
    return problema;
  }

  async remover(id: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('problemas')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Problema #${id} não encontrado`);
      }
      return { mensagem: `Problema #${id} removido` };
    }

    const idx = this.problemas.findIndex((p) => Number(p.id) === id);
    if (idx !== -1) this.problemas.splice(idx, 1);
    return { mensagem: `Problema #${id} removido` };
  }
}
