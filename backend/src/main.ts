import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/**
 * O frontend pode ser aberto de várias formas: no PC (localhost), pelo celular
 * usando o IP da rede, por um nome da máquina (ex.: http://meu-pc.local:5500)
 * ou publicado na Vercel. Esta função libera exatamente esses casos — e
 * continua barrando sites externos.
 */
function ehOrigemDeRedeLocal(origem: string): boolean {
  let host: string;
  try {
    host = new URL(origem).hostname.toLowerCase().replace(/^\[|\]$/g, '');
  } catch {
    return false;
  }

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (host.startsWith('127.')) return true;                       // loopback
  if (host.startsWith('192.168.')) return true;                   // rede doméstica
  if (host.startsWith('10.')) return true;                        // rede privada
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;       // rede privada
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true; // CGNAT / Tailscale
  if (host.startsWith('169.254.')) return true;                   // link-local
  if (/^(fc|fd)[0-9a-f]{2}:/.test(host)) return true;             // IPv6 local (ULA)
  if (/^fe[89ab][0-9a-f]:/.test(host)) return true;               // IPv6 link-local
  if (/\.(local|lan|home|internal|localdomain)$/.test(host)) return true; // mDNS
  if (!host.includes('.')) return true;                           // nome simples da máquina

  return false;
}

/** Origens extras permitidas (produção), configuradas em FRONTEND_URL. */
function origensExtras(): string[] {
  return String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origem) => origem.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export function origemPermitida(origem?: string): boolean {
  if (!origem) return true; // Postman, curl, chamadas same-origin
  if (ehOrigemDeRedeLocal(origem)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origem)) return true;
  if (/^https:\/\/[a-z0-9-]+\.df-coleta\.vercel\.app$/i.test(origem)) return true;

  const extras = origensExtras();
  return extras.some(
    (permitida) => origem === permitida || origem.startsWith(`${permitida}/`),
  );
}

/**
 * Cria e configura a aplicação NestJS.
 * Exportada para ser reutilizada pelo adaptador serverless da Vercel.
 */
export async function criarApp(
  adaptador?: any,
): Promise<INestApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    adaptador,
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (origemPermitida(origin)) return callback(null, true);
      callback(new Error(`CORS bloqueado para: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  return app;
}

async function bootstrap() {
  const app = await criarApp();
  const porta = process.env.PORT ?? 3000;
  await app.listen(porta, '0.0.0.0');
  console.log(`DF Coleta API rodando em: http://localhost:${porta}`);
}

// Só sobe o servidor HTTP quando executado diretamente (npm start).
// No bundle da Vercel (api/index.js), o adaptador chama criarApp().
if (require.main === module) {
  void bootstrap();
}
