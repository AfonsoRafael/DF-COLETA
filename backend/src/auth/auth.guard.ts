import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Guard de autenticação para as rotas administrativas.
 *
 * - Com Supabase configurado: exige `Authorization: Bearer <access_token>`
 *   e valida o token no Supabase Auth.
 * - Sem Supabase (modo mock local): libera, para não travar o desenvolvimento.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    if (!this.supabase.disponivel) return true;

    const requisicao = contexto.switchToHttp().getRequest();
    const cabecalho = String(requisicao.headers?.authorization || '');
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7).trim() : '';

    if (!token) {
      throw new UnauthorizedException('Faça login para acessar esta área.');
    }

    const { data, error } = await this.supabase.db.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }

    requisicao.usuario = data.user;
    return true;
  }
}
