/**
 * api.js – Módulo de comunicação com a API backend (NestJS + Supabase)
 * Todas as chamadas HTTP ao backend passam por aqui.
 */

// Detecta automaticamente o host:
// - PC e celular na mesma rede → backend local na porta 3000
// - Produção (Vercel) → mesma origem, prefixo /api
function calcularBaseApi() {
  const host = window.location.hostname || 'localhost';
  const local =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /\.local$/.test(host) ||
    !host.includes('.');

  return local ? `http://${host}:3000` : '/api';
}

const API_BASE_URL = calcularBaseApi();

/**
 * Realiza uma requisição HTTP e retorna os dados JSON.
 * @param {string} caminho - Caminho da rota (ex: '/pontos-coleta')
 * @param {RequestInit} opcoes - Opções do fetch (method, body, headers)
 * @returns {Promise<any>}
 */
async function requisicao(caminho, opcoes = {}) {
  const url = `${API_BASE_URL}${caminho}`;
  const token = sessionStorage.getItem('df_admin_token');

  const cabecalhosPadrao = {
    'Content-Type': 'application/json',
  };
  if (token) cabecalhosPadrao.Authorization = `Bearer ${token}`;

  const resposta = await fetch(url, {
    headers: { ...cabecalhosPadrao, ...(opcoes.headers || {}) },
    ...opcoes,
  });

  if (resposta.status === 401) {
    sessionStorage.removeItem('df_admin_token');
    sessionStorage.removeItem('df_admin_email');

    if (window.location.pathname.includes('/admin/')) {
      window.location.href = 'login.html';
    }
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({ mensagem: 'Erro desconhecido' }));
    throw new Error(erro.mensagem || erro.message || `Erro HTTP ${resposta.status}`);
  }

  return resposta.json();
}

// ==========================================
// PONTOS DE COLETA
// ==========================================

/**
 * Busca todos os pontos de coleta ativos.
 * @param {Object} filtros - Objeto com filtros opcionais (residuo, cidade, estabelecimento)
 * @returns {Promise<Array>}
 */
async function buscarPontosColeta(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.residuo)        params.append('residuo', filtros.residuo);
  if (filtros.cidade)         params.append('cidade', filtros.cidade);
  if (filtros.tipo)           params.append('tipo', filtros.tipo);
  if (filtros.estabelecimento) params.append('estabelecimento', filtros.estabelecimento);
  if (filtros.busca)          params.append('busca', filtros.busca);

  const query = params.toString() ? `?${params.toString()}` : '';
  return requisicao(`/pontos-coleta${query}`);
}

/**
 * Busca um ponto de coleta pelo ID.
 * @param {number} id
 * @returns {Promise<Object>}
 */
async function buscarPontoPorId(id) {
  return requisicao(`/pontos-coleta/${id}`);
}

// ==========================================
// RESÍDUOS
// ==========================================

/**
 * Busca todos os tipos de resíduos cadastrados.
 * @returns {Promise<Array>}
 */
async function buscarResiduos() {
  return requisicao('/residuos');
}

// ==========================================
// ÍCONES DE RESÍDUO (Lucide)
// ==========================================
// Mapa de apoio por nome — usado como fallback para dados antigos
// que ainda guardavam um emoji no campo `icone`.
const ICONES_RESIDUO_POR_NOME = {
  'Eletrônicos':       'monitor',
  'Pilhas e Baterias': 'battery-charging',
  'Óleo de Cozinha':   'droplets',
  'Papel e Papelão':   'package',
  'Plástico':          'recycle',
  'Vidro':             'wine',
  'Metal':             'wrench',
  'Medicamentos':      'pill',
  'Lâmpadas':          'lightbulb',
  'TVs Analógicas':    'tv',
  'Orgânico':          'leaf',
};

/**
 * Descobre o nome do ícone Lucide de um resíduo.
 * Aceita tanto o slug novo (ex.: 'monitor') quanto o objeto do resíduo.
 * @param {Object|string} residuo
 * @returns {string} nome do ícone Lucide
 */
function iconeResiduo(residuo) {
  if (!residuo) return 'recycle';
  const valor = typeof residuo === 'string' ? residuo : residuo.icone;
  if (valor && /^[a-z0-9-]+$/.test(valor)) return valor;         // já é um slug
  const nome = typeof residuo === 'object' ? residuo.nome : '';
  return ICONES_RESIDUO_POR_NOME[nome] || 'recycle';
}

/**
 * Retorna o HTML do ícone Lucide de um resíduo (pronto para innerHTML).
 * @param {Object|string} residuo
 * @param {string} [classe] Classes CSS extras no <i>
 * @returns {string}
 */
function iconeResiduoHtml(residuo, classe) {
  return `<i data-lucide="${iconeResiduo(residuo)}"${classe ? ` class="${classe}"` : ''}></i>`;
}

// ==========================================
// COMENTÁRIOS
// ==========================================

/**
 * Busca os comentários de um ponto de coleta específico.
 * @param {number} pontoId
 * @returns {Promise<Array>}
 */
async function buscarComentariosPorPonto(pontoId) {
  return requisicao(`/comentarios/ponto/${pontoId}`);
}

/**
 * Envia um comentário sobre um ponto de coleta.
 * @param {Object} dados - { pontoColetaId, nomeAutor, emailAutor, textoComentario }
 * @returns {Promise<Object>}
 */
async function enviarComentario(dados) {
  const payload = {
    ...dados,
    ponto_coleta_id: dados.ponto_coleta_id || dados.pontoColetaId,
    nome_autor: dados.nome_autor || dados.nomeAutor,
    email_autor: dados.email_autor || dados.emailAutor,
    texto_comentario: dados.texto_comentario || dados.textoComentario,
  };
  return requisicao('/comentarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Curte ou remove a curtida de um comentário.
 * @param {number} id
 * @param {boolean} curtir
 * @returns {Promise<Object>} comentário atualizado
 */
async function curtirComentario(id, curtir = true) {
  return requisicao(`/comentarios/${id}/curtir`, {
    method: 'PATCH',
    body: JSON.stringify({ curtir }),
  });
}

/**
 * Publica a resposta oficial da equipe a um comentário principal.
 * Rota protegida: exige o token do administrador (enviado por `requisicao`).
 * @param {number} id - comentário que será respondido
 * @param {string} texto
 * @returns {Promise<Object>} resposta oficial criada
 */
async function responderOficialComentario(id, texto) {
  return requisicao(`/comentarios/${id}/responder`, {
    method: 'POST',
    body: JSON.stringify({ texto_comentario: texto }),
  });
}

// ==========================================
// PROBLEMAS RELATADOS
// ==========================================

/**
 * Envia um problema relatado sobre um ponto de coleta.
 * @param {Object} dados - { pontoColetaId, nomeAutor, emailAutor, textoProblema }
 * @returns {Promise<Object>}
 */
async function relatarProblema(dados) {
  return requisicao('/problemas', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

// ==========================================
// SUGESTÕES DE NOVOS PONTOS
// ==========================================

/**
 * Envia uma sugestão de novo ponto de coleta.
 * @param {Object} dados - { nomeAutor, emailAutor, textoSugestao, nomeLocal, endereco }
 * @returns {Promise<Object>}
 */
async function sugerirPonto(dados) {
  return requisicao('/sugestoes', {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}
