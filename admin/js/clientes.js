/* =====================================================================
   Bella Massa Admin — clientes.js
   Deriva clientes reais a partir dos pedidos do Firestore.
   Agrupa por telefone do cliente para construir perfil.
   ===================================================================== */

(function () {
  'use strict';

  /* ── Toast ── */
  function toast(msg, type) {
    type = type || 'success';
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast toast--' + type;
    const icons = { success: 'circle-check', error: 'circle-xmark', warning: 'triangle-exclamation', info: 'circle-info' };
    t.innerHTML = '<i class="fas fa-' + (icons[type] || 'circle-info') + '"></i><span>' + msg + '</span>';
    stack.prepend(t);
    requestAnimationFrame(() => t.classList.add('is-visible'));
    setTimeout(() => { t.classList.remove('is-visible'); setTimeout(() => t.remove(), 400); }, 3500);
  }

  /* ── Sidebar ── */
  const burgerBtn = document.getElementById('burgerBtn');
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebarBackdrop');
  if (burgerBtn) burgerBtn.addEventListener('click', () => { sidebar.classList.toggle('is-open'); backdrop.classList.toggle('is-visible'); });
  if (backdrop)  backdrop.addEventListener('click', () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); });

  /* ── State ── */
  let allClients    = [];
  let currentSeg    = 'todos';
  let currentSearch = '';

  const customerGrid = document.getElementById('customerGrid');
  const segFilters   = document.getElementById('segFilters');
  const searchInput  = document.getElementById('searchInput');

  /* ── Segmento ── */
  function getSegmento(pedidos) {
    if (pedidos >= 10) return 'vip';
    if (pedidos >= 5)  return 'frequente';
    if (pedidos >= 1)  return 'novo';
    return 'novo';
  }

  /* ── Status ativo/inativo (30 dias) ── */
  const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000;
  function getStatus(ultimoPedido) {
    if (!ultimoPedido) return 'inativo';
    const diff = Date.now() - ultimoPedido.seconds * 1000;
    return diff <= TRINTA_DIAS_MS ? 'ativo' : 'inativo';
  }

  const SEG_LABEL = { vip: 'VIP', frequente: 'Frequente', novo: 'Novo' };
  const SEG_BADGE = { vip: 'badge--gold', frequente: 'badge--info', novo: 'badge--success' };
  const SEG_ICON  = { vip: '<i class="fas fa-crown"></i> ', frequente: '', novo: '' };

  const STATUS_LABEL = { ativo: 'Ativo', inativo: 'Inativo' };
  const STATUS_BADGE = { ativo: 'badge--success', inativo: 'badge--muted' };
  const STATUS_ICON  = { ativo: '<i class="fas fa-circle" style="font-size:.55em;vertical-align:middle;"></i> ', inativo: '' };

  /* ── Render card ── */
  function renderCard(c, i) {
    const seg   = c.segmento;
    const total = c.totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const ultimo = c.ultimoPedido ? new Date(c.ultimoPedido.seconds * 1000).toLocaleDateString('pt-BR') : '—';

    const card = document.createElement('div');
    card.className = 'customer-card';
    card.dataset.seg = seg;
    card.style.cssText = 'opacity:0;transform:translateY(18px);transition:opacity 350ms ease ' + (i * 60) + 'ms,transform 350ms ease ' + (i * 60) + 'ms;';

    card.innerHTML =
      '<div class="customer-card__top">' +
        '<div class="customer-card__avatar" style="width:48px;height:48px;border-radius:50%;background:var(--a-bg-muted);display:grid;place-items:center;font-size:1.2rem;font-weight:700;color:var(--a-gold);flex-shrink:0;">' +
          c.nome.charAt(0).toUpperCase() +
        '</div>' +
        '<div>' +
          '<div class="customer-card__name">' + c.nome + '</div>' +
          '<div class="customer-card__phone">' + c.telefone + '</div>' +
          '<span class="badge ' + SEG_BADGE[seg] + '" style="margin-top:6px;margin-right:4px;">' + SEG_ICON[seg] + SEG_LABEL[seg] + '</span>' +
          '<span class="badge ' + STATUS_BADGE[c.status] + '" style="margin-top:6px;">' + STATUS_ICON[c.status] + STATUS_LABEL[c.status] + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="customer-card__stats">' +
        '<div class="customer-stat"><span class="customer-stat__val">' + c.totalPedidos + '</span><span class="customer-stat__label">Pedidos</span></div>' +
        '<div class="customer-stat"><span class="customer-stat__val">' + total + '</span><span class="customer-stat__label">Total gasto</span></div>' +
      '</div>' +
      '<div style="font-size:0.75rem;color:var(--a-text-muted);margin-top:10px;padding-top:10px;border-top:1px solid var(--a-border-soft);">' +
        '<i class="fas fa-clock" style="margin-right:4px;"></i> Último pedido: ' + ultimo +
      '</div>';

    customerGrid.appendChild(card);
    requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'none'; });
    return card;
  }

  /* ── Apply filters ── */
  function applyFilters() {
    if (!customerGrid) return;
    customerGrid.innerHTML = '';

    const filtered = allClients.filter(c => {
      let matchSeg;
      if (currentSeg === 'todos')    matchSeg = true;
      else if (currentSeg === 'inativo') matchSeg = c.status === 'inativo';
      else                           matchSeg = c.segmento === currentSeg;
      const matchQ = !currentSearch || (c.nome + ' ' + c.telefone + ' ' + (c.email || '')).toLowerCase().includes(currentSearch);
      return matchSeg && matchQ;
    });

    if (filtered.length === 0) {
      customerGrid.innerHTML = '<p style="color:var(--a-text-muted);padding:2rem;grid-column:1/-1;">Nenhum cliente encontrado.</p>';
      return;
    }

    filtered.forEach((c, i) => renderCard(c, i));
  }

  /* ── Update KPI cards ── */
  function updateKPIs() {
    const total    = allClients.length;
    const vip      = allClients.filter(c => c.segmento === 'vip').length;
    const agora    = Date.now();
    const mesMs    = 30 * 24 * 60 * 60 * 1000;
    const novos    = allClients.filter(c => c.ultimoPedido && (agora - c.ultimoPedido.seconds * 1000) < mesMs && c.segmento === 'novo').length;
    const retorno  = total > 0 ? Math.round((allClients.filter(c => c.totalPedidos > 1).length / total) * 100) : 0;

    setText('kpiTotalClientes', total);
    setText('kpiClientesVip',   vip);
    setText('kpiNovosMes',      novos);
    setText('kpiRetorno',       retorno + '%');
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ── Segment filter ── */
  if (segFilters) {
    segFilters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      segFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      currentSeg = chip.dataset.seg || 'todos';
      applyFilters();
    });
  }

  /* ── Search ── */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.toLowerCase();
      applyFilters();
    });
  }

  /* ── Firestore: derivar clientes de pedidos ── */
  function initFirestoreClientes() {
    if (!window.Firebase || !window.Firebase.db) {
      console.warn('⚠️ Firebase indisponível');
      if (customerGrid) customerGrid.innerHTML = '<p style="color:var(--a-text-muted);padding:2rem;grid-column:1/-1;">Firebase indisponível.</p>';
      return;
    }

    const fs = window.Firebase.fs;
    const q  = fs.query(fs.collection(window.Firebase.db, 'pedidos'), fs.orderBy('criadoEm', 'desc'));

    fs.onSnapshot(q, snapshot => {
      const map = {};

      snapshot.forEach(doc => {
        const o = doc.data();
        // Exclui pedidos PIX não confirmados — clientes só de pedidos pagos
        if (o.status === 'aguardando_pix') return;
        if (!o.cliente || !o.cliente.telefone) return;
        const tel = o.cliente.telefone.replace(/\D/g, '');
        if (!map[tel]) {
          map[tel] = {
            telefone:     o.cliente.telefone,
            nome:         o.cliente.nome || 'Cliente',
            email:        o.cliente.email || '',
            totalPedidos: 0,
            totalGasto:   0,
            ultimoPedido: null,
          };
        }
        const c = map[tel];
        c.totalPedidos++;
        if (o.status !== 'cancelado') c.totalGasto += (o.total || 0);
        if (!c.ultimoPedido || (o.criadoEm && o.criadoEm.seconds > c.ultimoPedido.seconds)) {
          c.ultimoPedido = o.criadoEm || null;
        }
      });

      allClients = Object.values(map).map(c => {
        c.segmento = getSegmento(c.totalPedidos);
        c.status   = getStatus(c.ultimoPedido);
        return c;
      });

      allClients.sort((a, b) => b.totalGasto - a.totalGasto);

      updateKPIs();
      applyFilters();
      console.log('👥 Clientes derivados:', allClients.length);
    }, err => {
      console.error('Erro ao carregar clientes:', err);
      toast('Erro ao carregar clientes.', 'error');
    });
  }

  /* ── Init com auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, user => {
      if (user) {
        initFirestoreClientes();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }
  initAfterAuth();

})();
