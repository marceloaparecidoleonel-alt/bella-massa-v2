/* =====================================================================
   Bella Massa Admin — financeiro.js
   KPIs e tabela financeira calculados a partir de pedidos reais do Firestore.
   ===================================================================== */

(function () {
  'use strict';

  /* ── Toast ── */
  function toast(msg, type) {
    type = type || 'info';
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

  /* ── Helpers de data ── */
  function startOfDay(d)   { const r = new Date(d); r.setHours(0,0,0,0);  return r; }
  function startOfWeek(d)  { const r = startOfDay(d); r.setDate(r.getDate() - r.getDay()); return r; }
  function startOfMonth(d) { const r = new Date(d.getFullYear(), d.getMonth(), 1); return r; }
  function startOfPrevMonth(d) {
    const m = d.getMonth() === 0 ? 11 : d.getMonth() - 1;
    const y = d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear();
    return new Date(y, m, 1);
  }
  function endOfPrevMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
  }

  function fmt(val) { return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }

  /* ── Filtra pedidos por período ── */
  function filterByPeriod(orders, period) {
    const now = new Date();
    let start, end;
    switch (period) {
      case 'hoje':
        start = startOfDay(now);
        end   = new Date();
        break;
      case 'semana':
        start = startOfWeek(now);
        end   = new Date();
        break;
      case 'mes':
        start = startOfMonth(now);
        end   = new Date();
        break;
      case 'mes_ant':
        start = startOfPrevMonth(now);
        end   = endOfPrevMonth(now);
        break;
      default:
        return orders;
    }
    return orders.filter(o => {
      if (!o.criadoEm) return false;
      const ts = new Date(o.criadoEm.seconds * 1000);
      // Se houver data de reset, ignora pedidos anteriores
      if (resetDate && ts < resetDate) return false;
      return ts >= start && ts <= end;
    });
  }

  /* ── Calcula KPIs de um conjunto de pedidos ── */
  function calcKPIs(orders) {
    let revenue = 0, deliveryTotal = 0;
    let totalCount = 0, deliveredCount = 0, cancelledCount = 0;
    const payments = { cartao: 0, debito: 0, pix: 0, dinheiro: 0 };

    orders.forEach(o => {
      totalCount++;
      if (o.status === 'cancelado') { cancelledCount++; return; }
      if (o.status === 'entregue') deliveredCount++;
      const total = o.total || 0;
      revenue += total;
      deliveryTotal += o.taxaEntrega || 0;
      const pg = o.pagamento || 'cartao';
      if (payments[pg] !== undefined) payments[pg] += total;
      else payments['cartao'] += total;
    });

    const ticket = deliveredCount > 0 ? revenue / deliveredCount : 0;
    return { revenue, deliveryTotal, totalCount, deliveredCount, cancelledCount, ticket, payments };
  }

  /* ── Atualiza KPI cards ── */
  function updateKPIs(orders, period) {
    const kpis = calcKPIs(orders);

    setText('finRevenue',  fmt(kpis.revenue));
    setText('finOrders',   kpis.totalCount);
    setText('finTicket',   fmt(kpis.ticket));
    setText('finDelivery', fmt(kpis.deliveryTotal));

    const subEl = document.getElementById('finOrdersSub');
    if (subEl) subEl.textContent = kpis.deliveredCount + ' entregues · ' + kpis.cancelledCount + ' cancelados';

    updatePaymentBars(kpis.payments, kpis.revenue);
  }

  /* ── Barras de métodos de pagamento ── */
  function updatePaymentBars(payments, total) {
    const methods = [
      { id: 'payCartao',   key: 'cartao',   label: 'Cartão de Crédito', color: '#2d7bbf' },
      { id: 'payPix',      key: 'pix',      label: 'Pix',               color: 'var(--a-gold)' },
      { id: 'payDinheiro', key: 'dinheiro', label: 'Dinheiro',          color: '#3d9e5f' },
      { id: 'payDebito',   key: 'debito',   label: 'Débito',            color: '#c87a1a' },
    ];

    methods.forEach(m => {
      const val = payments[m.key] || 0;
      const pct = total > 0 ? Math.round((val / total) * 100) : 0;
      const fillEl = document.getElementById(m.id + 'Fill');
      const pctEl  = document.getElementById(m.id + 'Pct');
      const valEl  = document.getElementById(m.id + 'Val');
      if (fillEl) fillEl.style.width = pct + '%';
      if (pctEl)  pctEl.textContent  = pct + '%';
      if (valEl)  valEl.textContent  = fmt(val);
    });
  }

  /* ── Tabela de resumo por dia (últimos 7 dias) ── */
  function buildDailyTable(allOrders) {
    const tbody = document.getElementById('dailySummaryBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const hoje = startOfDay(new Date());
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

    let grandRevenue = 0, grandPedidos = 0, grandEntregues = 0, grandCancelados = 0, grandDelivery = 0;

    for (let i = 6; i >= 0; i--) {
      const dia  = new Date(hoje.getTime() - i * 24 * 60 * 60 * 1000);
      const prox = new Date(dia.getTime() + 24 * 60 * 60 * 1000);
      const ordens = allOrders.filter(o => {
        if (!o.criadoEm) return false;
        const ts = new Date(o.criadoEm.seconds * 1000);
        return ts >= dia && ts < prox;
      });
      const k = calcKPIs(ordens);

      grandRevenue    += k.revenue;
      grandPedidos    += k.totalCount;
      grandEntregues  += k.deliveredCount;
      grandCancelados += k.cancelledCount;
      grandDelivery   += k.deliveryTotal;

      const isHoje = i === 0;
      const label  = isHoje ? '<strong>Hoje</strong>' : dias[dia.getDay()] + ' ' + dia.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + label + '</td>' +
        '<td>' + k.totalCount + '</td>' +
        '<td>' + k.deliveredCount + '</td>' +
        '<td>' + k.cancelledCount + '</td>' +
        '<td>' + fmt(k.deliveryTotal) + '</td>' +
        '<td>' + fmt(k.ticket) + '</td>' +
        '<td><strong' + (isHoje ? ' style="color:var(--a-brown-dark)"' : '') + '>' + fmt(k.revenue) + '</strong></td>';
      tbody.appendChild(tr);
    }

    const tfoot = document.getElementById('dailySummaryFoot');
    if (tfoot) {
      tfoot.innerHTML =
        '<td><strong>Total 7 dias</strong></td>' +
        '<td>' + grandPedidos + '</td>' +
        '<td>' + grandEntregues + '</td>' +
        '<td>' + grandCancelados + '</td>' +
        '<td>' + fmt(grandDelivery) + '</td>' +
        '<td>' + fmt(grandPedidos > 0 ? grandRevenue / grandPedidos : 0) + '</td>' +
        '<td><strong style="color:var(--a-gold);font-family:var(--a-ff-heading);">' + fmt(grandRevenue) + '</strong></td>';
    }
  }

  /* ── Listener de período ── */
  let allOrders = [];
  let currentPeriod = 'hoje';
  let resetDate = null; // Data de reset financeiro

  function refreshView() {
    const filtered = filterByPeriod(allOrders, currentPeriod);
    updateKPIs(filtered, currentPeriod);
  }

  const periodFilters = document.getElementById('periodFilters');
  if (periodFilters) {
    periodFilters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      periodFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      currentPeriod = chip.dataset.period || 'hoje';
      refreshView();
    });
  }

  /* ── Firestore listener ── */
  function initFirestoreFinanceiro() {
    if (!window.Firebase || !window.Firebase.db) {
      console.warn('⚠️ Firebase indisponível');
      return;
    }
    const fs = window.Firebase.fs;

    // Carregar data de reset do Firestore
    fs.getDoc(fs.doc(window.Firebase.db, 'config', 'financeiro')).then(snap => {
      if (snap.exists() && snap.data().resetDate) {
        resetDate = new Date(snap.data().resetDate);
        console.log('📅 Data de reset financeiro:', resetDate);
      }
    }).catch(() => {});

    const q  = fs.query(fs.collection(window.Firebase.db, 'pedidos'), fs.orderBy('criadoEm', 'desc'));

    fs.onSnapshot(q, snapshot => {
      allOrders = snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
      refreshView();
      buildDailyTable(allOrders);
      console.log('💰 Financeiro atualizado com', allOrders.length, 'pedidos');
    }, err => {
      console.error('Erro ao carregar dados financeiros:', err);
      toast('Erro ao carregar dados financeiros.', 'error');
    });
  }

  /* ── Zerar dados financeiros ── */
  function resetFinanceiro() {
    if (!confirm('Tem certeza que deseja zerar os dados financeiros? Isso não afetará os pedidos, apenas os cálculos de lucro a partir de agora.')) return;
    
    if (!window.Firebase || !window.Firebase.db) {
      toast('Firebase indisponível.', 'error');
      return;
    }

    const fs = window.Firebase.fs;
    resetDate = new Date();
    
    fs.setDoc(fs.doc(window.Firebase.db, 'config', 'financeiro'), {
      resetDate: resetDate.toISOString(),
      atualizadoEm: fs.serverTimestamp()
    }, { merge: true }).then(() => {
      toast('Dados financeiros zerados com sucesso!', 'success');
      refreshView();
      buildDailyTable(allOrders);
    }).catch(err => {
      console.error('Erro ao zerar dados financeiros:', err);
      toast('Erro ao zerar dados financeiros.', 'error');
    });
  }

  /* ── Init com auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, user => {
      if (user) {
        initFirestoreFinanceiro();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }

  // Event listener para botão de reset
  const resetBtn = document.getElementById('resetFinanceiroBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFinanceiro);
  }

  initAfterAuth();

})();
