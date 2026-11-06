/**
 * Gera o bundle da API para a Vercel.
 *
 * Saída: ../api/[...caminho].js (função catch-all autocontida).
 * O bundle inclui NestJS, Express e supabase-js, então a Vercel não precisa
 * instalar dependências no runtime da função.
 */
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raizBackend = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const saida = resolve(raizBackend, '..', 'api', 'index.js');

mkdirSync(dirname(saida), { recursive: true });

// Importante: empacotamos o JavaScript já compilado (dist), pois o esbuild
// não emite os metadados de decorators que o NestJS usa para injeção.
await build({
  entryPoints: [resolve(raizBackend, 'dist', 'vercel.js')],
  outfile: saida,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: false,
  minify: false,
  // Pacotes opcionais do NestJS (microservices/websockets) não são usados
  // pela API HTTP e não estão instalados — o Nest os carrega em try/catch.
  external: [
    '@nestjs/microservices',
    '@nestjs/microservices/*',
    '@nestjs/websockets',
    '@nestjs/websockets/*',
  ],
  logLevel: 'info',
});

console.log(`Bundle gerado em: ${saida}`);
