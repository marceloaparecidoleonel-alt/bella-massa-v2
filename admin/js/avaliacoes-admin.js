/**
 * avaliacoes-admin.js — Bella Massa Admin
 * Gerenciar avaliações: listar, aprovar, destacar, excluir.
 */

(function () {
  'use strict';

  var _all = [];

  /* ── Utilitários ── */
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderStars(n) {
    var s = '';
    for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= n ? 'fas' : 'far') + ' fa-star" style="color:#c8a044;font-size:.82rem;"></i>';
    return s;
  }

  function timeAgo(ts) {
    if (!ts || !ts.seconds) return '—';
    var d = new Date(ts.seconds * 1000);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Render tabela ── */
  function renderTable(list) {
    var tbody = document.getElementById('avalTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#888;">Nenhuma avaliação encontrada.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(function (av) {
      var aprovadaLabel = av.aprovada
        ? '<span class="badge badge--success">Aprovada</span>'
        : '<span class="badge badge--muted">Pendente</span>';
      var destaqueLabel = av.destaque
        ? '<span class="badge badge--warning">Destaque</span>'
        : '<span style="color:#aaa;font-size:.8rem;">—</span>';

      return '<tr data-id="' + av.id + '">' +
        '<td><small>' + timeAgo(av.criadoEm) + '</small></td>' +
        '<td><strong>' + escapeHtml(av.nome || '—') + '</strong><br><small style="color:#888;">' + escapeHtml(av.cidade || '') + '</small></td>' +
        '<td>' + renderStars(av.estrelas || 5) + '</td>' +
        '<td style="max-width:240px;"><small>' + escapeHtml(av.comentario || '') + '</small></td>' +
        '<td>' + aprovadaLabel + '</td>' +
        '<td>' + destaqueLabel + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            (!av.aprovada
              ? '<button class="btn-action btn-action--approve" data-id="' + av.id + '" title="Aprovar"><i class="fas fa-check"></i></button>'
              : '<button class="btn-action btn-action--unapprove" data-id="' + av.id + '" title="Reprovar"><i class="fas fa-ban"></i></button>') +
            (!av.destaque
              ? '<button class="btn-action btn-action--highlight" data-id="' + av.id + '" title="Destacar na home"><i class="fas fa-star"></i></button>'
              : '<button class="btn-action btn-action--unhighlight" data-id="' + av.id + '" title="Remover destaque"><i class="far fa-star"></i></button>') +
            '<button class="btn-action btn-action--delete" data-id="' + av.id + '" title="Excluir"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    /* ── Event listeners ── */
    tbody.querySelectorAll('[data-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.id;
        if (btn.classList.contains('btn-action--approve'))     setField(id, { aprovada: true });
        if (btn.classList.contains('btn-action--unapprove'))   setField(id, { aprovada: false, destaque: false });
        if (btn.classList.contains('btn-action--highlight'))   setField(id, { destaque: true, aprovada: true });
        if (btn.classList.contains('btn-action--unhighlight')) setField(id, { destaque: false });
        if (btn.classList.contains('btn-action--delete'))      deleteDoc(id);
      });
    });
  }

  /* ── Firestore ops ── */
  function setField(id, data) {
    if (!window.Firebase || !window.Firebase.db) return;
    var fs = window.Firebase.fs;
    fs.updateDoc(fs.doc(window.Firebase.db, 'avaliacoes', id), data)
      .catch(function (e) { console.error('updateDoc:', e); });
  }

  function deleteDoc(id) {
    if (!confirm('Excluir esta avaliação?')) return;
    if (!window.Firebase || !window.Firebase.db) return;
    var fs = window.Firebase.fs;
    fs.deleteDoc(fs.doc(window.Firebase.db, 'avaliacoes', id))
      .catch(function (e) { console.error('deleteDoc:', e); });
  }

  /* ── Filtros ── */
  function applyFilter(filter) {
    var list;
    if (filter === 'pendente')  list = _all.filter(function (a) { return !a.aprovada; });
    else if (filter === 'destaque') list = _all.filter(function (a) { return a.destaque; });
    else list = _all;
    renderTable(list);
  }

  /* ── KPIs ── */
  function updateKpis() {
    var total    = _all.length;
    var pendente = _all.filter(function (a) { return !a.aprovada; }).length;
    var destaque = _all.filter(function (a) { return a.destaque; }).length;
    var media    = total ? (_all.reduce(function (s, a) { return s + (a.estrelas || 5); }, 0) / total).toFixed(1) : '—';

    var el = function (id) { return document.getElementById(id); };
    if (el('avalTotal'))    el('avalTotal').textContent    = total;
    if (el('avalPendente')) el('avalPendente').textContent = pendente;
    if (el('avalDestaque')) el('avalDestaque').textContent = destaque;
    if (el('avalMedia'))    el('avalMedia').textContent    = media;
  }

  /* ── Listener Firestore ── */
  function initListener() {
    if (!window.Firebase || !window.Firebase.db) return;
    var fs = window.Firebase.fs;
    var q  = fs.query(
      fs.collection(window.Firebase.db, 'avaliacoes'),
      fs.orderBy('criadoEm', 'desc')
    );
    fs.onSnapshot(q, function (snapshot) {
      _all = [];
      snapshot.forEach(function (d) { _all.push(Object.assign({ id: d.id }, d.data())); });
      updateKpis();
      var activeFilter = (document.querySelector('.aval-filter.active') || {}).dataset && document.querySelector('.aval-filter.active').dataset.filter || 'todas';
      applyFilter(activeFilter);
    }, function (err) {
      console.warn('Firestore avaliacoes admin:', err);
    });
  }

  /* ── Init ── */
  function init() {
    /* Filtros */
    document.querySelectorAll('.aval-filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.aval-filter').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyFilter(btn.dataset.filter);
      });
    });

    initListener();
  }

  /* ── Init com auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, function (user) {
      if (user) {
        init();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initAfterAuth);
})();
