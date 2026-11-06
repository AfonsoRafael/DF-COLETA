import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Módulo global do Supabase.
 * @Global() faz com que o SupabaseService fique disponível
 * em todos os módulos sem precisar importar explicitamente.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
