#!/usr/bin/env node
/**
 * qr.js — gera QR Code no terminal (e opcionalmente em PNG)
 * ---------------------------------------------------------
 * Uso:
 *   node tools/qr.js "http://192.168.1.64:5500/"
 *   node tools/qr.js --titulo "Abra no celular" "http://192.168.1.64:5500/"
 *   node tools/qr.js --wifi "MinhaRede" "minhaSenha"
 *   node tools/qr.js --png qr-code.png "http://192.168.1.64:5500/"
 *
 * Depende do pacote `qrcode` (instalado em tools/). Se faltar, avisa e sai.
 *
 * O desenho no terminal é feito à mão a partir da matriz do QR: nada de
 * códigos ANSI, então funciona em qualquer console do Windows.
 */

let QRCode;
try {
  QRCode = require('qrcode');
} catch (e) {
  console.error('[qr] falta o pacote "qrcode". Rode:  npm install   (dentro de tools/)');
  process.exit(2);
}

// ---------------------------------------------------------------- argumentos
const bruto = process.argv.slice(2);
const opcoes = { png: null, wifi: null, titulo: null, pequeno: false, inverter: false, dados: null };

for (let i = 0; i < bruto.length; i++) {
  const a = bruto[i];
  if (a === '--png') opcoes.png = bruto[++i];
  else if (a === '--titulo') opcoes.titulo = bruto[++i];
  else if (a === '--pequeno') opcoes.pequeno = true;
  else if (a === '--inverter') opcoes.inverter = true;
  else if (a === '--wifi') opcoes.wifi = { ssid: bruto[++i], senha: bruto[++i] };
  else if (!opcoes.dados) opcoes.dados = a;
}

/** Escapa caracteres especiais do formato WIFI: (vírgula, ponto e vírgula, dois-pontos...). */
function escaparWifi(texto) {
  return String(texto == null ? '' : texto).replace(/([\\;,:"])/g, '\\$1');
}

let texto = opcoes.dados;
let legenda = opcoes.dados;

if (opcoes.wifi) {
  const { ssid, senha } = opcoes.wifi;
  const tipo = senha ? 'WPA' : 'nopass';
  texto = `WIFI:T:${tipo};S:${escaparWifi(ssid)};P:${escaparWifi(senha)};H:false;;`;
  legenda = senha ? `Wi-Fi: ${ssid}  (senha: ${senha})` : `Wi-Fi: ${ssid}  (rede aberta)`;
}

if (!texto) {
  console.error('Uso: node tools/qr.js [--png arquivo.png] [--titulo "texto"] [--pequeno] [--inverter] [--wifi "SSID" "SENHA"] "TEXTO"');
  process.exit(1);
}

// ------------------------------------------------------------- desenho ASCII
/**
 * Desenha a matriz do QR no terminal.
 * - modo normal: 2 caracteres por módulo (mantém o quadrado)
 * - modo pequeno: 1 caractere por módulo usando meio-bloco (metade da altura)
 */
function desenhar(modulos, tamanho, pequeno, margem = 2, inverter = false) {
  const escuro = (x, y) => {
    const dentro = x >= 0 && y >= 0 && x < tamanho && y < tamanho && modulos[y * tamanho + x];
    return inverter ? !dentro : dentro;
  };

  const linhas = [];

  if (pequeno) {
    for (let y = -margem; y < tamanho + margem; y += 2) {
      let linha = '';
      for (let x = -margem; x < tamanho + margem; x++) {
        const cima = escuro(x, y);
        const baixo = escuro(x, y + 1);
        linha += cima && baixo ? '█' : cima ? '▀' : baixo ? '▄' : ' ';
      }
      linhas.push(linha);
    }
  } else {
    for (let y = -margem; y < tamanho + margem; y++) {
      let linha = '';
      for (let x = -margem; x < tamanho + margem; x++) linha += escuro(x, y) ? '██' : '  ';
      linhas.push(linha);
    }
  }

  return linhas;
}

(async () => {
  try {
    const qr = QRCode.create(texto, { errorCorrectionLevel: 'M' });
    const tamanho = qr.modules.size;
    const dados = qr.modules.data;

    const linhas = desenhar(dados, tamanho, opcoes.pequeno, 2, opcoes.inverter);

    if (opcoes.titulo) console.log('\n  ' + opcoes.titulo);
    console.log('');
    for (const linha of linhas) console.log('  ' + linha);
    console.log('');
    console.log('  ' + legenda);
    console.log('');

    if (opcoes.png) {
      await QRCode.toFile(opcoes.png, texto, {
        margin: 2,
        width: 512,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f2419', light: '#ffffff' },
      });
      console.log('  PNG salvo em: ' + opcoes.png + '\n');
    }
  } catch (erro) {
    console.error('[qr] falhou:', erro.message);
    process.exit(1);
  }
})();
