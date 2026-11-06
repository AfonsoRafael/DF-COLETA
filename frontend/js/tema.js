/**
 * tema.js — Alternância de tema claro/escuro (Fase 1 do redesign)
 *
 * Como funciona:
 *  - Lê a preferência salva em localStorage ('df-tema'); se não houver,
 *    usa a preferência do sistema (prefers-color-scheme).
 *  - Aplica no <html data-theme="light|dark"> e salva a escolha.
 *  - Injeta automaticamente um botão flutuante (sol/lua) em toda página.
 *
 * Inclua este script no <head> (síncrono) para evitar "flash" de tema.
 */
(function () {
  var CHAVE = 'df-tema';
  var root = document.documentElement;

  function preferenciaInicial() {
    try {
      var salvo = localStorage.getItem(CHAVE);
      if (salvo === 'dark' || salvo === 'light') return salvo;
    } catch (e) { /* localStorage indisponível */ }
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark'
      : 'light';
  }

  /** Ícones são decorativos: quem informa é o texto/aria-label ao lado. */
  function marcarIconesDecorativos() {
    document.querySelectorAll('svg.lucide:not([aria-hidden])').forEach(function (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    });
  }

  function atualizarBotoes(tema) {
    var icone = tema === 'dark' ? 'sun' : 'moon';
    var rotulo = tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
    document.querySelectorAll('[data-toggle-tema]').forEach(function (btn) {
      btn.innerHTML = '<i data-lucide="' + icone + '"></i>';
      btn.setAttribute('aria-label', rotulo);
      btn.setAttribute('title', rotulo);
    });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
    marcarIconesDecorativos();
  }

  function aplicar(tema) {
    root.setAttribute('data-theme', tema);
    try { localStorage.setItem(CHAVE, tema); } catch (e) { /* noop */ }
    atualizarBotoes(tema);
    /* Avisa quem depende do tema (ex.: camada de tiles do mapa) */
    document.dispatchEvent(new CustomEvent('df:tema', { detail: { tema: tema } }));
  }

  function alternar() {
    aplicar(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  }

  /* Aplica imediatamente (antes da pintura) para evitar flash */
  root.setAttribute('data-theme', preferenciaInicial());

  /* Expõe API global */
  window.dfTema = {
    alternar: alternar,
    aplicar: aplicar,
    iconesDecorativos: marcarIconesDecorativos,
  };

  function criarBotaoFlutuante() {
    if (document.querySelector('[data-toggle-tema]')) return; // já existe botão na página
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'df-tema-toggle';
    btn.setAttribute('data-toggle-tema', '');
    btn.addEventListener('click', alternar);
    document.body.appendChild(btn);
    atualizarBotoes(root.getAttribute('data-theme'));
  }

  /* Registrado em `document` de propósito: listeners de `window` só rodam
     depois que o evento borbulha, e o admin-base.js (carregado no fim da
     página) precisa encontrar o botão já criado para movê-lo ao cabeçalho. */
  document.addEventListener('DOMContentLoaded', function () {
    criarBotaoFlutuante();
    document.querySelectorAll('[data-toggle-tema]').forEach(function (b) {
      b.addEventListener('click', alternar);
    });
    atualizarBotoes(root.getAttribute('data-theme'));
    marcarIconesDecorativos();
    /* Avisa quem quer reposicionar o botão (ex.: barra superior do admin) */
    document.dispatchEvent(new CustomEvent('df:tema-botao-pronto'));
  });
})();
