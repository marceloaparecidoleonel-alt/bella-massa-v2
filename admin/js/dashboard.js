/* =====================================================================
   Bella Massa Admin — dashboard.js
   Todos os dados vêm do Firestore. Zero dados hardcoded.
   ===================================================================== */

(function () {
  'use strict';

  /* ── Sidebar mobile ── */
  var burgerBtn = document.getElementById('burgerBtn');
  var sidebar   = document.getElementById('sidebar');
  var backdrop  = document.getElementById('sidebarBackdrop');
  if (burgerBtn) burgerBtn.addEventListener('click', function () { sidebar.classList.toggle('is-open'); backdrop.classList.toggle('is-visible'); });
  if (backdrop)  backdrop.addEventListener('click', function () { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); });

  /* ── Data ── */
  var now   = new Date();
  var dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var el = document.getElementById('topbarDate');
  if (el) el.textContent = now.toLocaleDateString('pt-BR');
  var el2 = document.getElementById('headerDate');
  if (el2) el2.textContent = dias[now.getDay()] + ', ' + now.getDate() + ' de ' + meses[now.getMonth()] + ' de ' + now.getFullYear();

  /* ── Formatação ── */
  function fmtBRL(v) {
    return 'R$\u00a0' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function fmtNum(v) {
    return String(Math.round(v));
  }

  /* ── Animação de contador ── */
  function animCount(el, target, isCurrency) {
    if (!el) return;
    var start = 0, dur = 900, t0 = null;
    function tick(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      var v = start + (target - start) * e;
      el.textContent = isCurrency ? fmtBRL(v) : fmtNum(v);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── Animação barras ── */
  function animBars(chartId) {
    document.querySelectorAll('#' + chartId + ' .cbar__fill').forEach(function (fill, i) {
      fill.style.height = '0%';
      setTimeout(function () {
        var h = getComputedStyle(fill.closest('.cbar')).getPropertyValue('--h').trim() || '0%';
        fill.style.transition = 'height 540ms cubic-bezier(0.34,1.1,0.64,1)';
        fill.style.height = h;
      }, 60 + i * 55);
    });
  }

  /* ── Gerar últimos N dias ── */
  function lastNDays(n) {
    var days = [];
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
      days.push(d);
    }
    return days;
  }

  var SHORT_DAY = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  /* ── Renderizar gráfico de faturamento ── */
  function renderRevenueChart(orders) {
    var chart = document.getElementById('revenueChart');
    if (!chart) return;
    var days = lastNDays(7);
    var totals = days.map(function (d) {
      var ms = d.getTime();
      var next = ms + 86400000;
      return orders.filter(function (o) {
        if (o.status === 'cancelado') return false;
        var t = o.criadoEm && o.criadoEm.seconds ? o.criadoEm.seconds * 1000 : null;
        return t && t >= ms && t < next;
      }).reduce(function (s, o) { return s + (o.total || 0); }, 0);
    });
    var max = Math.max.apply(null, totals) || 1;
    var weekTotal = totals.reduce(function (a, b) { return a + b; }, 0);
    var weekEl = document.getElementById('weekRevenue');
    if (weekEl) weekEl.textContent = fmtBRL(weekTotal);

    chart.innerHTML = days.map(function (d, i) {
      var isToday = i === days.length - 1;
      var pct = Math.max(Math.round((totals[i] / max) * 100), totals[i] > 0 ? 6 : 3);
      var tip = totals[i] > 0 ? fmtBRL(totals[i]) : 'R$\u00a00';
      return '<div class="cbar' + (isToday ? ' cbar--active' : '') + '" style="--h:' + pct + '%">' +
        '<div class="cbar__tip">' + tip + '</div>' +
        '<div class="cbar__fill"></div>' +
        '<div class="cbar__lbl">' + (isToday ? 'Hoje' : SHORT_DAY[d.getDay()]) + '</div>' +
        '</div>';
    }).join('');
    animBars('revenueChart');
  }

  /* ── Renderizar gráfico de pedidos ── */
  function renderOrdersChart(orders) {
    var chart = document.getElementById('ordersChart');
    if (!chart) return;
    var days = lastNDays(7);
    var counts = days.map(function (d) {
      var ms = d.getTime(); var next = ms + 86400000;
      return orders.filter(function (o) {
        var t = o.criadoEm && o.criadoEm.seconds ? o.criadoEm.seconds * 1000 : null;
        return t && t >= ms && t < next;
      }).length;
    });
    var max = Math.max.apply(null, counts) || 1;
    var weekTotal = counts.reduce(function (a, b) { return a + b; }, 0);
    var weekEl = document.getElementById('weekOrders');
    if (weekEl) weekEl.textContent = weekTotal;

    chart.innerHTML = days.map(function (d, i) {
      var isToday = i === days.length - 1;
      var pct = Math.max(Math.round((counts[i] / max) * 100), counts[i] > 0 ? 6 : 3);
      return '<div class="cbar' + (isToday ? ' cbar--active' : '') + '" style="--h:' + pct + '%">' +
        '<div class="cbar__tip">' + counts[i] + '</div>' +
        '<div class="cbar__fill cbar__fill--orders"></div>' +
        '<div class="cbar__lbl">' + (isToday ? 'Hoje' : SHORT_DAY[d.getDay()]) + '</div>' +
        '</div>';
    }).join('');
    animBars('ordersChart');
  }

  /* ── Renderizar pedidos recentes ── */
  var STATUS_BADGE = {
    novo:      ['badge--warning',  'Novo'],
    producao:  ['badge--warning',  'Em Produção'],
    pronto:    ['badge--success',  'Pronto'],
    entrega:   ['badge--info',     'Em Entrega'],
    entregue:  ['badge--success',  'Entregue'],
    cancelado: ['badge--danger',   'Cancelado'],
  };
  var PAYMENT_ICON = { pix: 'fab fa-pix', cartao: 'fas fa-credit-card', dinheiro: 'fas fa-money-bill-wave', debito: 'fas fa-credit-card', credito: 'fas fa-credit-card' };

  function renderRecentOrders(orders) {
    var tbody = document.getElementById('recentOrdersBody');
    if (!tbody) return;
    var recent = orders.slice(0, 8);
    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--a-text-muted);font-size:0.85rem;">Nenhum pedido ainda.</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(function (o) {
      var st = o.status || 'novo';
      var badge = STATUS_BADGE[st] || ['badge--warning', st];
      var payKey = (o.pagamento || '').toLowerCase().replace(/\s/g,'');
      var payIcon = PAYMENT_ICON[payKey] || 'fas fa-wallet';
      var payLabel = o.pagamento || '—';
      var hora = o.criadoEm && o.criadoEm.seconds
        ? new Date(o.criadoEm.seconds * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '—';
      var num = o.numero || o.id.substring(0,6).toUpperCase();
      var nome = o.cliente || o.nomeCliente || 'Cliente';
      var tel  = o.telefone || o.celular || '';
      var end  = o.endereco ? (o.endereco.rua || '') + (o.endereco.bairro ? ' — ' + o.endereco.bairro : '') : (o.enderecoTexto || '—');
      var total = o.total || 0;
      return '<tr>' +
        '<td><strong>#' + num + '</strong></td>' +
        '<td><div class="rt-user">' +
          '<div><div class="rt-user__name">' + nome + '</div><div class="rt-user__phone">' + tel + '</div></div>' +
        '</div></td>' +
        '<td style="font-size:0.8rem;color:var(--a-text-muted)">' + end + '</td>' +
        '<td><span style="font-size:0.78rem;color:var(--a-text-muted);"><i class="' + payIcon + '"></i> ' + payLabel + '</span></td>' +
        '<td style="text-align:right;font-weight:700;">' + fmtBRL(total) + '</td>' +
        '<td style="font-size:0.78rem;color:var(--a-text-soft)">' + hora + '</td>' +
        '<td><span class="badge ' + badge[0] + '">' + badge[1] + '</span></td>' +
        '</tr>';
    }).join('');
  }

  /* ── Renderizar mais vendidos ── */
  var CAT_NAMES = { paes:'Pães', bolos:'Bolos', doces:'Doces', salgados:'Salgados', bebidas:'Bebidas' };

  function renderTopProducts(orders) {
    var list = document.getElementById('topProductsList');
    var catEl = document.getElementById('topCategory');
    var catRevEl = document.getElementById('topCategoryRevenue');
    if (!list) return;

    // Agregar itens de todos os pedidos (não cancelados)
    var map = {};
    orders.forEach(function (o) {
      if (o.status === 'cancelado') return;
      var itens = o.itens || o.items || [];
      itens.forEach(function (item) {
        var key = item.nome || item.name || item.id || 'Produto';
        if (!map[key]) map[key] = { nome: key, categoria: item.categoria || item.category || '', qty: 0, receita: 0 };
        map[key].qty     += (item.quantidade || item.qty || item.quantity || 1);
        map[key].receita += (item.preco || item.price || 0) * (item.quantidade || item.qty || item.quantity || 1);
      });
    });

    var produtos = Object.values(map).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 5);

    if (produtos.length === 0) {
      list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--a-text-muted);font-size:0.85rem;">Sem dados de produtos ainda.</div>';
      if (catEl) catEl.textContent = '—';
      if (catRevEl) catRevEl.textContent = '—';
      return;
    }

    list.innerHTML = produtos.map(function (p, i) {
      var catLabel = CAT_NAMES[p.categoria] || p.categoria || '—';
      return '<div class="rank-row">' +
        '<div class="rank-row__pos">' + (i + 1) + '</div>' +
        '<div class="rank-row__info">' +
          '<div class="rank-row__name">' + p.nome + '</div>' +
          '<div class="rank-row__meta">' + catLabel + ' &middot; ' + p.qty + ' un &middot; ' + fmtBRL(p.receita) + '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    // Categoria líder por receita
    var catMap = {};
    Object.values(map).forEach(function (p) {
      var c = p.categoria || 'outros';
      if (!catMap[c]) catMap[c] = 0;
      catMap[c] += p.receita;
    });
    var topCat = Object.keys(catMap).sort(function (a, b) { return catMap[b] - catMap[a]; })[0] || '—';
    if (catEl)    catEl.textContent    = CAT_NAMES[topCat] || topCat;
    if (catRevEl) catRevEl.textContent = fmtBRL(catMap[topCat] || 0);
  }

  /* ── KPIs principais ── */
  function updateKPIs(orders) {
    var meta = 3200;
    var hoje = new Date(); hoje.setHours(0,0,0,0);
    var hojeMs = hoje.getTime();

    var counts = { novo:0, producao:0, pronto:0, entrega:0, entregue:0, cancelado:0 };
    var receita = 0, pedidosHoje = 0;

    orders.forEach(function (o) {
      var st = o.status || 'novo';
      if (counts[st] !== undefined) counts[st]++;
      var t = o.criadoEm && o.criadoEm.seconds ? o.criadoEm.seconds * 1000 : 0;
      if (t >= hojeMs) pedidosHoje++;
      if (st !== 'cancelado' && t >= hojeMs) receita += (o.total || 0);
    });

    var pendentes = counts.novo + counts.producao + counts.pronto + counts.entrega;
    var entreguesHoje = orders.filter(function(o){ var t=o.criadoEm&&o.criadoEm.seconds?o.criadoEm.seconds*1000:0; return t>=hojeMs && o.status==='entregue'; }).length;
    var ticket = entreguesHoje > 0 ? (orders.filter(function(o){ var t=o.criadoEm&&o.criadoEm.seconds?o.criadoEm.seconds*1000:0; return t>=hojeMs && o.status==='entregue'; }).reduce(function(s,o){ return s+(o.total||0); }, 0) / entreguesHoje) : 0;
    var pct = Math.min(Math.round((receita / meta) * 100), 100);

    animCount(document.getElementById('stNew'),      counts.novo,      false);
    animCount(document.getElementById('stProd'),     counts.producao,  false);
    animCount(document.getElementById('stReady'),    counts.pronto,    false);
    animCount(document.getElementById('stDelivery'), counts.entrega,   false);
    animCount(document.getElementById('stDone'),     counts.entregue,  false);
    animCount(document.getElementById('stCancel'),   counts.cancelado, false);

    animCount(document.getElementById('kpiRevenue'),  receita,       true);
    animCount(document.getElementById('kpiOrders'),   pedidosHoje,   false);
    animCount(document.getElementById('kpiTicket'),   ticket,        true);
    animCount(document.getElementById('kpiDelivery'), counts.pronto + counts.entrega, false);

    var elPct     = document.getElementById('kpiPct');
    var elBar     = document.getElementById('kpiBar');
    var elPending = document.getElementById('kpiPending');
    if (elPct) elPct.textContent = pct + '%';
    if (elBar) elBar.style.width = pct + '%';
    if (elPending) elPending.textContent = pendentes + ' aguardando ação';
  }

  var resetDate = null; // Data de reset da dashboard
  var allOrdersCache = []; // Cache de todos os pedidos para pesquisa

  /* ── Listener Firestore ── */
  function initFirestoreListener() {
    if (!window.Firebase || !window.Firebase.db) {
      console.warn('⚠️ Firebase não disponível');
      updateKPIs([]);
      renderRecentOrders([]);
      renderTopProducts([]);
      renderRevenueChart([]);
      renderOrdersChart([]);
      return;
    }
    var fs = window.Firebase.fs;

    // Carregar data de reset do Firestore primeiro
    fs.getDoc(fs.doc(window.Firebase.db, 'config', 'dashboard')).then(function(snap) {
      if (snap.exists() && snap.data().resetDate) {
        resetDate = new Date(snap.data().resetDate);
        console.log('📅 Data de reset dashboard:', resetDate);
      }
      // Só depois configurar o listener de pedidos
      setupOrdersListener();
    }).catch(function() {
      // Se falhar, configura o listener sem reset
      setupOrdersListener();
    });

    function setupOrdersListener() {
      var q  = fs.query(fs.collection(window.Firebase.db, 'pedidos'), fs.orderBy('criadoEm', 'desc'));
      fs.onSnapshot(q, function (snapshot) {
        var orders = [];
        snapshot.forEach(function (doc) {
          var order = Object.assign({ id: doc.id }, doc.data());
          // Filtra pedidos pix_pendente (ainda não pagos) e anteriores ao reset
          if (order.status !== 'pix_pendente') {
            if (resetDate) {
              var ts = new Date(order.criadoEm.seconds * 1000);
              if (ts >= resetDate) {
                orders.push(order);
              }
            } else {
              orders.push(order);
            }
          }
        });
        allOrdersCache = orders;
        updateKPIs(orders);
        renderRecentOrders(orders);
        renderTopProducts(orders);
        renderRevenueChart(orders);
        renderOrdersChart(orders);
      }, function (err) {
        console.error('Erro ao carregar pedidos:', err);
      });
    }
  }

  /* ── Zerar dados da dashboard ── */
  function resetDashboard() {
    if (!confirm('Tem certeza que deseja zerar os dados da dashboard? Isso não afetará os pedidos, apenas os cálculos a partir de agora.')) return;

    if (!window.Firebase || !window.Firebase.db) {
      showToast('Firebase indisponível.', 'error');
      return;
    }

    var fs = window.Firebase.fs;
    resetDate = new Date();

    fs.setDoc(fs.doc(window.Firebase.db, 'config', 'dashboard'), {
      resetDate: resetDate.toISOString(),
      atualizadoEm: fs.serverTimestamp()
    }, { merge: true }).then(function() {
      showToast('Dados da dashboard zerados com sucesso!', 'success');
      // Recarregar dados
      initFirestoreListener();
    }).catch(function(err) {
      console.error('Erro ao zerar dados da dashboard:', err);
      showToast('Erro ao zerar dados da dashboard.', 'error');
    });
  }

  /* ── Chips range (visual apenas, gráficos já dinâmicos) ── */
  var btn7  = document.getElementById('rangeBtn7');
  var btn30 = document.getElementById('rangeBtn30');
  if (btn7 && btn30) {
    btn7.addEventListener('click',  function () { btn7.classList.add('chip--active');  btn30.classList.remove('chip--active'); });
    btn30.addEventListener('click', function () { btn30.classList.add('chip--active'); btn7.classList.remove('chip--active'); });
  }

  /* ── Toast ── */
  function showToast(msg, type) {
    var stack = document.getElementById('toastStack');
    if (!stack) return;
    var icons = { success:'circle-check', error:'circle-xmark', warning:'triangle-exclamation', info:'circle-info' };
    var t = document.createElement('div');
    t.className = 'toast toast--' + (type || 'info');
    t.innerHTML = '<i class="fas fa-' + (icons[type] || 'circle-info') + '"></i><span>' + msg + '</span>';
    stack.prepend(t);
    requestAnimationFrame(function () { t.classList.add('is-visible'); });
    setTimeout(function () { t.classList.remove('is-visible'); setTimeout(function () { t.remove(); }, 400); }, 3500);
  }
  var notifBtn = document.getElementById('notifBtn');
  if (notifBtn) notifBtn.addEventListener('click', function () { showToast('Verifique a lista de pedidos para detalhes.', 'info'); });

  // Event listener para botão de reset da dashboard
  var resetBtn = document.getElementById('resetDashboardBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetDashboard);
  }

  /* ── Barra de pesquisa ── */
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      var query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderRecentOrders(allOrdersCache);
        return;
      }
      var filtered = allOrdersCache.filter(function(order) {
        // Busca em número do pedido
        if (order.numero && String(order.numero).toLowerCase().includes(query)) return true;
        // Busca em nome do cliente
        if (order.cliente && String(order.cliente).toLowerCase().includes(query)) return true;
        // Busca em telefone
        if (order.telefone && String(order.telefone).toLowerCase().includes(query)) return true;
        // Busca em endereço
        if (order.endereco && String(order.endereco).toLowerCase().includes(query)) return true;
        // Busca em itens (produtos)
        if (order.itens && Array.isArray(order.itens)) {
          for (var i = 0; i < order.itens.length; i++) {
            if (order.itens[i].nome && String(order.itens[i].nome).toLowerCase().includes(query)) return true;
          }
        }
        return false;
      });
      renderRecentOrders(filtered);
    });
  }

  /* ── Init com Auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, function (user) {
      if (user) { initFirestoreListener(); }
      else      { window.location.href = 'admin-login.html'; }
    });
  }
  initAfterAuth();

})();
