import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PONTOS_MOCK } from '../mock/dados-mock';
import { SupabaseService } from '../supabase/supabase.service';

interface FiltrosPontos {
  residuo?: string;
  cidade?: string;
  busca?: string;
  tipo?: string;
  estabelecimento?: string;
  todos?: string;
}

@Injectable()
export class PontosColetaService {
  // Cópia mutável dos dados mock (usada quando o Supabase não está configurado)
  private pontos: any[] = PONTOS_MOCK.map((p) => ({ ...p }));
  private proximoId =
    Math.max(0, ...PONTOS_MOCK.map((p) => Number(p.id) || 0)) + 1;

  constructor(private readonly supabase: SupabaseService) {}

  // =========================================================================
  // Leitura
  // =========================================================================

  async buscarTodos(filtros: FiltrosPontos) {
    const base = this.supabase.disponivel
      ? await this.listarDoSupabase()
      : this.pontos.map((p) => ({ ...p }));

    return this.aplicarFiltros(base, filtros);
  }

  async buscarPorId(id: number) {
    if (this.supabase.disponivel) {
      const { data, error } = await this.supabase.db
        .from('pontos_coleta_completo')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw new InternalServerErrorException(error.message);
      if (!data) throw new NotFoundException(`Ponto #${id} não encontrado`);
      return this.normalizarPonto(data);
    }

    const ponto = this.pontos.find((p) => p.id === id);
    if (!ponto) throw new NotFoundException(`Ponto #${id} não encontrado`);
    return ponto;
  }

  // =========================================================================
  // Escrita (admin)
  // =========================================================================

  async criar(dto: any) {
    if (!this.supabase.disponivel) {
      const novo = {
        ...dto,
        id: this.proximoId++,
        status: dto.status ?? 'ATIVO',
        tipo: dto.tipo ?? 'ECOPONTO',
        horarios_funcionamento: Array.isArray(dto.horarios_funcionamento)
          ? dto.horarios_funcionamento
          : [],
      };
      this.pontos.push(novo);
      return novo;
    }

    const { data, error } = await this.supabase.db
      .from('pontos_coleta')
      .insert({
        nome: dto.nome,
        tipo: dto.tipo ?? 'ECOPONTO',
        endereco: dto.endereco,
        cidade: dto.cidade,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        telefone: dto.telefone || null,
        status: dto.status ?? 'ATIVO',
      })
      .select('id')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    const id = Number(data.id);

    await this.sincronizarResiduos(id, dto.residuos);
    await this.sincronizarHorarios(id, dto.horarios_funcionamento);

    return this.buscarPorId(id);
  }

  async atualizar(id: number, dto: any) {
    if (!this.supabase.disponivel) {
      const idx = this.pontos.findIndex((p) => p.id === id);
      if (idx === -1) throw new NotFoundException(`Ponto #${id} não encontrado`);

      const atual = this.pontos[idx];
      const atualizado = { ...atual, ...dto };

      // Não apaga horários nem tipo quando o cliente não os envia
      if (!Array.isArray(dto.horarios_funcionamento)) {
        atualizado.horarios_funcionamento = atual.horarios_funcionamento ?? [];
      }
      if (!dto.tipo) {
        atualizado.tipo = atual.tipo ?? 'ECOPONTO';
      }

      this.pontos[idx] = atualizado;
      return atualizado;
    }

    const campos: Record<string, any> = {};
    for (const chave of [
      'nome',
      'tipo',
      'endereco',
      'cidade',
      'latitude',
      'longitude',
      'telefone',
      'status',
    ]) {
      if (dto[chave] !== undefined) campos[chave] = dto[chave];
    }

    if (Object.keys(campos).length > 0) {
      const { data, error } = await this.supabase.db
        .from('pontos_coleta')
        .update(campos)
        .eq('id', id)
        .select('id');

      if (error) throw new InternalServerErrorException(error.message);
      if (!data || data.length === 0) {
        throw new NotFoundException(`Ponto #${id} não encontrado`);
      }
    } else {
      await this.garantirExistencia(id);
    }

    if (Array.isArray(dto.residuos)) {
      await this.sincronizarResiduos(id, dto.residuos);
    }
    if (Array.isArray(dto.horarios_funcionamento)) {
      await this.sincronizarHorarios(id, dto.horarios_funcionamento);
    }

    return this.buscarPorId(id);
  }

  async alterarStatus(id: number, status: 'ATIVO' | 'INATIVO') {
    const novoStatus = String(status || '').toUpperCase();
    if (novoStatus !== 'ATIVO' && novoStatus !== 'INATIVO') {
      throw new BadRequestException('Status inválido. Use ATIVO ou INATIVO.');
    }
    return this.atualizar(id, { status: novoStatus as 'ATIVO' | 'INATIVO' });
  }

  async remover(id: number) {
    if (!this.supabase.disponivel) {
      const idx = this.pontos.findIndex((p) => p.id === id);
      if (idx === -1) throw new NotFoundException(`Ponto #${id} não encontrado`);
      this.pontos.splice(idx, 1);
      return { mensagem: `Ponto #${id} removido com sucesso` };
    }

    await this.garantirExistencia(id);

    const { error } = await this.supabase.db
      .from('pontos_coleta')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    return { mensagem: `Ponto #${id} removido com sucesso` };
  }

  // =========================================================================
  // Auxiliares
  // =========================================================================

  private async listarDoSupabase(): Promise<any[]> {
    const { data, error } = await this.supabase.db
      .from('pontos_coleta_completo')
      .select('*');

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map((p) => this.normalizarPonto(p));
  }

  private normalizarPonto(p: any) {
    return {
      ...p,
      id: Number(p.id),
      latitude: p.latitude === null ? null : Number(p.latitude),
      longitude: p.longitude === null ? null : Number(p.longitude),
      tipo: p.tipo || 'ECOPONTO',
      residuos: Array.isArray(p.residuos) ? p.residuos : [],
      horarios_funcionamento: Array.isArray(p.horarios_funcionamento)
        ? p.horarios_funcionamento
        : [],
    };
  }

  private aplicarFiltros(lista: any[], filtros: FiltrosPontos) {
    // Se ?todos=true (acesso admin), retorna todos os status; senão só ATIVO
    let resultado =
      filtros.todos === 'true'
        ? lista
        : lista.filter((p) => p.status === 'ATIVO');

    if (filtros.cidade) {
      resultado = resultado.filter(
        (p) => String(p.cidade).toLowerCase() === filtros.cidade!.toLowerCase(),
      );
    }

    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          String(p.nome || '').toLowerCase().includes(termo) ||
          String(p.endereco || '').toLowerCase().includes(termo),
      );
    }

    if (filtros.residuo) {
      resultado = resultado.filter((p) =>
        (p.residuos || []).some((r: any) => String(r.id) === filtros.residuo),
      );
    }

    if (filtros.tipo) {
      const tipo = filtros.tipo.toUpperCase();
      resultado = resultado.filter(
        (p) => String(p.tipo || '').toUpperCase() === tipo,
      );
    }

    if (filtros.estabelecimento === 'sim') {
      resultado = resultado.filter((p) => p.horarios_funcionamento.length > 0);
    } else if (filtros.estabelecimento === 'nao') {
      resultado = resultado.filter((p) => p.horarios_funcionamento.length === 0);
    }

    return resultado.sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
  }

  private async garantirExistencia(id: number) {
    const { data, error } = await this.supabase.db
      .from('pontos_coleta')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Ponto #${id} não encontrado`);
  }

  private async sincronizarResiduos(pontoId: number, residuos: any) {
    if (!Array.isArray(residuos)) return;

    const { error: erroDelete } = await this.supabase.db
      .from('ponto_residuos')
      .delete()
      .eq('ponto_id', pontoId);

    if (erroDelete) throw new InternalServerErrorException(erroDelete.message);

    const ids = [
      ...new Set(
        residuos
          .map((r: any) => Number(typeof r === 'object' && r !== null ? r.id : r))
          .filter((n) => Number.isFinite(n)),
      ),
    ];

    if (ids.length === 0) return;

    const { error } = await this.supabase.db.from('ponto_residuos').insert(
      ids.map((residuo_id) => ({ ponto_id: pontoId, residuo_id })),
    );

    if (error) throw new InternalServerErrorException(error.message);
  }

  private async sincronizarHorarios(pontoId: number, horarios: any) {
    if (!Array.isArray(horarios)) return;

    const { error: erroDelete } = await this.supabase.db
      .from('horarios_funcionamento')
      .delete()
      .eq('ponto_id', pontoId);

    if (erroDelete) throw new InternalServerErrorException(erroDelete.message);

    const linhas = horarios
      .filter(
        (h: any) =>
          h &&
          (String(h.dia_semana || '').trim() ||
            h.hora_abertura ||
            h.hora_fechamento),
      )
      .map((h: any, indice: number) => ({
        ponto_id: pontoId,
        dia_semana: String(h.dia_semana || '').trim() || 'Todos os dias',
        hora_abertura: h.hora_abertura || null,
        hora_fechamento: h.hora_fechamento || null,
        ordem: indice,
      }));

    if (linhas.length === 0) return;

    const { error } = await this.supabase.db
      .from('horarios_funcionamento')
      .insert(linhas);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
