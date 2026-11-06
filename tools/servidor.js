#!/usr/bin/env node
/**
 * servidor.js — servidor estático do frontend do DF Coleta
 * ---------------------------------------------------------
 * Sobe a pasta `frontend/` num servidor HTTP simples (senão o celular não
 * consegue abrir: `file://` só funciona no PC).
 *
 * Sem dependências. Uso:
 *   node tools/servidor.js [porta] [pasta] [--silencioso]
 *
 * Extras:
 *   GET /qr  → página com o QR Code grande do site (para mostrar na tela)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const dgram = require('dgram');

// ---------------------------------------------------------------- argumentos
const args = process.argv.slice(2);
const silencioso = args.includes('--silencioso');
const posicionais = args.filter((a) => !a.startsWith('--'));

const PORTA = Number(posicionais[0]) || 5500;
const RAIZ = path.resolve(posicionais[1] || path.join(__dirname, '..', 'frontend'));

// ------------------------------------------------------------------ utilidade
const MIMES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

/** Faixas que existem mesmo em rede local (IPv4): particulares, CGNAT/Tailscale e link-local. */
const FAIXA_LOCAL = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

/** Todos os IPv4 de rede (fora 127.x e 169.254.x), com o nome do adaptador. */
function listarIps() {
  const saida = [];
  const adaptadores = os.networkInterfaces();
  for (const nome of Object.keys(adaptadores)) {
    for (const info of adaptadores[nome] || []) {
      if (info.family !== 'IPv4' || info.internal) continue;
      if (info.address.startsWith('169.254.')) continue; // APIPA: não serve para o celular
      saida.push({ adaptador: nome, ip: info.address });
    }
  }
  return saida;
}

/**
 * IP da interface que tem rota para a internet — é o que o celular precisa usar.
 * Abre um socket UDP e lê o IP escolhido pelo sistema (nada é enviado).
 */
function ipDaRota() {
  return new Promise((resolve) => {
    let socket;
    let resolvido = false;

    const terminar = (valor) => {
      if (resolvido) return;
      resolvido = true;
      try { socket.close(); } catch (e) { /* já fechado */ }
      resolve(valor);
    };

    try {
      socket = dgram.createSocket('udp4');
      const relogio = setTimeout(() => terminar(null), 800);

      socket.on('error', () => { clearTimeout(relogio); terminar(null); });
      socket.connect(53, '8.8.8.8', () => {
        clearTimeout(relogio);
        let ip = null;
        try { ip = socket.address().address; } catch (e) { ip = null; }
        terminar(ip);
      });
    } catch (e) {
      terminar(null);
    }
  });
}

/** Plano B: primeira faixa de rede local encontrada. */
function ipAlternativo() {
  const todos = listarIps();
  const local = todos.find((i) => FAIXA_LOCAL.test(i.ip));
  if (local) return local.ip;
  return todos.length ? todos[0].ip : 'localhost';
}

let IP_LOCAL = 'localhost';

/** IP usado no QR e nos avisos (definido na subida do servidor). */
function ipLocal() {
  return IP_LOCAL;
}

function responder(res, codigo, corpo, tipo = 'text/plain; charset=utf-8') {
  res.writeHead(codigo, {
    'Content-Type': tipo,
    'Cache-Control': 'no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(corpo);
}

function log(...partes) {
  if (!silencioso) console.log('[frontend]', ...partes);
}

// --------------------------------------------------------------- página do QR
async function paginaQr(req, res) {
  const ip = ipLocal();
  const alvo = `http://${ip}:${PORTA}/`;
  let svg = '';
  let aviso = '';

  try {
    const QRCode = require('qrcode');
    svg = await QRCode.toString(alvo, { type: 'svg', margin: 1, width: 360, errorCorrectionLevel: 'M' });
  } catch (e) {
    aviso = '<p style="color:#b45309">Pacote "qrcode" não instalado — rode <code>npm install</code> em <code>tools/</code>. Mostrando só o endereço.</p>';
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>DF Coleta — QR Code</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
         background:#f4f7f5; color:#0f2419; text-align:center; padding:24px; }
  .card { background:#fff; border:1px solid #e3ebe7; border-radius:22px; padding:28px 32px 32px;
          box-shadow:0 12px 40px -12px rgba(15,36,25,.24); max-width:520px; }
  .marca { display:inline-flex; align-items:center; gap:10px; font-weight:800; letter-spacing:-.02em; font-size:1.15rem; }
  .bolinha { width:34px; height:34px; border-radius:10px; background:#0f8a4d; color:#fff;
             display:grid; place-items:center; font-size:.95rem; }
  h1 { font-size:1.35rem; margin:18px 0 6px; letter-spacing:-.02em; }
  p  { margin:0 0 16px; color:#4b6157; font-size:.92rem; line-height:1.5; }
  .qr { display:grid; place-items:center; padding:12px; border:1px solid #e3ebe7; border-radius:16px; background:#fff; }
  .qr svg { display:block; max-width:100%; height:auto; }
  code { background:#dcf3e5; color:#0c7040; padding:2px 7px; border-radius:6px; font-size:.86rem; }
  .url { margin-top:16px; font-size:1.05rem; font-weight:600; }
  .dica { margin-top:10px; font-size:.82rem; color:#7c9086; }
</style>
</head>
<body>
  <div class="card">
    <div class="marca"><span class="bolinha">♻</span> DF Coleta</div>
    <h1>Aponte a câmera do celular</h1>
    <p>O celular precisa estar na mesma rede Wi-Fi do computador.</p>
    ${aviso}
    <div class="qr">${svg || '<em>QR indisponível</em>'}</div>
    <div class="url">${alvo}</div>
    <div class="dica">Saia desta tela e abra o endereço acima no celular.</div>
  </div>
</body>
</html>`;

  responder(res, 200, html, 'text/html; charset=utf-8');
}

// ------------------------------------------------------------------- servidor
const servidor = http.createServer((req, res) => {
  const caminho = decodeURIComponent((req.url || '/').split('?')[0]);

  if (caminho === '/qr' || caminho === '/qr/') {
    paginaQr(req, res).catch(() => responder(res, 500, 'Erro ao gerar o QR'));
    return;
  }

  const relativo = caminho === '/' ? 'index.html' : caminho.replace(/^\/+/, '');
  const destino = path.resolve(RAIZ, relativo);

  // segurança: não deixa sair da pasta do frontend
  if (destino !== RAIZ && !destino.startsWith(RAIZ + path.sep)) {
    responder(res, 403, '403 — Caminho não permitido');
    return;
  }

  const enviarArquivo = (arquivo) => {
    fs.stat(arquivo, (erro, info) => {
      if (erro || !info.isFile()) {
        // tenta completar a extensão (ex.: /pages/pontos → pontos.html)
        if (!path.extname(arquivo)) {
          const comHtml = arquivo + '.html';
          fs.stat(comHtml, (e2, i2) => {
            if (!e2 && i2.isFile()) enviarArquivo(comHtml);
            else {
              log(`404 ${caminho}`);
              responder(res, 404, '404 — Arquivo não encontrado');
            }
          });
          return;
        }
        log(`404 ${caminho}`);
        responder(res, 404, '404 — Arquivo não encontrado');
        return;
      }

      const tipo = MIMES[path.extname(arquivo).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': tipo,
        'Content-Length': info.size,
        'Cache-Control': 'no-store, must-revalidate',
      });
      if (req.method === 'HEAD') { res.end(); return; }

      const fluxo = fs.createReadStream(arquivo);
      fluxo.on('error', () => { res.destroy(); });
      fluxo.pipe(res);
      log(`200 ${caminho}`);
    });
  };

  enviarArquivo(destino);
});

servidor.on('error', (erro) => {
  if (erro.code === 'EADDRINUSE') {
    console.error(`[frontend] A porta ${PORTA} já está em uso. Feche o outro programa ou use outra porta.`);
  } else {
    console.error('[frontend] Erro:', erro.message);
  }
  process.exit(1);
});

// Sobe detectando o IP certo primeiro (o celular precisa dele no QR).
(async () => {
  const rota = await ipDaRota();
  IP_LOCAL = rota && !rota.startsWith('169.254.') ? rota : ipAlternativo();

  servidor.listen(PORTA, '0.0.0.0', () => {
    const ip = ipLocal();
    const outros = listarIps().map((i) => i.ip).filter((i) => i !== ip);

    console.log(`[frontend] servindo ${RAIZ}`);
    console.log(`[frontend] PC:    http://localhost:${PORTA}/`);
    console.log(`[frontend] Rede:  http://${ip}:${PORTA}/`);
    console.log(`[frontend] QR:    http://localhost:${PORTA}/qr`);
    if (outros.length) console.log(`[frontend] outros IPs desta máquina: ${outros.join(', ')}`);
  });
})();

process.on('SIGINT', () => { servidor.close(() => process.exit(0)); });
process.on('SIGTERM', () => { servidor.close(() => process.exit(0)); });
