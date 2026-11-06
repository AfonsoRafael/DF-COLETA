import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Serviço global do Supabase.
 *
 * Se as credenciais não estiverem configuradas (ou USE_MOCK=true), o sistema
 * continua funcionando com os dados em memória — útil para desenvolvimento
 * sem internet. Assim que SUPABASE_URL e SUPABASE_KEY forem preenchidos com
 * valores reais, todas as operações passam a usar o PostgreSQL do Supabase.
 */
@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly cliente: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {
    const url = String(this.configService.get<string>('SUPABASE_URL') || '').trim();
    const chave = String(this.configService.get<string>('SUPABASE_KEY') || '').trim();
    const forcarMock =
      String(this.configService.get<string>('USE_MOCK') || '').toLowerCase() === 'true';

    const urlValida = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url);
    const chaveValida =
      chave.length >= 40 && !/sua|exemplo|placeholder|coloque/i.test(chave);

    if (!forcarMock && urlValida && chaveValida) {
      this.cliente = createClient(url.replace(/\/+$/, ''), chave, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.logger.log('Supabase configurado — usando o banco PostgreSQL.');
    } else {
      this.logger.warn(
        'Supabase não configurado — usando dados em memória (mock). ' +
          'Preencha SUPABASE_URL e SUPABASE_KEY no .env para persistir.',
      );
    }
  }

  /** true quando há um projeto Supabase válido configurado. */
  get disponivel(): boolean {
    return this.cliente !== null;
  }

  /** Cliente Supabase (lança erro se não estiver configurado). */
  get db(): SupabaseClient {
    if (!this.cliente) {
      throw new Error('Supabase não configurado. Preencha SUPABASE_URL e SUPABASE_KEY.');
    }
    return this.cliente;
  }
}
