/**
 * Sobe o bundle da Vercel localmente para testes.
 * Uso: node tools/servidor-vercel-teste.js
 * Depois acesse http://127.0.0.1:3100/api/pontos-coleta
 */
const http = require('node:http');
const path = require('node:path');

const bundle = require(path.join(__dirname, '..', 'api', '[...caminho].js'));
const handler = bundle.default || bundle;

const porta = process.env.PORT_TESTE || 3100;

const servidor = http.createServer((req, res) => handler(req, res));

servidor.listen(porta, '127.0.0.1', () => {
  console.log(`Bundle da Vercel rodando em http://127.0.0.1:${porta}/api`);
});
