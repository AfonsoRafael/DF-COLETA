/**
 * pontos.js – Funções auxiliares de renderização (usadas por outras páginas).
 * As variáveis todosPontos e localizacaoUsuario vivem no index.js.
 */

/**
 * Renderiza a lista de pontos no elemento #listaPontos (página pontos.html).
 * @param {Array} pontos
 */
function renderizarPontos(pontos) {
  const container = document.getElementById('listaPontos');
  if (!container) return;

  container.innerHTML = '';

  if (pontos.length === 0) {
    container.innerHTML = '<p class="lista-pontos__carregando">Nenhum ponto encontrado com os filtros selecionados.</p>';
    return;
  }

  pontos.forEach((ponto) => {
    const card = criarCardPonto(ponto);
    container.appendChild(card);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();

  if (typeof exibirMarcadores === 'function') {
    exibirMarcadores(pontos);
  }
}

/**
 * Cria o elemento HTML de um card de ponto (para a página pontos.html).
 * @param {Object} ponto
 * @returns {HTMLElement}
 */
function criarCardPonto(ponto) {
  const card = document.createElement('div');
  card.className = 'card-ponto';
  card.setAttribute('data-id', ponto.id);

  const loc = typeof localizacaoUsuario !== 'undefined' ? localizacaoUsuario : null;

  const tagsHtml = (ponto.residuos || [])
    .map((r) => `<span class="tag">${iconeResiduoHtml(r)} ${r.nome}</span>`)
    .join('');

  let distanciaHtml = '';
  if (loc && ponto.latitude && ponto.longitude) {
    const dist = calcularDistancia(loc.lat, loc.lng, ponto.latitude, ponto.longitude);
    distanciaHtml = `<p class="card-ponto__distancia"><i data-lucide="navigation"></i> ${dist.toFixed(1)} km de você</p>`;
  }

  card.innerHTML = `
    <p class="card-ponto__nome">${ponto.nome}</p>
    <p class="card-ponto__endereco"><i data-lucide="map-pin"></i> ${ponto.endereco}${ponto.cidade ? `, ${ponto.cidade}` : ''}</p>
    ${distanciaHtml}
    <div class="card-ponto__tags">${tagsHtml}</div>
  `;

  card.addEventListener('click', () => {
    const prefix = window.location.pathname.includes('/pages/') ? '' : 'pages/';
    window.location.href = `${prefix}ponto-detalhe.html?id=${ponto.id}`;
  });

  return card;
}

/**
 * Renderiza os cards de tipos de resíduos no elemento #listaResiduos.
 * @param {Array} residuos
 */
function renderizarResiduos(residuos) {
  const container = document.getElementById('listaResiduos');
  if (!container) return;

  container.innerHTML = '';

  residuos.forEach((residuo) => {
    const card = document.createElement('div');
    card.className = 'card-residuo';
    card.innerHTML = `
      <div class="card-residuo__icone">${iconeResiduoHtml(residuo)}</div>
      <p class="card-residuo__nome">${residuo.nome}</p>
      <p class="card-residuo__descricao">${residuo.descricao || ''}</p>
    `;
    container.appendChild(card);
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Preenche os selects de filtro (usado na página pontos.html).
 * @param {Array} pontos
 * @param {Array} residuos
 */
function preencherFiltros(pontos, residuos) {
  const selectResiduo = document.getElementById('filtroResiduo');
  if (selectResiduo && residuos) {
    residuos.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = r.nome;
      selectResiduo.appendChild(opt);
    });
  }

  const selectCidade = document.getElementById('filtroCidade');
  if (selectCidade && pontos) {
    const cidades = [...new Set(pontos.map((p) => p.cidade).filter(Boolean))].sort();
    cidades.forEach((cidade) => {
      const opt = document.createElement('option');
      opt.value = cidade;
      opt.textContent = cidade;
      selectCidade.appendChild(opt);
    });
  }
}
