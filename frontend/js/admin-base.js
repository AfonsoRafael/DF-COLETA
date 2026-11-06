/**
 * admin-base.js – Módulo base compartilhado por todas as páginas do Painel Admin
 * Inclui:
 * - Guard de autenticação (verificarAuth)
 * - Controle do drawer responsivo (toggleSidebar, fecharSidebar)
 * - Função de encerramento de sessão (logout / sair)
 * - Inicialização automática de ícones Lucide e informações do usuário
 */

/**
 * Base da API do backend. Usa o host atual, então funciona tanto no PC
 * (localhost) quanto acessando pelo IP da rede em outro aparelho.
 * Em produção (Vercel) usa a mesma origem com o prefixo /api.
 * @type {string}
 */
const DF_API_BASE = (() => {
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
})();

/**
 * Injeta o token do Supabase em todas as chamadas fetch feitas pelas páginas
 * do painel (inclusive as que não usam o helper `requisicao`).
 * Também centraliza o tratamento de sessão expirada (401).
 */
(function aplicarTokenNasRequisicoes() {
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = function (entrada, init = {}) {
    const url =
      typeof entrada === 'string'
        ? entrada
        : entrada && typeof entrada === 'object' && 'url' in entrada
          ? entrada.url
          : '';

    const ehApi = url.startsWith(DF_API_BASE) || url.startsWith('/api');
    if (!ehApi) return fetchOriginal(entrada, init);

    const token = sessionStorage.getItem('df_admin_token');
    const cabecalhos = new Headers(
      init.headers || (entrada && typeof entrada === 'object' ? entrada.headers : undefined),
    );
    if (token) cabecalhos.set('Authorization', `Bearer ${token}`);

    return fetchOriginal(entrada, { ...init, headers: cabecalhos }).then((resposta) => {
      if (resposta.status === 401) {
        sessionStorage.removeItem('df_admin_token');
        sessionStorage.removeItem('df_admin_email');
        window.location.href = obterCaminhoLogin();
      }
      return resposta;
    });
  };
})();

/**
 * Obtém o caminho relativo correto para a página de login
 * considerando se a página atual já está dentro de /admin/ ou em outro nível.
 * @returns {string}
 */
function obterCaminhoLogin() {
  const caminho = window.location.pathname || '';
  if (caminho.includes('/admin/')) {
    return 'login.html';
  }
  return 'pages/admin/login.html';
}

/**
 * Guard de autenticação: verifica se o administrador está autenticado na sessão.
 * O token é validado pelo backend em cada rota protegida.
 * Se não estiver, redireciona imediatamente para o login.
 * @returns {boolean}
 */
function verificarAuth() {
  if (!sessionStorage.getItem('df_admin_token')) {
    window.location.href = obterCaminhoLogin();
    return false;
  }
  return true;
}

/**
 * Alterna a visibilidade da sidebar no modo responsivo (drawer mobile)
 */
function toggleSidebar() {
  const sidebar = document.querySelector('.admin-sidebar') || document.querySelector('.sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');
  if (sidebar) {
    const isAberta = sidebar.classList.toggle('admin-sidebar--aberta');
    sidebar.classList.toggle('aberta', isAberta);
    if (overlay) {
      overlay.classList.toggle('ativo', isAberta);
    }
  }
}

/**
 * Fecha a sidebar no modo responsivo (drawer mobile)
 */
function fecharSidebar() {
  const sidebar = document.querySelector('.admin-sidebar') || document.querySelector('.sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');
  if (sidebar) {
    sidebar.classList.remove('admin-sidebar--aberta');
    sidebar.classList.remove('aberta');
  }
  if (overlay) {
    overlay.classList.remove('ativo');
  }
}

/**
 * Abre a sidebar no modo responsivo (drawer mobile)
 */
function abrirSidebar() {
  const sidebar = document.querySelector('.admin-sidebar') || document.querySelector('.sidebar');
  const overlay = document.querySelector('.admin-sidebar-overlay');
  if (sidebar) {
    sidebar.classList.add('admin-sidebar--aberta');
    sidebar.classList.add('aberta');
  }
  if (overlay) {
    overlay.classList.add('ativo');
  }
}

/**
 * Encerra a sessão administrativa e redireciona para a tela de login
 */
function logout() {
  const token = sessionStorage.getItem('df_admin_token');

  sessionStorage.removeItem('df_admin_token');
  sessionStorage.removeItem('df_admin_refresh');
  sessionStorage.removeItem('df_admin_email');
  sessionStorage.removeItem('admin_autenticado');
  sessionStorage.removeItem('admin_email');

  // Encerra também a sessão no Supabase Auth (best effort)
  if (token && window.DF_SUPABASE?.url && window.DF_SUPABASE?.anonKey && window.supabase?.createClient) {
    try {
      const cliente = window.supabase.createClient(
        window.DF_SUPABASE.url,
        window.DF_SUPABASE.anonKey,
        { auth: { persistSession: false } },
      );
      cliente.auth.signOut().catch(() => {});
    } catch {
      /* ignora falhas de rede no logout */
    }
  }

  window.location.href = obterCaminhoLogin();
}

// Alias global para compatibilidade com páginas legadas
window.sair = logout;

/**
 * Move o botão de tema (criado pelo tema.js como botão flutuante) para
 * dentro da barra superior do painel. Sem isso ele fica sobreposto ao
 * rodapé da sidebar.
 */
function integrarBotaoTema() {
  const flutuante = document.querySelector('.df-tema-toggle');
  if (!flutuante) return;

  let alvo = document.querySelector('.admin-topbar__acoes') || document.querySelector('.admin-topbar__right');
  if (!alvo) {
    const topbar = document.querySelector('.admin-topbar');
    if (!topbar) return;
    alvo = document.createElement('div');
    alvo.className = 'admin-topbar__acoes';
    topbar.appendChild(alvo);
  }

  flutuante.classList.remove('df-tema-toggle');
  flutuante.classList.add('admin-tema-btn');
  alvo.appendChild(flutuante);
}

// O tema.js avisa quando o botão foi criado (ele roda depois deste script)
document.addEventListener('df:tema-botao-pronto', integrarBotaoTema);

/* ==========================================================================
   Modais — acessibilidade e fechamento
   Vale para qualquer modal do painel (`.admin-modal`):
   - marca role/aria-modal e leva o foco para dentro ao abrir;
   - prende o foco enquanto aberto (Tab e Shift+Tab em ciclo);
   - ESC e clique no fundo fecham;
   - devolve o foco para o elemento que abriu;
   - trava a rolagem do fundo.
   ========================================================================== */
const SELETOR_MODAL = '.admin-modal';
const SELETOR_MODAL_ABERTO = '.admin-modal.aberto';
const SELETOR_CAIXA_MODAL = '.admin-modal__box';

let elementoQueAbriuModal = null;

/** Caixa visível do modal (onde ficam o formulário e os botões). */
function caixaDoModal(modal) {
  return modal.querySelector(SELETOR_CAIXA_MODAL) || modal;
}

/** Elementos realmente focáveis dentro de um container. */
function elementosFocaveis(raiz) {
  const seletor = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(raiz.querySelectorAll(seletor)).filter(
    (el) => el.getClientRects().length > 0
  );
}

/** Modal aberto no momento (ou null). */
function obterModalAberto() {
  return document.querySelector(SELETOR_MODAL_ABERTO);
}

/** Prepara o modal recém-aberto: ARIA, foco e travamento do fundo. */
function prepararModal(modal) {
  const caixa = caixaDoModal(modal);
  const titulo = modal.querySelector('.admin-modal__title, h2, h3');

  modal.removeAttribute('aria-hidden');
  caixa.setAttribute('role', 'dialog');
  caixa.setAttribute('aria-modal', 'true');

  if (titulo) {
    if (!titulo.id) titulo.id = (modal.id || 'df-modal') + '-titulo';
    caixa.setAttribute('aria-labelledby', titulo.id);
  }

  elementoQueAbriuModal = document.activeElement;
  document.body.classList.add('modal-aberto');

  /* Foco inicial: o primeiro campo do formulário; se não houver, um botão que
     não seja destrutivo (nunca abrir já focado em "Excluir"). */
  const focaveis = elementosFocaveis(caixa);
  const campos = focaveis.filter((el) => el.matches('input, select, textarea'));
  const seguro = focaveis.find(
    (el) => el.matches('button, a') && !el.classList.contains('btn-acao-perigo') && !el.classList.contains('admin-btn--perigo')
  );
  const alvoFoco = campos[0] || seguro;

  if (alvoFoco) {
    alvoFoco.focus({ preventScroll: true });
  } else {
    caixa.setAttribute('tabindex', '-1');
    caixa.focus({ preventScroll: true });
  }
}

/** Fecha o modal aberto e devolve o foco para quem o abriu. */
function fecharModalAberto() {
  const modal = obterModalAberto();
  if (!modal) return false;

  modal.classList.remove('aberto');
  modal.setAttribute('aria-hidden', 'true');

  if (!document.querySelector(SELETOR_MODAL_ABERTO)) {
    document.body.classList.remove('modal-aberto');
  }

  if (elementoQueAbriuModal && typeof elementoQueAbriuModal.focus === 'function') {
    elementoQueAbriuModal.focus({ preventScroll: true });
  }
  elementoQueAbriuModal = null;
  return true;
}

// Detecta a abertura/fechamento por mudança de classe (as páginas usam
// `modal.classList.add('aberto')`, então não é preciso alterar cada tela).
const observadorModais = new MutationObserver((mutacoes) => {
  mutacoes.forEach((m) => {
    const alvo = m.target;
    if (!alvo.classList || !alvo.matches || !alvo.matches(SELETOR_MODAL)) return;

    if (alvo.classList.contains('aberto')) {
      if (alvo.dataset.dfModalPronto !== '1') {
        alvo.dataset.dfModalPronto = '1';
        prepararModal(alvo);
      }
    } else {
      delete alvo.dataset.dfModalPronto;
    }
  });
});

// ESC fecha e Tab circula dentro do modal
document.addEventListener('keydown', (e) => {
  const modal = obterModalAberto();
  if (!modal) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    fecharModalAberto();
    return;
  }

  if (e.key !== 'Tab') return;

  const caixa = caixaDoModal(modal);
  const focaveis = elementosFocaveis(caixa);
  if (focaveis.length === 0) {
    e.preventDefault();
    return;
  }

  const primeiro = focaveis[0];
  const ultimo = focaveis[focaveis.length - 1];
  const ativo = document.activeElement;
  const foraDoModal = !caixa.contains(ativo);

  if (e.shiftKey && (ativo === primeiro || foraDoModal)) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && (ativo === ultimo || foraDoModal)) {
    e.preventDefault();
    primeiro.focus();
  }
});

// Clique no fundo (fora da caixa) fecha
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.matches(SELETOR_MODAL_ABERTO)) {
    fecharModalAberto();
  }
});

// Inicialização de interface ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  observadorModais.observe(document.body, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true,
  });

  // Reaproveita o botão de tema dentro da barra superior
  integrarBotaoTema();

  // Inicializa ícones Lucide se o script estiver carregado
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Preenche o email ou nome do administrador logado
  const emailAdmin = sessionStorage.getItem('df_admin_email') || 'admin@dfcoleta.com';
  const elementosEmail = document.querySelectorAll('[data-admin-email], #adminEmail, .admin-topbar__user-role');
  elementosEmail.forEach(el => {
    if (el) el.textContent = emailAdmin;
  });

  const elementoBemVindo = document.getElementById('bemVindo');
  if (elementoBemVindo && !elementoBemVindo.textContent.trim().startsWith('Logado')) {
    elementoBemVindo.textContent = `Logado como: ${emailAdmin}`;
  }

  // Fecha a sidebar ao pressionar Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      fecharSidebar();
    }
  });

  // Fecha a sidebar ao clicar em links no mobile
  const linksNav = document.querySelectorAll('.admin-sidebar__nav-item, .sidebar__nav a');
  linksNav.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        fecharSidebar();
      }
    });
  });
});
