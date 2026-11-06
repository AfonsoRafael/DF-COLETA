/**
 * Adaptador serverless da Vercel.
 *
 * O arquivo api/[...caminho].js recebe todas as requisições /api/*.
 * Removemos o prefixo /api e entregamos a requisição ao Express do NestJS.
 */
import 'reflect-metadata';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { INestApplication } from '@nestjs/common';
import { criarApp } from './main';

const servidor = express();
let aplicacao: Promise<INestApplication> | null = null;

function iniciar() {
  return criarApp(new ExpressAdapter(servidor)).then((app) => app.init());
}

export default async function handler(req: any, res: any) {
  try {
    if (!aplicacao) aplicacao = iniciar();
    await aplicacao;

    const urlOriginal = String(req.url || '/');

    // A Vercel entrega todas as chamadas /api/* nesta função (api/index.js).
    // O caminho original chega no parâmetro "caminho" via rewrite do vercel.json.
    const capturado = urlOriginal.match(/[?&]caminho=([^&]*)/);
    if (capturado && capturado[1]) {
      req.url = '/' + decodeURIComponent(capturado[1]);
    } else {
      req.url = urlOriginal.replace(/^\/api(?=\/|$)/, '') || '/';
    }

    servidor(req, res);
  } catch (erro) {
    console.error('[vercel] falha ao processar a requisição:', erro);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify({ mensagem: 'Erro interno no servidor' }));
  }
}
