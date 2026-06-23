/* =====================================================================
   Bella Massa Admin — pedidos.js
   Integração com Firestore para pedidos em tempo real
   ===================================================================== */

(function () {
  'use strict';

  /* ── Toast ── */
  function toast(msg, type) {
    type = type || 'success';
    var stack = document.getElementById('toastStack');
    if (!stack) return;
    var t = document.createElement('div');
    t.className = 'toast toast--' + type;
    var icons = { success: 'circle-check', error: 'circle-xmark', warning: 'triangle-exclamation', info: 'circle-info' };
    t.innerHTML = '<i class="fas fa-' + (icons[type] || 'circle-info') + '"></i><span>' + msg + '</span>';
    stack.prepend(t);
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    setTimeout(function () { t.classList.remove('is-visible'); setTimeout(function () { t.remove(); }, 400); }, 3500);
  }

  /* ── Sidebar ── */
  var burgerBtn = document.getElementById('burgerBtn');
  var sidebar   = document.getElementById('sidebar');
  var backdrop  = document.getElementById('sidebarBackdrop');
  if (burgerBtn) burgerBtn.addEventListener('click', function () { sidebar.classList.toggle('is-open'); backdrop.classList.toggle('is-visible'); });
  if (backdrop)  backdrop.addEventListener('click', function () { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); });

  /* ── Status config (espelha steps do cliente) ── */
  // Delivery: Recebido → Em Produção → Pronto → Saiu p/ Entrega → Entregue
  // Pickup:   Recebido → Em Produção → Pronto p/ Retirada (pula entrega)
  var STATUS_CYCLE = ['pendente', 'producao', 'pronto', 'entrega', 'entregue'];

  var STATUS_META = {
    pendente:    { label: 'Pedido Recebido', badgeClass: 'badge--info',    next: 'Em Produção' },
    pago:        { label: 'Pedido Recebido', badgeClass: 'badge--info',    next: 'Em Produção' },
    novo:        { label: 'Pedido Recebido', badgeClass: 'badge--info',    next: 'Em Produção' },
    producao:    { label: 'Em Produção',     badgeClass: 'badge--warning', next: 'Pronto' },
    pronto:      { label: 'Pronto',          badgeClass: 'badge--success', next: 'Saiu p/ Entrega' },
    entrega:     { label: 'Em Entrega',      badgeClass: 'badge--info',    next: 'Entregue' },
    entregue:    { label: 'Entregue',        badgeClass: 'badge--success', next: null },
    cancelado:   { label: 'Cancelado',       badgeClass: 'badge--danger',  next: null },
    reembolsado: { label: 'Reembolsado',     badgeClass: 'badge--muted',   next: null }
  };

  var ALL_BADGE = ['badge--info', 'badge--warning', 'badge--success', 'badge--danger', 'badge--muted'];

  function updateBadge(row, status) {
    var badge = row.querySelector('.badge');
    if (!badge) return;
    ALL_BADGE.forEach(function (c) { badge.classList.remove(c); });
    var meta = STATUS_META[status];
    if (meta) { badge.classList.add(meta.badgeClass); badge.textContent = meta.label; }
  }

  function getNextStatus(status, isPickup) {
    var cycle = STATUS_CYCLE.slice();
    // Retirada: pula 'entrega', vai de pronto direto para entregue
    if (isPickup) cycle = cycle.filter(function(s) { return s !== 'entrega'; });
    // pendente/pago/novo → todos equivalem a 'pendente' no ciclo
    var normalized = (status === 'pago' || status === 'novo') ? 'pendente' : status;
    var idx = cycle.indexOf(normalized);
    if (idx === -1 || idx === cycle.length - 1) return null;
    return cycle[idx + 1];
  }

  function rebuildActions(row, status) {
    var cell = row.querySelector('.cell-actions');
    if (!cell) return;
    var canCancel = status !== 'entregue' && status !== 'cancelado';
    var isPickup  = row.dataset.tipo === 'pickup';
    var nextSt    = getNextStatus(status, isPickup);
    var meta      = STATUS_META[status] || {};
    cell.innerHTML = '';

    var eye = document.createElement('button');
    eye.className = 'abtn abtn--sm abtn--secondary detail-btn';
    eye.title = 'Ver detalhes';
    eye.innerHTML = '<i class="fas fa-eye"></i>';
    cell.appendChild(eye);

    if (nextSt) {
      var nextLabel = isPickup && nextSt === 'entregue' && status === 'pronto'
        ? 'Pronto p/ Retirada'
        : (STATUS_META[nextSt] || {}).label;
      var advBtn = document.createElement('button');
      advBtn.className = 'abtn abtn--sm abtn--primary advance-btn';
      advBtn.title = 'Avançar para: ' + nextLabel;
      advBtn.innerHTML = '<i class="fas fa-arrow-right"></i> ' + nextLabel;
      advBtn.style.cssText = 'font-size:.75rem;gap:.3em;padding:.35em .7em;';
      cell.appendChild(advBtn);
    }

    if (canCancel) {
      var xBtn = document.createElement('button');
      xBtn.className = 'abtn abtn--sm cancel-btn';
      xBtn.title = 'Cancelar pedido';
      xBtn.style.cssText = 'color:var(--a-danger);background:var(--a-danger-bg);border:none;';
      xBtn.innerHTML = '<i class="fas fa-xmark"></i>';
      cell.appendChild(xBtn);
    }

    var delBtn = document.createElement('button');
    delBtn.className = 'abtn abtn--sm delete-btn';
    delBtn.title = 'Excluir pedido permanentemente';
    delBtn.style.cssText = 'color:#fff;background:#e74c3c;border:none;';
    delBtn.innerHTML = '<i class="fas fa-trash"></i>';
    cell.appendChild(delBtn);
  }

  /* ── Render order row ── */
  function renderOrderRow(order) {
    var tr = document.createElement('tr');
    tr.dataset.orderId = order.id;
    tr.dataset.status  = order.status || 'novo';
    tr.dataset.tipo    = (order.tipo === 'pickup' || !order.endereco || !order.endereco.rua) ? 'pickup' : 'delivery';

    var statusMeta = STATUS_META[order.status] || STATUS_META.novo;
    var paymentIcon = {
      'cartao': 'fa-credit-card',
      'debito': 'fa-credit-card',
      'pix': 'fa-pix',
      'dinheiro': 'fa-money-bill-wave'
    }[order.pagamento] || 'fa-credit-card';

    var paymentLabel = {
      'cartao': 'Cartão',
      'debito': 'Débito',
      'pix': 'Pix',
      'dinheiro': 'Dinheiro'
    }[order.pagamento] || order.pagamento;

    var addressText = order.endereco
      ? (order.endereco.rua || '') + (order.endereco.bairro ? ' — ' + order.endereco.bairro : '')
      : 'Retirada na loja';

    var itemsText = (order.itens || []).map(function (i) {
      return (i.qty || i.quantidade || 1) + 'x ' + (i.nome || i.name || '—');
    }).join(', ');

    var timeStr = order.criadoEm && order.criadoEm.seconds
      ? new Date(order.criadoEm.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '—';

    var clienteNome = (order.cliente && order.cliente.nome) ? order.cliente.nome
      : (order.nomeCliente || order.cliente || '—');
    var clienteTel  = (order.cliente && order.cliente.telefone) ? order.cliente.telefone
      : (order.telefone || order.celular || '—');

    tr.innerHTML =
      '<td><strong class="order-num">#' + (order.numero || order.id.slice(-4)) + '</strong></td>' +
      '<td>' +
        '<div class="cell-user">' +
          '<div class="cell-user__info">' +
            '<strong>' + clienteNome + '</strong>' +
            '<small><i class="fas fa-phone"></i> ' + clienteTel + '</small>' +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td><small>' + addressText + '</small></td>' +
      '<td><small>' + itemsText + '</small></td>' +
      '<td><span class="payment-tag"><i class="fas ' + paymentIcon + '"></i> ' + paymentLabel + '</span></td>' +
      '<td><strong>R$ ' + (order.total || 0).toFixed(2).replace('.', ',') + '</strong></td>' +
      '<td><small>' + timeStr + '</small></td>' +
      '<td><span class="badge ' + statusMeta.badgeClass + '">' + statusMeta.label + '</span></td>' +
      '<td class="cell-actions"></td>';

    rebuildActions(tr, order.status);
    if (order.status === 'entregue') tr.style.opacity = '0.7';
    if (order.status === 'cancelado') tr.style.opacity = '0.5';

    return tr;
  }

  /* ── Delegated click handler ── */
  document.addEventListener('click', function (e) {

    /* Advance */
    var advBtn = e.target.closest('.advance-btn');
    if (advBtn) {
      var row      = advBtn.closest('tr');
      if (!row) return;
      var orderId  = row.dataset.orderId;
      var cur      = row.dataset.status;
      var isPickup = row.dataset.tipo === 'pickup';
      var next     = getNextStatus(cur, isPickup);
      if (!next) return;

      // Update Firestore
      if (window.Firebase && window.Firebase.db) {
        var fs = window.Firebase.fs;
        fs.updateDoc(
          fs.doc(window.Firebase.db, 'pedidos', orderId),
          { status: next, atualizadoEm: fs.serverTimestamp() }
        ).then(function () {
          toast('Pedido avançado para: ' + (STATUS_META[next] || {}).label, 'success');
        }).catch(function (err) {
          console.error('Erro ao atualizar pedido:', err);
          toast('Erro ao atualizar pedido.', 'error');
        });
      } else {
        row.dataset.status = next;
        updateBadge(row, next);
        rebuildActions(row, next);
        if (next === 'entregue') row.style.opacity = '0.7';
        toast('Pedido avançado para: ' + (STATUS_META[next] || {}).label, 'success');
        updatePendingCount();
      }
      return;
    }

    /* Cancel */
    var cancelBtn = e.target.closest('.cancel-btn');
    if (cancelBtn) {
      var row = cancelBtn.closest('tr');
      if (!row) return;
      openCancelModal(row.dataset.orderId);
      return;
    }

    /* Delete */
    var delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
      var row = delBtn.closest('tr');
      if (!row) return;
      var orderId = row.dataset.orderId;
      if (!confirm('Excluir este pedido permanentemente? Esta ação não pode ser desfeita.')) return;
      if (window.Firebase && window.Firebase.db) {
        var fs = window.Firebase.fs;
        fs.deleteDoc(fs.doc(window.Firebase.db, 'pedidos', orderId))
          .then(function () { toast('Pedido excluído.', 'success'); })
          .catch(function (err) { console.error('Erro ao excluir pedido:', err); toast('Erro ao excluir pedido.', 'error'); });
      }
      return;
    }

    /* Detail */
    var detailBtn = e.target.closest('.detail-btn');
    if (detailBtn) {
      openDetailModal(detailBtn.closest('tr'));
    }
  });

  /* ── Detail modal ── */
  var detailModal = document.getElementById('orderDetailModal');

  function openDetailModal(row) {
    if (!detailModal || !row) return;
    var orderId = row.dataset.orderId;
    var orderData = row._orderData; // Dados completos do pedido

    var dNome = (orderData.cliente && orderData.cliente.nome) ? orderData.cliente.nome
      : (orderData.nomeCliente || orderData.cliente || '—');
    var dTel  = (orderData.cliente && orderData.cliente.telefone) ? orderData.cliente.telefone
      : (orderData.telefone || orderData.celular || '—');

    document.getElementById('modalOrderNum').textContent  = 'Pedido #' + (orderData.numero || orderId.slice(-4));
    document.getElementById('detailClient').textContent   = dNome;
    document.getElementById('detailPhone').textContent    = dTel;
    document.getElementById('detailAddress').textContent  = orderData.endereco
      ? (orderData.endereco.rua || '') + (orderData.endereco.bairro ? ', ' + orderData.endereco.bairro : '') + (orderData.endereco.cidade ? ' — ' + orderData.endereco.cidade : '')
      : 'Retirada na loja';
    document.getElementById('detailItems').textContent    = (orderData.itens || []).map(function (i) { return (i.qty || i.quantidade || 1) + 'x ' + (i.nome || i.name || '—'); }).join(', ');
    document.getElementById('detailObs').textContent      = orderData.obs || '—';
    document.getElementById('detailPaymentStatus').textContent = orderData.paymentStatus || '—';
    document.getElementById('detailPayment').textContent  = orderData.pagamento || '—';
    var trocoSec = document.getElementById('detailTrocoSection');
    var trocoVal = document.getElementById('detailTroco');
    if (trocoSec && trocoVal) {
      var hasTroco = orderData.pagamento === 'dinheiro' && orderData.troco && String(orderData.troco).trim() !== '';
      trocoSec.style.display = hasTroco ? '' : 'none';
      trocoVal.textContent   = hasTroco ? 'R$ ' + parseFloat(orderData.troco).toFixed(2).replace('.', ',') : '—';
    }
    document.getElementById('detailValue').textContent    = 'R$ ' + (orderData.total || 0).toFixed(2).replace('.', ',');
    document.getElementById('detailTime').textContent     = orderData.criadoEm
      ? new Date(orderData.criadoEm.seconds * 1000).toLocaleString('pt-BR')
      : '—';
    document.getElementById('detailStatus').textContent   = (STATUS_META[orderData.status] || {}).label || orderData.status || '—';

    var rawPhone = dTel.replace(/\D/g, '');
    var waMsg  = encodeURIComponent('Olá ' + dNome.split(' ')[0] + '! Passando para informar sobre o seu pedido #' + (orderData.numero || orderId.slice(-4)) + ' da Bella Massa.');
    var waLink = document.getElementById('detailWhatsApp');
    if (waLink) waLink.href = 'https://wa.me/55' + rawPhone + '?text=' + waMsg;

    detailModal.classList.add('is-open');
  }

  function closeDetailModal() {
    if (detailModal) detailModal.classList.remove('is-open');
  }

  var c1 = document.getElementById('closeDetailModal');
  var c2 = document.getElementById('closeDetailModal2');
  if (c1) c1.addEventListener('click', closeDetailModal);
  if (c2) c2.addEventListener('click', closeDetailModal);
  if (detailModal) detailModal.addEventListener('click', function (e) { if (e.target === detailModal) closeDetailModal(); });

  /* ── Chip filter ── */
  var filterContainer = document.getElementById('statusFilters');
  var tbody = document.getElementById('ordersBody');
  var currentFilter = 'todos';

  if (filterContainer && tbody) {
    filterContainer.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      filterContainer.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('chip--active'); });
      chip.classList.add('chip--active');
      currentFilter = chip.dataset.filter;
      applyFilter();
    });
  }

  function applyFilter() {
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(function (row) {
      row.style.display = (currentFilter === 'todos' || row.dataset.status === currentFilter) ? '' : 'none';
    });
  }

  /* ── Search ── */
  var searchInput = document.getElementById('searchInput');
  if (searchInput && tbody) {
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.toLowerCase();
      tbody.querySelectorAll('tr').forEach(function (row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ── Pending count + chip counts ── */
  function updateChipCounts(orders) {
    // Conta por status
    var counts = { pendente: 0, pago: 0, novo: 0, producao: 0, pronto: 0, entrega: 0, entregue: 0, cancelado: 0 };
    orders.forEach(function (o) {
      var s = o.status || 'novo';
      if (counts[s] !== undefined) counts[s]++;
    });
    var total = orders.length;

    // Pedidos de hoje
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var hoje_ms = hoje.getTime();
    var hoje_count = orders.filter(function (o) {
      return o.criadoEm && (new Date(o.criadoEm.seconds * 1000).getTime() >= hoje_ms);
    }).length;

    // Atualiza contadores nos chips
    var map = {
      'todos':     total,
      'pendente':  counts.pendente,
      'pago':      counts.pago,
      'novo':      counts.novo,
      'producao':  counts.producao,
      'pronto':    counts.pronto,
      'entrega':   counts.entrega,
      'entregue':  counts.entregue,
      'cancelado': counts.cancelado
    };

    var filterEl = document.getElementById('statusFilters');
    if (filterEl) {
      filterEl.querySelectorAll('[data-filter]').forEach(function (chip) {
        var key = chip.dataset.filter;
        var countEl = chip.querySelector('.chip-count');
        if (countEl && map[key] !== undefined) countEl.textContent = map[key];
      });
    }

    // Badge sidebar (pedidos novos)
    var elBadge = document.getElementById('pendingCount');
    if (elBadge) {
      elBadge.textContent = counts.novo;
      elBadge.style.display = counts.novo > 0 ? 'inline-block' : 'none';
    }

    // Subtítulo "X pedidos hoje"
    var todayEl = document.getElementById('todayOrderCount');
    if (todayEl) todayEl.textContent = hoje_count || total;
  }

  /* ── Limpar pedidos finalizados em lote ── */
  var btnClearDone = document.getElementById('btnClearDone');
  if (btnClearDone) {
    btnClearDone.addEventListener('click', function () {
      if (!window.Firebase || !window.Firebase.db) return;
      var rows = tbody ? tbody.querySelectorAll('tr[data-status="entregue"], tr[data-status="cancelado"]') : [];
      if (!rows.length) { toast('Nenhum pedido entregue ou cancelado para limpar.', 'info'); return; }
      if (!confirm('Excluir permanentemente todos os pedidos entregues e cancelados (' + rows.length + ')? Esta ação não pode ser desfeita.')) return;
      var fs = window.Firebase.fs;
      var promises = [];
      rows.forEach(function (row) {
        promises.push(fs.deleteDoc(fs.doc(window.Firebase.db, 'pedidos', row.dataset.orderId)));
      });
      Promise.all(promises)
        .then(function () { toast(rows.length + ' pedidos excluídos.', 'success'); })
        .catch(function (err) { console.error('Erro ao limpar pedidos:', err); toast('Erro ao excluir alguns pedidos.', 'error'); });
    });
  }

  /* ── Firestore listener ── */
  function initFirestoreListener() {
    if (!window.Firebase || !window.Firebase.db) {
      console.warn('⚠️ Firebase não disponível — usando dados estáticos');
      // Zera contagens hardcoded
      updateChipCounts([]);
      return;
    }

    var fs = window.Firebase.fs;
    var q = fs.query(fs.collection(window.Firebase.db, 'pedidos'), fs.orderBy('criadoEm', 'desc'));
    fs.onSnapshot(q, function (snapshot) {
        tbody.innerHTML = '';
        var orders = [];
        snapshot.forEach(function (doc) {
          var data = doc.data();
          // Ocultar pedidos PIX aguardando confirmação de pagamento
          if (data.status === 'aguardando_pix') return;
          orders.push(Object.assign({ id: doc.id }, data));
        });

        orders.forEach(function (order) {
          var row = renderOrderRow(order);
          row._orderData = order;
          tbody.appendChild(row);
        });

        applyFilter();
        updateChipCounts(orders);
        console.log('📋 Pedidos carregados:', orders.length);
      }, function (err) {
        console.error('❌ Erro ao carregar pedidos:', err);
        toast('Erro ao carregar pedidos.', 'error');
      });
  }

  /* ── Inicializar com Auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) {
      setTimeout(initAfterAuth, 200);
      return;
    }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, function (user) {
      if (user) {
        initFirestoreListener();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }
  initAfterAuth();

  /* ── Modal de Cancelamento com Motivo ── */
  var cancelModal     = document.getElementById('cancelReasonModal');
  var cancelInput     = document.getElementById('cancelReasonInput');
  var cancelErr       = document.getElementById('cancelReasonErr');
  var cancelConfirm   = document.getElementById('cancelReasonConfirm');
  var cancelAbort     = document.getElementById('cancelReasonAbort');
  var closeCancelBtn  = document.getElementById('closeCancelModal');
  var _pendingCancelId = null;

  function openCancelModal(orderId) {
    _pendingCancelId = orderId;
    if (cancelInput)  cancelInput.value = '';
    if (cancelErr)    cancelErr.style.display = 'none';
    if (cancelModal)  cancelModal.classList.add('is-open');
  }

  function closeCancelModal() {
    if (cancelModal) cancelModal.classList.remove('is-open');
    _pendingCancelId = null;
  }

  if (closeCancelBtn)  closeCancelBtn.addEventListener('click', closeCancelModal);
  if (cancelAbort)     cancelAbort.addEventListener('click', closeCancelModal);
  if (cancelModal)     cancelModal.addEventListener('click', function(e) { if (e.target === cancelModal) closeCancelModal(); });

  if (cancelConfirm) {
    cancelConfirm.addEventListener('click', function () {
      var motivo = cancelInput ? cancelInput.value.trim() : '';
      if (!motivo) {
        if (cancelErr) cancelErr.style.display = 'block';
        return;
      }
      if (cancelErr) cancelErr.style.display = 'none';
      if (!_pendingCancelId) return;

      var orderId = _pendingCancelId;
      closeCancelModal();

      if (window.Firebase && window.Firebase.db) {
        var fs = window.Firebase.fs;
        fs.updateDoc(
          fs.doc(window.Firebase.db, 'pedidos', orderId),
          { status: 'cancelado', motivoCancelamento: motivo, atualizadoEm: fs.serverTimestamp() }
        ).then(function () {
          toast('Pedido cancelado.', 'warning');
        }).catch(function (err) {
          console.error('Erro ao cancelar pedido:', err);
          toast('Erro ao cancelar pedido.', 'error');
        });
      }
    });
  }

})();
