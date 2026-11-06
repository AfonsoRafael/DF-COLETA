import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PontosColetaModule } from './pontos-coleta/pontos-coleta.module';
import { ResiduosModule } from './residuos/residuos.module';
import { ComentariosModule } from './comentarios/comentarios.module';
import { ProblemasModule } from './problemas/problemas.module';
import { SugestoesModule } from './sugestoes/sugestoes.module';
import { AdminModule } from './admin/admin.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    PontosColetaModule,
    ResiduosModule,
    ComentariosModule,
    ProblemasModule,
    SugestoesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
