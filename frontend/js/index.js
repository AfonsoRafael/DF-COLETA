/**
 * index.js – Home (landing) do DF Coleta.
 *
 * Responsabilidades:
 *  1. Carregar pontos e resíduos da API (com fallback de demonstração).
 *  2. Preencher números, categorias e destaques da landing.
 *  3. Mapa PRÉ-CARREGADO: inicializa junto com a página.
 *  4. Mobile: preview compacto centrado na localização + "Abrir para mais detalhes".
 *  5. Expandir/recolher o mapa em tela cheia.
 *  6. Lista de resultados arrastável / minimizável (bottom-sheet no mobile / painel no desktop).
 */

// ===================== ESTADO =====================
let todosPontos = [];
let todosResiduos = [];
let localizacaoUsuario = null;

let filtroResiduoAtivo = '';
let filtroResiduoNome = '';
let termoBusca = '';

let mapaIniciado = false;
let mapaExpandido = false;
let geolocalizacaoSolicitada = false;

const ehMobile = () => window.innerWidth < 768;

// ===================== DADOS DE FALLBACK =====================
// Garante que a home apareça mesmo sem o backend ligado (modo demonstração).
const DADOS_FALLBACK = {
  residuos: [
    { id: 1,  nome: 'Eletrônicos',       icone: 'monitor' },
    { id: 2,  nome: 'Pilhas e Baterias', icone: 'battery-charging' },
    { id: 3,  nome: 'Óleo de Cozinha',   icone: 'droplets' },
    { id: 4,  nome: 'Papel e Papelão',   icone: 'package' },
    { id: 5,  nome: 'Plástico',          icone: 'recycle' },
    { id: 6,  nome: 'Vidro',             icone: 'wine' },
    { id: 7,  nome: 'Metal',             icone: 'wrench' },
    { id: 8,  nome: 'Medicamentos',      icone: 'pill' },
    { id: 9,  nome: 'Lâmpadas',          icone: 'lightbulb' },
    { id: 10, nome: 'TVs Analógicas',    icone: 'tv' },
  ],
  pontos: [
    {
      id: 1, nome: 'Ecoponto Asa Norte', endereco: 'SCLN 407, Bloco A', cidade: 'Plano Piloto',
      latitude: -15.7442, longitude: -47.8825, status: 'ATIVO',
      residuos: [
        { nome: 'Plástico', icone: 'recycle' },
        { nome: 'Vidro', icone: 'wine' },
        { nome: 'Metal', icone: 'wrench' },
      ],
    },
    {
      id: 2, nome: 'Ponto Taguatinga', endereco: 'QNM 12, Conjunto A', cidade: 'Taguatinga',
      latitude: -15.8334, longitude: -48.0553, status: 'ATIVO',
      residuos: [
        { nome: 'Pilhas e Baterias', icone: 'battery-charging' },
        { nome: 'Eletrônicos', icone: 'monitor' },
      ],
    },
    {
      id: 3, nome: 'Coleta de Óleo — Gama', endereco: 'Setor Central, Lote 5', cidade: 'Gama',
      latitude: -16.0067, longitude: -48.0633, status: 'ATIVO',
      residuos: [
        { nome: 'Óleo de Cozinha', icone: 'droplets' },
        { nome: 'Medicamentos', icone: 'pill' },
      ],
    },
    {
      id: 4, nome: 'Ecoponto Ceilândia', endereco: 'QNN 14, Área Especial', cidade: 'Ceilândia',
      latitude: -15.8205, longitude: -48.1081, status: 'ATIVO',
      residuos: [
        { nome: 'Papel e Papelão', icone: 'package' },
        { nome: 'Eletrônicos', icone: 'monitor' },
      ],
    },
    {
      id: 5, nome: 'Ponto Recicla Sobradinho', endereco: 'Quadra Central, Lote 3', cidade: 'Sobradinho',
      latitude: -15.6544, longitude: -47.7936, status: 'ATIVO',
      residuos: [
        { nome: 'Lâmpadas', icone: 'lightbulb' },
        { nome: 'TVs Analógicas', icone: 'tv' },
      ],
    },
  ],
};

// ===================== UTILITÁRIOS =====================
function atualizarIcones() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
  // Ícones são decorativos: quem informa é o texto/aria-label ao lado deles.
  document.querySelectorAll('svg.lucide:not([aria-hidden])').forEach((svg) => {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  });
}

function escapar(valor) {
  return String(valor == null ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Cria um literal string de JS seguro para usar dentro de um atributo HTML.
 * Ex.: jsStr("Óleo") -> 'Óleo'  (aspas simples escapadas sobrevivem ao decode de entidades)
 */
function jsStr(valor) {
  const s = String(valor == null ? '' : valor)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n')
    .replace(/"/g, '&quot;');
  return `'${s}'`;
}

function definirTexto(id, valor) {
  const el = document.getElementById(id);
  if (el) el.textContent = valor;
}

// ===================== INICIALIZAÇÃO =====================
document.addEventListener('DOMContentLoaded', () => {
  configurarBuscaHero();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mapaExpandido) fecharMapa();
  });

  window.addEventListener('resize', atualizarModoMapa);

  carregarDados();
});

// ===================== CARREGAMENTO DE DADOS =====================
async function carregarDados() {
  try {
    const [pontos, residuos] = await Promise.all([buscarPontosColeta(), buscarResiduos()]);
    todosPontos = Array.isArray(pontos) ? pontos : [];
    todosResiduos = Array.isArray(residuos) ? residuos : [];
    if (!todosPontos.length) throw new Error('Sem pontos retornados');
  } catch (erro) {
    console.warn('Backend indisponível — usando dados de demonstração.', erro);
    todosPontos = DADOS_FALLBACK.pontos;
    todosResiduos = DADOS_FALLBACK.residuos;
  }

  renderizarEstatisticas();
  renderizarCategorias();
  renderizarAtalhosBusca();
  renderizarDestaques();
  atualizarIcones();

  // Mapa pré-carregado: monta junto com a página.
  iniciarMapa();
}

function renderizarEstatisticas() {
  const cidades = new Set(todosPontos.map((p) => p.cidade).filter(Boolean));
  definirTexto('statPontos', todosPontos.length);
  definirTexto('statCidades', cidades.size);
  definirTexto('statResiduos', todosResiduos.length);
}

// ===================== CATEGORIAS =====================
function renderizarCategorias() {
  const grid = document.getElementById('categoriasGrid');
  if (!grid) return;

  grid.innerHTML = todosResiduos.map((r) => `
    <button class="cat" onclick="abrirMapa({ residuo: ${jsStr(r.id)}, residuoNome: ${jsStr(r.nome)} })">
      <span class="cat__icon">${iconeResiduoHtml(r)}</span>
      <span class="cat__nome">${escapar(r.nome)}</span>
    </button>
  `).join('');

  atualizarIcones();
}

// ===================== ATALHOS DE BUSCA =====================
/** Chips abaixo da busca que abrem o mapa já filtrado (1 toque). */
function renderizarAtalhosBusca() {
  const wrap = document.getElementById('buscaAtalhos');
  if (!wrap) return;

  const atalhos = todosResiduos.slice(0, 5);
  if (!atalhos.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = atalhos.map((r) => `
    <button type="button" class="busca-atalho" onclick="abrirMapa({ residuo: ${jsStr(r.id)}, residuoNome: ${jsStr(r.nome)} })">
      <i data-lucide="${iconeResiduo(r)}"></i>${escapar(r.nome)}
    </button>
  `).join('');

  atualizarIcones();
}

// ===================== DESTAQUES =====================
function renderizarDestaques() {
  const grid = document.getElementById('destaquesGrid');
  if (!grid) return;

  const destaques = todosPontos.slice(0, 3);

  if (!destaques.length) {
    grid.innerHTML = '<p class="lista__carregando">Nenhum ponto disponível.</p>';
    return;
  }

  grid.innerHTML = destaques.map((p) => {
    const primeiro = (p.residuos && p.residuos[0]) || null;
    const tags = (p.residuos || []).slice(0, 3)
      .map((r) => `<span class="tag">${escapar(r.nome)}</span>`).join('');
    const dist = distanciaAte(p);

    return `
      <article class="ponto-card" onclick="irParaDetalhe(${Number(p.id)})">
        <span class="ponto-card__icone">${iconeResiduoHtml(primeiro || 'recycle')}</span>
        <div class="ponto-card__info">
          <h3>${escapar(p.nome)}</h3>
          <p><i data-lucide="map-pin"></i> ${escapar(p.endereco)}${p.cidade ? ` · ${escapar(p.cidade)}` : ''}</p>
          <div class="tags">${tags}</div>
        </div>
        ${dist ? `<span class="ponto-card__dist">${dist}</span>` : ''}
      </article>
    `;
  }).join('');

  atualizarIcones();
}

function distanciaAte(ponto) {
  if (!localizacaoUsuario || !ponto.latitude || !ponto.longitude) return '';
  const km = calcularDistancia(localizacaoUsuario.lat, localizacaoUsuario.lng, ponto.latitude, ponto.longitude);
  return `${km.toFixed(1)} km`;
}

function irParaDetalhe(id) {
  window.location.href = `pages/ponto-detalhe.html?id=${id}`;
}

// ===================== BUSCA DO HERO =====================
function configurarBuscaHero() {
  const form = document.getElementById('formBuscaHero');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const termo = (document.getElementById('inputBuscaHero').value || '').trim();
    abrirMapa({ busca: termo });
  });
}

// ===================== MAPA (PRÉ-CARREGADO) =====================
function iniciarMapa() {
  if (mapaIniciado || typeof inicializarMapa !== 'function') return;
  if (!document.getElementById('mapa')) return;

  inicializarMapa();
  mapaIniciado = true;

  configurarBuscaMapa();
  configurarPainelArrastavel();
  configurarPreview();
  configurarNavChips();
  renderizarChips();
  atualizarFiltros();
  atualizarModoMapa();

  // O Leaflet precisa recalcular após o layout estabilizar.
  setTimeout(() => {
    if (mapaInstancia) mapaInstancia.invalidateSize();
    atualizarModoMapa();
  }, 80);

  observarSecaoMapa();
  atualizarIcones();
}

/** Ajusta interação/estado do mapa conforme o breakpoint e o modo (preview ou tela cheia). */
function atualizarModoMapa() {
  definirInteracaoMapa(!ehMobile() || mapaExpandido);
  posicionarSheet();
  sincronizarBotaoVerLista();
  atualizarNavChips();
}

function configurarBuscaMapa() {
  const input = document.getElementById('inputBuscaMapa');
  if (!input || input.dataset.wired) return;
  input.dataset.wired = '1';
  input.addEventListener('input', () => {
    termoBusca = input.value.trim();
    atualizarFiltros();
  });
}

/** No mobile, um toque no preview abre a tela cheia (menos nos botões). */
function configurarPreview() {
  const preview = document.getElementById('mapaPreview');
  if (!preview || preview.dataset.wired) return;
  preview.dataset.wired = '1';
  preview.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    if (ehMobile() && !mapaExpandido) abrirParaDetalhes();
  });
}

/** Solicita a localização quando a seção do mapa entra na tela. */
function observarSecaoMapa() {
  const secao = document.getElementById('mapa-secao');
  if (!secao || !('IntersectionObserver' in window)) {
    obterLocalizacao();
    return;
  }

  const obs = new IntersectionObserver((entradas) => {
    if (entradas.some((e) => e.isIntersecting)) {
      obterLocalizacao();
      obs.disconnect();
    }
  }, { threshold: 0.25 });

  obs.observe(secao);
}

/**
 * Abre o mapa em tela cheia, aplicando os filtros desejados.
 * @param {Object} opcoes - { residuo, residuoNome, busca, estado }
 *   estado: 'peek' | 'half' | 'full' (mobile). Padrão: 'half'.
 */
function abrirMapa(opcoes = {}) {
  if (typeof opcoes.residuo === 'string' && opcoes.residuo) filtroResiduoAtivo = opcoes.residuo;
  if (typeof opcoes.residuoNome === 'string' && opcoes.residuoNome) filtroResiduoNome = opcoes.residuoNome;
  if (typeof opcoes.busca === 'string') {
    termoBusca = opcoes.busca;
    const input = document.getElementById('inputBuscaMapa');
    if (input) input.value = termoBusca;
  }

  if (mapaIniciado) {
    renderizarChips();
    atualizarFiltros();
  }

  if (!mapaExpandido) expandirShell(true);

  if (ehMobile()) aplicarSheet(opcoes.estado || 'half');
  else posicionarSheet();

  atualizarIcones();
}

/** Abre a tela cheia priorizando o mapa (lista em "peek"). */
function abrirParaDetalhes() {
  abrirMapa({ estado: 'peek' });
}

/** Abre a tela cheia priorizando a lista (lista em "half"). */
function abrirComLista() {
  abrirMapa({ estado: 'half' });
}

function fecharMapa() {
  if (!mapaExpandido) return;
  expandirShell(false);
}

let focoAnteriorMapa = null;

function expandirShell(expandir) {
  const shell = document.getElementById('mapaShell');
  if (!shell) return;

  mapaExpandido = expandir;
  shell.classList.toggle('expandido', expandir);
  document.body.classList.toggle('travado', expandir);
  definirIconeExpandir(expandir);

  // Preview (mobile) = mapa não-interativo; tela cheia / desktop = interativo.
  definirInteracaoMapa(expandir || !ehMobile());

  if (expandir) {
    shell.classList.remove('painel-oculto');
    definirIconePainel(false);
    // Teclado/leitor de tela: leva o foco para dentro do mapa (sem abrir teclado virtual)
    const dentroDoShell = shell.contains(document.activeElement);
    focoAnteriorMapa = dentroDoShell ? null : document.activeElement;
    if (!dentroDoShell) {
      shell.setAttribute('tabindex', '-1');
      shell.focus({ preventScroll: true });
    }
  } else if (focoAnteriorMapa) {
    const alvo = focoAnteriorMapa;
    focoAnteriorMapa = null;
    if (document.contains(alvo)) alvo.focus({ preventScroll: true });
  }

  sincronizarBotaoVerLista();

  setTimeout(() => {
    if (mapaInstancia) mapaInstancia.invalidateSize();
    posicionarSheet();
    sincronizarBotaoVerLista();
  }, 300);
}

function definirIconeExpandir(expandido) {
  const btn = document.getElementById('btnExpandirMapa');
  if (!btn) return;
  btn.innerHTML = `<i data-lucide="${expandido ? 'minimize-2' : 'maximize-2'}"></i>`;
  const titulo = expandido ? 'Sair da tela cheia' : 'Expandir mapa';
  btn.title = titulo;
  btn.setAttribute('aria-label', titulo);
  btn.setAttribute('aria-expanded', expandido ? 'true' : 'false');
  atualizarIcones();
}

function toggleExpandirMapa() {
  if (mapaExpandido) fecharMapa();
  else abrirMapa();
}

// ===================== MOSTRAR / MINIMIZAR A LISTA =====================
/** A lista está oculta agora? (mobile: estado 'oculto'; desktop: painel oculto) */
function listaEstaOculta() {
  const shell = document.getElementById('mapaShell');
  const painel = document.getElementById('mapaPainel');
  if (!shell || !painel) return false;
  return ehMobile()
    ? painel.dataset.estado === 'oculto'
    : shell.classList.contains('painel-oculto');
}

/** Mostra o botão flutuante "Ver lista (N)" só quando a lista está oculta.
 *  Não mostra no preview mobile (ali quem reabre é o CTA "Ver lista"). */
function sincronizarBotaoVerLista() {
  const shell = document.getElementById('mapaShell');
  if (!shell) return;
  const mostrar = listaEstaOculta() && (!ehMobile() || mapaExpandido);
  shell.classList.toggle('lista-oculta', mostrar);
  sincronizarAcessibilidadeLista();
}

/** Mantém ARIA/foco coerentes quando a lista é escondida ou mostrada. */
function sincronizarAcessibilidadeLista() {
  const painel = document.getElementById('mapaPainel');
  const btnMin = document.getElementById('btnMinimizarLista');
  if (!painel) return;

  const oculta = listaEstaOculta();
  if (btnMin) btnMin.setAttribute('aria-expanded', oculta ? 'false' : 'true');

  if (oculta) {
    painel.setAttribute('aria-hidden', 'true');
    painel.setAttribute('inert', '');
    // Se o foco estava dentro da lista, manda para o botão que a reabre.
    if (painel.contains(document.activeElement)) {
      const alvo = document.getElementById('btnVerLista');
      const visivel = alvo && getComputedStyle(alvo).display !== 'none';
      if (visivel) alvo.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
  } else {
    painel.removeAttribute('aria-hidden');
    painel.removeAttribute('inert');
  }
}

/** Alterna a lista (usado pelo botão do topo do mapa). */
function togglePainel() {
  if (listaEstaOculta()) reabrirLista();
  else minimizarLista();
}

function minimizarLista() {
  const shell = document.getElementById('mapaShell');
  if (!shell) return;
  if (ehMobile()) aplicarSheet('oculto');
  else shell.classList.add('painel-oculto');
  definirIconePainel(true);
  sincronizarBotaoVerLista();
}

function reabrirLista() {
  const shell = document.getElementById('mapaShell');
  const painel = document.getElementById('mapaPainel');
  if (!shell || !painel) return;

  if (ehMobile()) {
    const estado = painel.dataset.estado;
    aplicarSheet(estado === 'oculto' || estado === 'peek' ? 'half' : estado);
  } else {
    shell.classList.remove('painel-oculto');
  }
  definirIconePainel(false);
  sincronizarBotaoVerLista();

  // Devolve o foco para dentro da lista (o anel só aparece no teclado).
  const lista = document.getElementById('mapaLista');
  if (lista) lista.focus({ preventScroll: true });

  setTimeout(() => {
    if (mapaInstancia) mapaInstancia.invalidateSize();
  }, 300);
}

function definirIconePainel(oculto) {
  const btn = document.getElementById('btnTogglePainel');
  if (!btn) return;
  btn.innerHTML = `<i data-lucide="${oculto ? 'panel-left-open' : 'panel-left'}"></i>`;
  const titulo = oculto ? 'Mostrar lista' : 'Ocultar lista';
  btn.title = titulo;
  btn.setAttribute('aria-label', titulo);
  atualizarIcones();
}

// ===================== LISTA ARRASTÁVEL (MOBILE) =====================
const sheet = { arrastando: false, inicioY: 0, inicioY0: 0, moveu: 0, y: 0 };

function elementosSheet() {
  return {
    painel: document.getElementById('mapaPainel'),
    shell: document.getElementById('mapaShell'),
  };
}

/** Altura visível desejada para cada estado (px). */
function visivelDoEstado(estado, alturaPainel, alturaShell) {
  if (estado === 'full') return alturaPainel;
  if (estado === 'half') return Math.max(alturaShell * 0.5, 200);
  if (estado === 'oculto') return 0;
  return Math.min(184, alturaPainel); // peek
}

function posicaoDoEstado(estado) {
  const { painel, shell } = elementosSheet();
  if (!painel || !shell) return 0;
  const alturaPainel = painel.offsetHeight;
  const alturaShell = shell.offsetHeight;
  const visivel = visivelDoEstado(estado, alturaPainel, alturaShell);
  return Math.max(0, Math.round(alturaPainel - visivel));
}

function aplicarSheet(estado, animar = true) {
  const { painel } = elementosSheet();
  if (!painel) return;

  painel.dataset.estado = estado;
  if (!animar) painel.classList.add('dragging');

  const y = posicaoDoEstado(estado);
  sheet.y = y;
  painel.style.setProperty('--sheet-y', `${y}px`);

  if (!animar) requestAnimationFrame(() => painel.classList.remove('dragging'));
  sincronizarBotaoVerLista();
}

/** Reposiciona o sheet conforme o estado atual (usado em resize/expansão). */
function posicionarSheet() {
  const { painel } = elementosSheet();
  if (!painel) return;
  if (!ehMobile()) {
    painel.style.removeProperty('--sheet-y');
    return;
  }
  aplicarSheet(painel.dataset.estado || 'half', false);
}

function configurarPainelArrastavel() {
  const { painel } = elementosSheet();
  const handle = document.getElementById('mapaPainelHandle');
  if (!painel || !handle || handle.dataset.wired) return;
  handle.dataset.wired = '1';

  handle.addEventListener('pointerdown', (e) => {
    if (!ehMobile()) return;
    sheet.arrastando = true;
    sheet.moveu = 0;
    sheet.inicioY = e.clientY;
    sheet.inicioY0 = posicaoDoEstado(painel.dataset.estado || 'half');
    sheet.y = sheet.inicioY0;
    painel.classList.add('dragging');
    try { handle.setPointerCapture(e.pointerId); } catch (_) { /* noop */ }
  });

  handle.addEventListener('pointermove', (e) => {
    if (!sheet.arrastando) return;
    const dy = e.clientY - sheet.inicioY;
    sheet.moveu = Math.max(sheet.moveu, Math.abs(dy));
    const alturaPainel = painel.offsetHeight;
    const y = Math.min(alturaPainel, Math.max(0, sheet.inicioY0 + dy));
    sheet.y = y;
    painel.style.setProperty('--sheet-y', `${y}px`);
  });

  const soltar = () => {
    if (!sheet.arrastando) return;
    sheet.arrastando = false;
    painel.classList.remove('dragging');

    // Toque simples (sem arrastar): alterna peek → half → full → peek
    if (sheet.moveu < 8) {
      const ciclo = { peek: 'half', half: 'full', full: 'peek', oculto: 'peek' };
      aplicarSheet(ciclo[painel.dataset.estado] || 'half');
      return;
    }

    // Snap para o estado mais próximo (inclui "oculto")
    const candidatos = ['oculto', 'peek', 'half', 'full']
      .map((estado) => ({ estado, y: posicaoDoEstado(estado) }))
      .sort((a, b) => Math.abs(a.y - sheet.y) - Math.abs(b.y - sheet.y));

    aplicarSheet(candidatos[0].estado);
  };

  handle.addEventListener('pointerup', soltar);
  handle.addEventListener('pointercancel', soltar);
}

// ===================== CHIPS DE FILTRO =====================
/** Este chip representa o filtro aplicado agora? */
function chipEstaAtivo(r) {
  if (!r.id) return !filtroResiduoAtivo && !filtroResiduoNome; // "Todos"
  if (filtroResiduoAtivo && String(r.id) === String(filtroResiduoAtivo)) return true;
  if (filtroResiduoNome && r.nome === filtroResiduoNome) return true;
  return false;
}

function renderizarChips() {
  const container = document.getElementById('chipsFiltro');
  if (!container) return;

  const chips = [{ id: '', nome: 'Todos', icone: 'layers' }, ...todosResiduos];

  // O filtro escolhido vai para a primeira posição, ficando sempre à vista.
  const idxAtivo = chips.findIndex((r) => r.id && chipEstaAtivo(r));
  if (idxAtivo > 0) chips.unshift(chips.splice(idxAtivo, 1)[0]);

  container.innerHTML = chips.map((r) => {
    const ativo = chipEstaAtivo(r);
    const podeLimpar = ativo && !!r.id; // filtro aplicado → dá pra desmarcar
    const clique = podeLimpar
      ? "selecionarResiduo('', '')"
      : `selecionarResiduo(${jsStr(r.id)}, ${jsStr(r.nome)})`;
    const titulo = podeLimpar ? 'Remover filtro' : `Filtrar por ${r.nome}`;

    return `<button class="chip${ativo ? ' chip--ativo' : ''}" onclick="${clique}"
      title="${escapar(titulo)}" aria-pressed="${ativo ? 'true' : 'false'}">
      <i data-lucide="${iconeResiduo(r)}"></i><span>${escapar(r.nome)}</span>
      ${podeLimpar ? '<i data-lucide="x" class="chip__x" aria-hidden="true"></i>' : ''}
    </button>`;
  }).join('');

  atualizarIcones();

  // Com filtro aplicado a pílula virou a primeira: mostra ela sem rolagem.
  if (idxAtivo > 0) container.scrollLeft = 0;

  requestAnimationFrame(atualizarNavChips);
}

// ===================== SETAS DOS FILTROS (CHIPS) =====================
/** Rola a faixa de filtros (usado pelas setas ‹ ›). */
function rolarChips(direcao) {
  const row = document.getElementById('chipsFiltro');
  if (!row) return;
  const passo = Math.max(140, Math.round(row.clientWidth * 0.8));
  row.scrollBy({ left: direcao * passo, behavior: 'smooth' });

  // Recalcula as setas/degradês mesmo se a animação não emitir "scroll" na hora.
  clearTimeout(row._navTimer);
  row._navTimer = setTimeout(atualizarNavChips, 340);
}

/** Mostra/esconde as setas e o degradê conforme a posição da rolagem. */
function atualizarNavChips() {
  const row = document.getElementById('chipsFiltro');
  const wrap = document.getElementById('chipsWrap');
  const prev = document.querySelector('.chips__nav--prev');
  const next = document.querySelector('.chips__nav--next');
  if (!row || !prev || !next) return;

  const max = row.scrollWidth - row.clientWidth;
  const temMais = max > 2;
  const noInicio = row.scrollLeft <= 2;
  const noFim = row.scrollLeft >= max - 2;

  prev.hidden = !temMais || noInicio;
  next.hidden = !temMais || noFim;

  if (wrap) {
    wrap.classList.toggle('chips--mais', temMais && !noFim);
    wrap.classList.toggle('chips--menos', temMais && !noInicio);
  }
}

function configurarNavChips() {
  const row = document.getElementById('chipsFiltro');
  if (!row || row.dataset.wired) return;
  row.dataset.wired = '1';

  row.addEventListener('scroll', atualizarNavChips, { passive: true });

  // Roda do mouse → rolagem horizontal dos filtros
  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (row.scrollWidth <= row.clientWidth) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });
}

function selecionarResiduo(id, nome = '') {
  filtroResiduoAtivo = id;
  filtroResiduoNome = id ? nome : '';
  renderizarChips();
  atualizarFiltros();
}

// ===================== FILTRAGEM =====================
function pontosFiltrados() {
  const termo = termoBusca.toLowerCase();

  let lista = todosPontos.filter((p) => {
    const bateResiduo = (!filtroResiduoAtivo && !filtroResiduoNome) ||
      (p.residuos || []).some((r) =>
        (filtroResiduoAtivo && String(r.id) === String(filtroResiduoAtivo)) ||
        (filtroResiduoNome && String(r.nome) === String(filtroResiduoNome))
      );
    const bateTermo = !termo ||
      (p.nome || '').toLowerCase().includes(termo) ||
      (p.endereco || '').toLowerCase().includes(termo) ||
      (p.cidade || '').toLowerCase().includes(termo);
    return bateResiduo && bateTermo;
  });

  // Ordena por proximidade quando houver localização
  if (localizacaoUsuario) {
    lista = lista.slice().sort((a, b) => {
      const da = calcularDistancia(localizacaoUsuario.lat, localizacaoUsuario.lng, a.latitude, a.longitude);
      const db = calcularDistancia(localizacaoUsuario.lat, localizacaoUsuario.lng, b.latitude, b.longitude);
      return da - db;
    });
  }

  return lista;
}

function atualizarFiltros() {
  const lista = pontosFiltrados();

  if (mapaIniciado && typeof exibirMarcadores === 'function') {
    exibirMarcadores(lista);
  }

  atualizarContador(lista.length);
  renderizarListaMapa(lista);
}

function atualizarContador(total) {
  const titulo = document.getElementById('mapaContador');
  const sub = document.getElementById('mapaSub');
  if (titulo) titulo.textContent = total === 1 ? '1 ponto encontrado' : `${total} pontos encontrados`;
  if (sub) sub.textContent = localizacaoUsuario
    ? 'Ordenados por proximidade'
    : 'Ative sua localização para ver a distância';

  // Contador também nos botões "Ver lista (N)"
  definirTexto('previewContador', total);
  definirTexto('btnVerListaContador', total);
}

function renderizarListaMapa(lista) {
  const container = document.getElementById('mapaLista');
  if (!container) return;

  if (!lista.length) {
    container.innerHTML = `
      <div class="lista__vazia">
        <div class="lista__vazia-icon"><i data-lucide="search-x"></i></div>
        <p>Nenhum ponto encontrado com esses filtros.</p>
      </div>`;
    atualizarIcones();
    return;
  }

  container.innerHTML = lista.map((p) => {
    const primeiro = (p.residuos && p.residuos[0]) || null;
    const dist = distanciaAte(p);
    return `
      <article class="ponto-card" onclick="focarPonto(${Number(p.id)})">
        <span class="ponto-card__icone">${iconeResiduoHtml(primeiro || 'recycle')}</span>
        <div class="ponto-card__info">
          <h3>${escapar(p.nome)}</h3>
          <p><i data-lucide="map-pin"></i> ${escapar(p.endereco)}${p.cidade ? ` · ${escapar(p.cidade)}` : ''}</p>
        </div>
        ${dist ? `<span class="ponto-card__dist">${dist}</span>` : ''}
      </article>
    `;
  }).join('');

  atualizarIcones();
}

// ===================== LOCALIZAÇÃO =====================
function obterLocalizacao() {
  if (geolocalizacaoSolicitada || !navigator.geolocation) return;
  geolocalizacaoSolicitada = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      localizacaoUsuario = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (mapaIniciado && typeof marcarUsuarioNoMapa === 'function') {
        marcarUsuarioNoMapa(localizacaoUsuario.lat, localizacaoUsuario.lng);
      }
      // No preview (mobile, não expandido) centraliza na localização do usuário.
      if (ehMobile() && !mapaExpandido && mapaIniciado && typeof centralizarMapa === 'function') {
        centralizarMapa(localizacaoUsuario.lat, localizacaoUsuario.lng, 13);
      }
      atualizarFiltros();   // reordena e mostra distâncias
      renderizarDestaques();
    },
    () => { /* usuário negou ou indisponível — segue sem distâncias */ },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
  );
}

function centralizarNoUsuario() {
  if (localizacaoUsuario) {
    centralizarMapa(localizacaoUsuario.lat, localizacaoUsuario.lng, 14);
  } else {
    geolocalizacaoSolicitada = false;
    obterLocalizacao();
  }
}

// ===================== FOCO EM UM PONTO =====================
function focarPonto(id) {
  if (typeof focarPontoNoMapa === 'function') {
    focarPontoNoMapa(id, 15);
  }

  // No mobile, abaixa a lista para revelar o mapa.
  if (ehMobile()) aplicarSheet('peek');
}

// ===================== EXPÕE PARA O HTML =====================
window.abrirMapa = abrirMapa;
window.fecharMapa = fecharMapa;
window.abrirParaDetalhes = abrirParaDetalhes;
window.abrirComLista = abrirComLista;
window.toggleExpandirMapa = toggleExpandirMapa;
window.togglePainel = togglePainel;
window.minimizarLista = minimizarLista;
window.reabrirLista = reabrirLista;
window.selecionarResiduo = selecionarResiduo;
window.rolarChips = rolarChips;
window.focarPonto = focarPonto;
window.centralizarNoUsuario = centralizarNoUsuario;
window.irParaDetalhe = irParaDetalhe;
