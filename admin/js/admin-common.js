/* =====================================================================
   Bella Massa Admin — admin-common.js
   Lógica compartilhada por todas as páginas do painel
   ===================================================================== */

(function () {
  'use strict';

  /* ── Guard de autenticação centralizado ──────────────────────────────
     Oculta o admin-shell imediatamente para evitar flash de conteúdo,
     e só exibe após confirmar sessão válida via Firebase Auth.
     Cobre TODAS as páginas admin (este arquivo é carregado em todas).
  ── */
  (function initAuthGuard() {
    var shell = document.querySelector('.admin-shell');
    /* shell já começa com display:none no HTML — sem flash de conteúdo */

    function waitForFirebase() {
      if (!window.Firebase || !window.Firebase.authApi || !window.Firebase.auth) {
        setTimeout(waitForFirebase, 100);
        return;
      }
      window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, function (user) {
        if (user) {
          if (shell) shell.style.display = '';
        } else {
          window.location.replace('admin-login.html');
        }
      });
    }
    waitForFirebase();
  })();

  /* ── Botão Sair — todas as páginas ── */
  function doLogout() {
    localStorage.removeItem('bm_admin_auth');
    if (window.Firebase && window.Firebase.authApi && window.Firebase.auth) {
      window.Firebase.authApi.signOut(window.Firebase.auth)
        .then(function () { window.location.href = 'admin-login.html'; })
        .catch(function () { window.location.href = 'admin-login.html'; });
    } else {
      window.location.href = 'admin-login.html';
    }
  }

  function initLogout() {
    document.querySelectorAll('.sidebar__logout').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        doLogout();
      });
    });
  }

  /* ── Badge de pedidos na sidebar — atualiza em todas as páginas ── */
  function initSidebarBadge() {
    /* pedidos.html usa id="pendingCount"; demais páginas usam id="sidebarBadge" */
    var badge = document.getElementById('sidebarBadge') || document.getElementById('pendingCount');
    if (!badge) return;
    /* pedidos.js já cuida do pendingCount — não duplicar listener nessa página */
    if (badge.id === 'pendingCount') return;

    function updateBadge(orders) {
      var novoCount = 0;
      orders.forEach(function (o) {
        if (o.status === 'novo') novoCount++;
      });
      badge.textContent = novoCount;
      badge.style.display = novoCount > 0 ? 'inline-block' : 'none';
    }

    function startListener() {
      if (!window.Firebase || !window.Firebase.db) return;
      var fs = window.Firebase.fs;
      var q = fs.query(fs.collection(window.Firebase.db, 'pedidos'), fs.orderBy('criadoEm', 'desc'));
      fs.onSnapshot(q, function (snapshot) {
        var orders = [];
        snapshot.forEach(function (doc) { orders.push(Object.assign({ id: doc.id }, doc.data())); });
        updateBadge(orders);
      }, function (err) {
        console.error('Erro ao carregar pedidos para badge:', err);
      });
    }

    if (window.Firebase && window.Firebase.db) {
      startListener();
    } else {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (window.Firebase && window.Firebase.db) {
          clearInterval(interval);
          startListener();
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 200);
    }
  }

  /* ── Preenche perfil do topbar com dados reais do Auth ── */
  function initAdminProfile() {
    function applyUser(user) {
      if (!user) return;

      var email = user.email || '';
      /* Deriva nome: parte antes do @ sem números, capitalizada */
      var rawName = email.split('@')[0].replace(/[0-9_.\-]/g, ' ').trim();
      var displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      var initial = displayName.charAt(0).toUpperCase();

      /* Substitui em todos os topbars da página */
      document.querySelectorAll('.topbar__profile').forEach(function (profile) {
        /* Avatar: troca div vazia por div com inicial */
        var avatarDiv = profile.querySelector('.topbar__avatar');
        if (avatarDiv) {
          avatarDiv.style.cssText = 'width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c8a044,#8b6820);display:grid;place-items:center;flex-shrink:0;font-weight:700;font-size:1rem;color:#fff;';
          avatarDiv.textContent = initial;
        }

        /* Nome e cargo */
        var nameEl = profile.querySelector('strong');
        if (nameEl) nameEl.textContent = displayName;

        /* Mostra o perfil (remove opacity:0) */
        profile.style.opacity = '1';
        profile.style.transition = 'opacity 0.3s ease';
      });
    }

    function tryAuth() {
      if (!window.Firebase || !window.Firebase.authApi || !window.Firebase.auth) {
        setTimeout(tryAuth, 200);
        return;
      }
      window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, applyUser);
    }
    tryAuth();
  }

  /* ── Nome da empresa na sidebar ── */
  function initSidebarStoreName() {
    function applyName() {
      if (!window.Firebase || !window.Firebase.db) {
        setTimeout(applyName, 200);
        return;
      }
      var fs = window.Firebase.fs;
      var db = window.Firebase.db;
      fs.getDoc(fs.doc(db, 'config', 'empresa'))
        .then(function (snap) {
          if (!snap.exists()) return;
          var nome = snap.data().nome;
          if (!nome) return;
          var el = document.querySelector('.sidebar__logo-name');
          if (el) el.textContent = nome;
          document.title = document.title.replace(/Bella Massa/g, nome);
        })
        .catch(function () {});
    }
    applyName();
  }

  /* ── Inicialização ── */
  function init() {
    initLogout();
    initSidebarBadge();
    initAdminProfile();
    initSidebarStoreName();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
