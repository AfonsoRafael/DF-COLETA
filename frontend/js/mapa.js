/**
 * mapa.js – Integração com Leaflet.js + OpenStreetMap (sem chave de API)
 * Exibe os pontos de coleta no mapa e calcula proximidade.
 */

let mapaInstancia = null;
let marcadoresLeaflet = [];
let marcadoresPorId = {};
let marcadorUsuario = null;
let camadaTiles = null;
let ultimosPontos = [];        // guardado p/ redesenhar ao trocar de tema
let posicaoUsuario = null;     // [lat, lng] do usuário

/* ===================== Temas, cores e movimento ===================== */

/** Lê um token CSS (ex.: --df-primary) para usar em HTML de ícone/Leaflet. */
function tokenCor(nome, padrao) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || padrao;
}

/** O usuário pediu menos animação no sistema? */
function mapaMovimentoReduzido() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** Duração de voo respeitando "movimento reduzido". */
function mapaDuracao(segundos) {
  return mapaMovimentoReduzido() ? 0 : segundos;
}

/**
 * Cria a camada de tiles (OpenStreetMap, sem chave de API).
 * No tema escuro o "escurecimento" é feito por filtro CSS na .leaflet-tile-pane
 * (ver global.css) — assim não dependemos de provedor com API key.
 */
function criarCamadaTiles() {
  if (!mapaInstancia) return;
  camadaTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapaInstancia);
}

/** Ícone de ponto com a cor da marca no tema atual. */
function criarIconePonto() {
  const verde = tokenCor('--df-primary', '#0f8a4d');
  return L.divIcon({
    className: 'df-marcador',
    html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 1C7.716 1 1 7.716 1 16c0 10.5 12.6 22.7 14.3 24.2a1.7 1.7 0 0 0 2.4 0C19.4 38.7 31 26.5 31 16 31 7.716 24.284 1 16 1Z"
            fill="${verde}" stroke="#ffffff" stroke-width="1.7"/>
      <circle cx="16" cy="15.5" r="9" fill="#ffffff"/>
      <g transform="translate(9.5 9) scale(0.54)"
         fill="none" stroke="${verde}" stroke-width="2.4"
         stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
        <path d="m14 16-3 3 3 3"/>
        <path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
        <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
        <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
      </g>
    </svg>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

/** Ícone "você está aqui" com pulso discreto. */
function criarIconeUsuario() {
  return L.divIcon({
    className: 'df-voce',
    html: '<span class="df-voce__pulso" aria-hidden="true"></span><span class="df-voce__ponto" aria-hidden="true"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Inicializa o mapa Leaflet no elemento com id="mapa".
 * Chamado automaticamente quando o DOM carrega.
 */
function inicializarMapa() {
  const elementoMapa = document.getElementById('mapa');
  if (!elementoMapa || mapaInstancia) return;

  // Centro padrão: Brasília - DF
  const centroDf = [-15.7801, -47.9292];

  mapaInstancia = L.map('mapa', {
    center: centroDf,
    zoom: 11,
    zoomControl: false,         // removemos o controle padrão para reposicionar
    attributionControl: true,
  });

  // Tiles do OpenStreetMap (o dark mode é aplicado por filtro CSS)
  criarCamadaTiles();

  // Controle de zoom no canto inferior direito
  L.control.zoom({ position: 'bottomright' }).addTo(mapaInstancia);

  return mapaInstancia;
}

/**
 * Liga/desliga a interação do usuário com o mapa (arrastar, zoom, etc.).
 * Usado no mobile para deixar o mapa em modo "preview" (não-interativo).
 * @param {boolean} ativo
 */
function definirInteracaoMapa(ativo) {
  if (!mapaInstancia) return;
  [
    mapaInstancia.dragging,
    mapaInstancia.touchZoom,
    mapaInstancia.scrollWheelZoom,
    mapaInstancia.doubleClickZoom,
    mapaInstancia.boxZoom,
    mapaInstancia.keyboard,
  ].forEach((handler) => {
    if (!handler) return;
    if (ativo) handler.enable();
    else handler.disable();
  });
}

/**
 * Exibe marcadores no mapa Leaflet para cada ponto de coleta.
 * @param {Array} pontos - Lista de pontos de coleta
 */
function exibirMarcadores(pontos) {
  if (!mapaInstancia) return;

  ultimosPontos = pontos || [];

  // Remove marcadores anteriores
  marcadoresLeaflet.forEach((m) => mapaInstancia.removeLayer(m));
  marcadoresLeaflet = [];
  marcadoresPorId = {};

  // Ícone personalizado (cor da marca no tema atual)
  const iconePonto = criarIconePonto();

  pontos.forEach((ponto) => {
    if (!ponto.latitude || !ponto.longitude) return;

    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));

    const tags = (ponto.residuos || []).slice(0, 4).map((r) =>
      `<span style="display:inline-block;background:var(--df-primary-soft);color:var(--df-primary);border:1px solid var(--df-primary-border);border-radius:99px;padding:2px 8px;font-size:11px;margin:2px;">${esc(r.nome)}</span>`
    ).join('');

    const popup = `
      <div style="min-width:180px;font-family:var(--df-font);line-height:1.4;">
        <strong style="color:var(--df-primary);font-size:0.9rem;">${esc(ponto.nome)}</strong>
        <p style="margin:4px 0 6px;font-size:0.78rem;color:var(--df-text-soft);">${esc(ponto.endereco)} · ${esc(ponto.cidade)}</p>
        <div style="margin-bottom:8px;">${tags}</div>
        <a href="pages/ponto-detalhe.html?id=${ponto.id}"
           style="display:inline-block;background:var(--df-primary);color:#fff;padding:5px 12px;border-radius:99px;font-size:0.78rem;text-decoration:none;font-weight:600;">
          Ver detalhes →
        </a>
      </div>
    `;

    const marcador = L.marker([ponto.latitude, ponto.longitude], { icon: iconePonto })
      .addTo(mapaInstancia)
      .bindPopup(popup, { maxWidth: 240 });

    marcadoresLeaflet.push(marcador);
    marcadoresPorId[ponto.id] = marcador;
  });
}

/**
 * Centraliza o mapa em um ponto e abre o seu popup.
 * @param {number} id
 * @param {number} zoom
 */
function focarPontoNoMapa(id, zoom = 15) {
  const marcador = marcadoresPorId[id];
  if (!mapaInstancia || !marcador) return;
  const pos = marcador.getLatLng();
  mapaInstancia.flyTo([pos.lat, pos.lng], zoom, { duration: mapaDuracao(1) });
  setTimeout(() => marcador.openPopup(), mapaMovimentoReduzido() ? 60 : 550);
}

/**
 * Adiciona/move o marcador de posição do usuário no mapa.
 * @param {number} lat
 * @param {number} lng
 */
function marcarUsuarioNoMapa(lat, lng) {
  if (!mapaInstancia) return;

  posicaoUsuario = [lat, lng];

  if (marcadorUsuario) {
    marcadorUsuario.setLatLng([lat, lng]);
    marcadorUsuario.setIcon(criarIconeUsuario());
  } else {
    marcadorUsuario = L.marker([lat, lng], { icon: criarIconeUsuario(), zIndexOffset: 1000 })
      .addTo(mapaInstancia)
      .bindPopup('<strong>Você está aqui</strong>');
  }
}

/**
 * Centraliza o mapa na posição do usuário.
 * @param {number} lat
 * @param {number} lng
 * @param {number} zoom
 */
function centralizarMapa(lat, lng, zoom = 13) {
  if (!mapaInstancia) return;
  mapaInstancia.flyTo([lat, lng], zoom, { duration: mapaDuracao(1.2) });
}

/**
 * Abre o Google Maps com direções para um ponto de coleta.
 */
function abrirGoogleMaps(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

/**
 * Calcula distância em km entre dois pontos geográficos (Haversine).
 */
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = grausParaRad(lat2 - lat1);
  const dLng = grausParaRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(grausParaRad(lat1)) * Math.cos(grausParaRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function grausParaRad(graus) {
  return graus * (Math.PI / 180);
}

/* ===================== Reação à troca de tema ===================== */
/* tema.js dispara 'df:tema' — redesenhamos os ícones, pois a cor dos
   marcadores vem dos tokens e precisa ser lida de novo.
   (Os tiles escurecem via filtro CSS, não precisam ser recriados.) */
document.addEventListener('df:tema', () => {
  if (!mapaInstancia) return;
  if (ultimosPontos.length) exibirMarcadores(ultimosPontos);
  if (posicaoUsuario) marcarUsuarioNoMapa(posicaoUsuario[0], posicaoUsuario[1]);
});
