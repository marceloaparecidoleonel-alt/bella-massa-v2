/**
 * avaliacoes.js — Bella Massa
 * Avaliações de clientes: envio ao Firestore + renderização na home.
 * Destaques: aparecem direto na seção. "Ver todos": modal com lista completa.
 */

(function () {
  'use strict';

  /* ── Renderiza estrelas ── */
  function renderStars(rating, interactive) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
      if (interactive) {
        html += '<i class="' + (i <= rating ? 'fas' : 'far') + ' fa-star review-star" data-val="' + i + '" style="cursor:pointer;font-size:1.4rem;color:#c8a044;margin-right:2px;"></i>';
      } else {
        html += '<i class="' + (i <= rating ? 'fas' : 'far') + ' fa-star" style="color:#c8a044;font-size:0.9rem;margin-right:1px;"></i>';
      }
    }
    return html;
  }

  /* ── Card de avaliação ── */
  function buildCard(av, delay) {
    return '<article class="testimonial__card reveal" style="--delay:' + (delay * 0.1) + 's" role="listitem">' +
      '<div class="testimonial__stars">' + renderStars(av.estrelas || 5, false) + '</div>' +
      '<p class="testimonial__text">"' + escapeHtml(av.comentario) + '"</p>' +
      '<div class="testimonial__author">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#c8a044,#8b6820);display:grid;place-items:center;flex-shrink:0;">' +
          '<span style="color:#fff;font-weight:700;font-size:1rem;">' + (av.nome || 'C').charAt(0).toUpperCase() + '</span>' +
        '</div>' +
        '<div>' +
          '<strong class="testimonial__name">' + escapeHtml(av.nome || 'Cliente') + '</strong>' +
          '<span class="testimonial__role">' + escapeHtml(av.cidade || 'Cliente verificado') + '</span>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Renderiza destaques na grid da home ── */
  function renderDestaques(avaliacoes) {
    var grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    var destaques = avaliacoes.filter(function (a) { return a.destaque === true; });

    if (destaques.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">Seja o primeiro a avaliar!</p>';
      return;
    }

    grid.innerHTML = destaques.map(function (av, i) { return buildCard(av, i); }).join('');
    if (typeof observeRevealElements === 'function') setTimeout(observeRevealElements, 80);
    else if (typeof observeReveal === 'function') setTimeout(observeReveal, 80);
  }

  /* ── Modal "Ver todos" ── */
  function renderModal(avaliacoes) {
    var list = document.getElementById('allReviewsList');
    if (!list) return;

    var aprovadas = avaliacoes.filter(function (a) { return a.aprovada !== false; });

    if (aprovadas.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#888;padding:2rem;">Nenhuma avaliação ainda.</p>';
      return;
    }

    list.innerHTML = aprovadas.map(function (av, i) { return buildCard(av, i); }).join('');
    if (typeof observeReveal === 'function') setTimeout(observeReveal, 80);
  }

  /* ── Formulário de avaliação ── */
  var currentRating = 0;

  function buildStars() {
    var starContainer = document.getElementById('reviewStars');
    if (!starContainer) return;
    currentRating = 0;
    starContainer.innerHTML = renderStars(0, true);
    starContainer.querySelectorAll('.review-star').forEach(function (star) {
      star.addEventListener('mouseover', function () {
        var val = parseInt(star.dataset.val);
        starContainer.querySelectorAll('.review-star').forEach(function (s, i) {
          s.className = (i < val ? 'fas' : 'far') + ' fa-star review-star';
        });
      });
      star.addEventListener('mouseleave', function () {
        starContainer.querySelectorAll('.review-star').forEach(function (s, i) {
          s.className = (i < currentRating ? 'fas' : 'far') + ' fa-star review-star';
        });
      });
      star.addEventListener('click', function () {
        currentRating = parseInt(star.dataset.val);
        starContainer.querySelectorAll('.review-star').forEach(function (s, i) {
          s.className = (i < currentRating ? 'fas' : 'far') + ' fa-star review-star';
        });
      });
    });
  }

  function initForm() {
    var form = document.getElementById('reviewForm');
    if (!form) return;

    buildStars();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nome = document.getElementById('reviewNome').value.trim();
      var cidade = document.getElementById('reviewCidade').value.trim();
      var comentario = document.getElementById('reviewComentario').value.trim();
      var errEl = document.getElementById('reviewError');

      if (!nome || !comentario) {
        if (errEl) errEl.textContent = 'Preencha nome e comentário.';
        return;
      }
      if (currentRating === 0) {
        if (errEl) errEl.textContent = 'Selecione uma avaliação em estrelas.';
        return;
      }
      if (errEl) errEl.textContent = '';

      if (!window.Firebase || !window.Firebase.db) {
        if (errEl) errEl.textContent = 'Serviço indisponível. Tente mais tarde.';
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

      var fs = window.Firebase.fs;
      fs.addDoc(fs.collection(window.Firebase.db, 'avaliacoes'), {
        nome: nome,
        cidade: cidade,
        comentario: comentario,
        estrelas: currentRating,
        aprovada: false,
        destaque: false,
        criadoEm: fs.serverTimestamp(),
      }).then(function () {
        form.reset();
        buildStars();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar avaliação'; }
        if (typeof showToast === 'function') showToast('Avaliação enviada! Obrigado 🙏', 'success');
        var modalEl = document.getElementById('reviewFormModal');
        if (modalEl) modalEl.classList.remove('is-open');
      }).catch(function (err) {
        console.error('Erro ao salvar avaliação:', err.code, err.message);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar avaliação'; }
        var msg = (err.code === 'permission-denied')
          ? 'Permissão negada — atualize as regras do Firestore no console Firebase.'
          : 'Erro ao enviar. Tente novamente.';
        if (errEl) errEl.textContent = msg;
      });
    });
  }

  /* ── Listener Firestore ── */
  function initListener() {
    if (!window.Firebase || !window.Firebase.db) return;
    var fs = window.Firebase.fs;
    var q = fs.query(
      fs.collection(window.Firebase.db, 'avaliacoes'),
      fs.orderBy('criadoEm', 'desc')
    );
    fs.onSnapshot(q, function (snapshot) {
      var all = [];
      snapshot.forEach(function (doc) { all.push(Object.assign({ id: doc.id }, doc.data())); });
      renderDestaques(all);
      renderModal(all);
    }, function (err) {
      console.warn('Firestore avaliacoes:', err);
    });
  }

  /* ── Modais ── */
  function initModals() {
    /* Abrir modal "ver todos" */
    var btnVerTodos = document.getElementById('btnVerTodasAvaliacoes');
    var modalTodos = document.getElementById('allReviewsModal');
    if (btnVerTodos && modalTodos) {
      btnVerTodos.addEventListener('click', function () { modalTodos.classList.add('is-open'); });
      modalTodos.addEventListener('click', function (e) { if (e.target === modalTodos) modalTodos.classList.remove('is-open'); });
      var close1 = document.getElementById('closeAllReviewsModal');
      if (close1) close1.addEventListener('click', function () { modalTodos.classList.remove('is-open'); });
    }

    /* Abrir modal formulário */
    var btnEscrever = document.getElementById('btnEscreverAvaliacao');
    var modalForm = document.getElementById('reviewFormModal');
    if (btnEscrever && modalForm) {
      btnEscrever.addEventListener('click', function () { modalForm.classList.add('is-open'); });
      modalForm.addEventListener('click', function (e) { if (e.target === modalForm) modalForm.classList.remove('is-open'); });
      var close2 = document.getElementById('closeReviewFormModal');
      if (close2) close2.addEventListener('click', function () { modalForm.classList.remove('is-open'); });
    }
  }

  /* ── Init ── */
  function init() {
    initModals();
    initForm();

    if (window.Firebase && window.Firebase.db) {
      initListener();
    } else {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (window.Firebase && window.Firebase.db) {
          clearInterval(interval);
          initListener();
        } else if (attempts > 30) {
          clearInterval(interval);
        }
      }, 200);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
