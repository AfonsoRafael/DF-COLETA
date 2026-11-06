import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { COMENTARIOS_MOCK } from '../mock/dados-mock';
import { SupabaseService } from '../supabase/supabase.service';

/** Identidade usada nas respostas oficiais feitas pelo painel. */
const AUTOR_OFICIAL = 'Equipe DF Coleta';
const EMAIL_OFICIAL = 'contato@dfcoleta.com';

@Injectable()
export class ComentariosService {
  private comentarios: any[] = COMENTARIOS_MOCK.map((c) => ({ ...c }));
  private proximoId =
    Math.max(0, ...COMENTARIOS_MOCK.map((c) => Number(c.id) || 0)) + 1;

  constructor(private readonly supabase: SupabaseService) {}

  /** Garante tipos numéricos e campos novos mesmo em bancos antigos. */
  private normalizar(comentario: any) {
    return {
      ...comentario,
      id: Number(comentario.id),
      curtidas: Number(comentario.curtidas || 0),
      resposta_a:
        comentario.resposta_a == null ? null : Number(comentario.resposta_a),
      oficial: comentario.oficial === true,
    };
  }

  async buscarTodos() {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('comentarios')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return (data || []).map((c) => this.normalizar(c));
    }

    return [...this.comentarios]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .map((c) => this.normalizar(c));
  }

  async buscarPorPonto(pontoId: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('comentarios')
        .select('*')
        .eq('ponto_coleta_id', pontoId)
        .order('data', { ascending: false });

      if (error) throw new InternalServerErrorException(error.message);
      return (data || []).map((c) => this.normalizar(c));
    }

    return this.comentarios
      .filter((c) => Number(c.ponto_coleta_id) === pontoId)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .map((c) => this.normalizar(c));
  }

  async criar(dto: any) {
    const respostaA = dto.resposta_a ?? dto.respostaA;

    const registro = {
      ponto_coleta_id: Number(dto.ponto_coleta_id ?? dto.pontoColetaId),
      nome_autor: dto.nome_autor ?? dto.nomeAutor ?? 'Anônimo',
      email_autor: dto.email_autor ?? dto.emailAutor ?? null,
      texto_comentario: dto.texto_comentario ?? dto.textoComentario ?? '',
      curtidas: 0,
      resposta_a:
        respostaA == null || respostaA === '' ? null : Number(respostaA),
      // Comentários enviados pelo site são sempre de cidadãos.
      oficial: false,
    };

    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('comentarios')
        .insert(registro)
        .select('*')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return this.normalizar(data);
    }

    const novo = {
      ...registro,
      id: this.proximoId++,
      data: new Date().toISOString(),
    };
    this.comentarios.push(novo);
    return this.normalizar(novo);
  }

  /** Curte ou descurte um comentário (público). */
  async curtir(id: number, dto: any) {
    const curtir = dto?.curtir !== false;

    if (this.supabase.disponivel) {
      const { data: atual, error: erroBusca } = await this.supabase.db
        .from('comentarios')
        .select('id, curtidas')
        .eq('id', id)
        .maybeSingle();

      if (erroBusca) throw new InternalServerErrorException(erroBusca.message);
      if (!atual) throw new NotFoundException(`Comentário #${id} não encontrado`);

      const curtidas = Math.max(
        0,
        Number(atual.curtidas || 0) + (curtir ? 1 : -1),
      );

      const { data, error } = await this.supabase.db
        .from('comentarios')
        .update({ curtidas })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return this.normalizar(data);
    }

    const alvo = this.comentarios.find((c) => Number(c.id) === id);
    if (!alvo) throw new NotFoundException(`Comentário #${id} não encontrado`);

    alvo.curtidas = Math.max(0, Number(alvo.curtidas || 0) + (curtir ? 1 : -1));
    return this.normalizar(alvo);
  }

  /**
   * Resposta oficial da equipe, enviada pelo painel administrativo.
   * Sempre vinculada a um comentário principal (não a outra resposta).
   */
  async responderOficial(id: number, dto: any) {
    const texto = String(
      dto?.texto_comentario ?? dto?.textoComentario ?? dto?.texto ?? '',
    ).trim();

    if (!texto) {
      throw new BadRequestException('Escreva o texto da resposta oficial.');
    }
    if (texto.length > 2000) {
      throw new BadRequestException('A resposta deve ter no máximo 2000 caracteres.');
    }

    if (this.supabase.disponivel) {
      const { data: pai, error: erroBusca } = await this.supabase.db
        .from('comentarios')
        .select('id, ponto_coleta_id, resposta_a')
        .eq('id', id)
        .maybeSingle();

      if (erroBusca) throw new InternalServerErrorException(erroBusca.message);
      if (!pai) throw new NotFoundException(`Comentário #${id} não encontrado`);
      if (pai.resposta_a != null) {
        throw new BadRequestException(
          'Só é possível responder comentários principais.',
        );
      }

      const { data, error } = await this.supabase.db
        .from('comentarios')
        .insert({
          ponto_coleta_id: Number(pai.ponto_coleta_id),
          nome_autor: AUTOR_OFICIAL,
          email_autor: EMAIL_OFICIAL,
          texto_comentario: texto,
          curtidas: 0,
          resposta_a: Number(pai.id),
          oficial: true,
        })
        .select('*')
        .single();

      if (error) throw new InternalServerErrorException(error.message);
      return this.normalizar(data);
    }

    const pai = this.comentarios.find((c) => Number(c.id) === id);
    if (!pai) throw new NotFoundException(`Comentário #${id} não encontrado`);
    if (pai.resposta_a != null) {
      throw new BadRequestException(
        'Só é possível responder comentários principais.',
      );
    }

    const novo = {
      id: this.proximoId++,
      ponto_coleta_id: Number(pai.ponto_coleta_id),
      nome_autor: AUTOR_OFICIAL,
      email_autor: EMAIL_OFICIAL,
      texto_comentario: texto,
      curtidas: 0,
      resposta_a: Number(pai.id),
      oficial: true,
      data: new Date().toISOString(),
    };
    this.comentarios.push(novo);
    return this.normalizar(novo);
  }

  async remover(id: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('comentarios')
        .delete()
        .eq('id', id)
        .select('id');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Comentário #${id} não encontrado`);
      }
      return { mensagem: `Comentário #${id} removido` };
    }

    const idx = this.comentarios.findIndex((c) => Number(c.id) === id);
    if (idx !== -1) this.comentarios.splice(idx, 1);
    return { mensagem: `Comentário #${id} removido` };
  }
}
