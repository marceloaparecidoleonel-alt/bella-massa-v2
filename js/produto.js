/**
 * produto.js — Bella Massa
 * Lógica da página de produto individual.
 */

let currentQty = 1;
let _allProducts = []; // produtos do Firestore para relacionados

// ── Get product ID from URL ──────────────────────────────────────────────────
function getIdFromURL() {
  return new URLSearchParams(location.search).get('id');
}

// ── Render product page ──────────────────────────────────────────────────────
function renderProduct(product) {
  const catObj  = BM_CATEGORIES.find(c => c.id === product.category);
  const badge   = product.badge
    ? `<span class="prod-card__badge prod-card__badge--${product.badgeType}" style="position:static;margin-bottom:.5rem;display:inline-flex;">${product.badge}</span>`
    : '';
  const tags = product.tags.map(t => `<span class="produto__tag">${t}</span>`).join('');

  document.getElementById('breadcrumbName').textContent = product.name;
  document.title = `${product.name} | Bella Massa`;

  document.getElementById('prodLayout').innerHTML = `
    <!-- Gallery -->
    <div class="produto__gallery">
      <div class="produto__img-main">
        <img src="${product.image}" alt="${product.name}" loading="eager" />
      </div>
    </div>

    <!-- Info -->
    <div class="produto__info">
      ${badge}
      <span class="produto__cat">${catObj?.name || ''}</span>
      <h1 class="produto__title">${product.name}</h1>

      <div class="produto__price-row">
        <span class="produto__price">${formatPrice(product.price)}</span>
        <span class="produto__weight-badge"><i class="fas fa-scale-unbalanced-flip"></i> ${product.weight}</span>
      </div>

      <p class="produto__desc">${product.description}</p>

      <div class="produto__tags">${tags}</div>

      <div class="produto__qty-row">
        <div class="qty-selector">
          <button class="qty-selector__btn" id="qtyMinus" aria-label="Diminuir quantidade">
            <i class="fas fa-minus"></i>
          </button>
          <span class="qty-selector__val" id="qtyVal">1</span>
          <button class="qty-selector__btn" id="qtyPlus" aria-label="Aumentar quantidade">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        <button class="produto__add-btn" id="addToCartBtn">
          <i class="fas fa-bag-shopping"></i>
          <span>Adicionar ao carrinho</span>
        </button>
      </div>

      <div class="produto__trust">
        <div class="produto__trust-item">
          <i class="fas fa-truck-fast"></i>
          <span>Entrega rápida</span>
        </div>
        <div class="produto__trust-item">
          <i class="fas fa-leaf"></i>
          <span>Sem conservantes</span>
        </div>
        <div class="produto__trust-item">
          <i class="fas fa-award"></i>
          <span>Feito artesanalmente</span>
        </div>
      </div>
    </div>
  `;

  // Qty controls
  const qtyVal = document.getElementById('qtyVal');

  document.getElementById('qtyMinus').addEventListener('click', () => {
    if (currentQty > 1) { currentQty--; qtyVal.textContent = currentQty; }
  });

  document.getElementById('qtyPlus').addEventListener('click', () => {
    currentQty++;
    qtyVal.textContent = currentQty;
  });

  // Add to cart
  document.getElementById('addToCartBtn').addEventListener('click', () => {
    Store.addItem(product, currentQty);
    showToast(`${currentQty}x ${product.name} adicionado!`, 'success');

    const btn = document.getElementById('addToCartBtn');
    btn.innerHTML = '<i class="fas fa-check"></i> <span>Adicionado!</span>';
    btn.style.background = 'linear-gradient(135deg,#4caf7d,#2d9e61)';
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-bag-shopping"></i> <span>Adicionar ao carrinho</span>';
      btn.style.background = '';
    }, 1800);
  });
}

// ── Normalize Firestore doc → formato interno ───────────────────────────────
function normalizeDoc(id, data) {
  return {
    id,
    category:    data.categoria  || '',
    name:        data.nome       || '',
    shortDesc:   data.descCurta  || data.descricao || '',
    description: data.descricao  || data.descCurta || '',
    price:       typeof data.preco === 'number' ? data.preco : 0,
    image:       data.imagem     || '',
    badge:       data.destaque   ? 'Destaque' : null,
    badgeType:   data.destaque   ? 'bestseller' : null,
    available:   data.ativo !== false,
    weight:      data.peso       || '',
    tags:        data.tags       || [],
  };
}

// ── Render related products ──────────────────────────────────────────────────
function renderRelated(product) {
  const pool = _allProducts.length ? _allProducts : BM_PRODUCTS;
  const related = pool
    .filter(p => p.category === product.category && String(p.id) !== String(product.id))
    .slice(0, 4);

  if (!related.length) return;

  const section = document.getElementById('relatedSection');
  const grid    = document.getElementById('relatedGrid');
  if (!section || !grid) return;

  section.style.display = '';

  grid.innerHTML = related.map(p => {
    const badge = p.badge
      ? `<span class="prod-card__badge prod-card__badge--${p.badgeType}">${p.badge}</span>` : '';
    return `
      <article class="prod-card reveal">
        <a href="produto.html?id=${p.id}" class="prod-card__img-wrap">
          <img class="prod-card__img" src="${p.image}" alt="${p.name}" loading="lazy" />
          ${badge}
        </a>
        <div class="prod-card__body">
          <a href="produto.html?id=${p.id}" style="text-decoration:none;">
            <h3 class="prod-card__name">${p.name}</h3>
          </a>
          <p class="prod-card__desc">${p.shortDesc}</p>
          <div class="prod-card__footer">
            <div>
              <div class="prod-card__price">${formatPrice(p.price)}</div>
              <div class="prod-card__weight">${p.weight}</div>
            </div>
            <button class="prod-card__add" data-id="${p.id}" aria-label="Adicionar ${p.name} ao carrinho">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.prod-card__add').forEach(btn => {
    btn.addEventListener('click', () => {
      const pool = _allProducts.length ? _allProducts : BM_PRODUCTS;
      const p = pool.find(x => String(x.id) === String(btn.dataset.id));
      if (!p) return;
      Store.addItem(p, 1);
      showToast(`${p.name} adicionado!`, 'success');
    });
  });

  setTimeout(() => { if (typeof observeReveal === 'function') observeReveal(); }, 60);
}

// ── Mostra estado de erro ─────────────────────────────────────────────────────
function showNotFound() {
  document.getElementById('prodLayout').innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:5rem 1rem;">
      <i class="fas fa-circle-exclamation" style="font-size:3rem;color:var(--clr-border);margin-bottom:1rem;display:block;"></i>
      <h2 style="font-family:var(--ff-heading);font-size:1.5rem;margin-bottom:.5rem;color:var(--clr-brown-dark);">Produto não encontrado</h2>
      <p style="color:var(--clr-text-muted);margin-bottom:1.5rem;">Esse produto pode ter sido removido ou o link está incorreto.</p>
      <a href="cardapio.html" style="display:inline-flex;align-items:center;gap:.5em;padding:.8em 1.8em;background:linear-gradient(135deg,#d4a040,#a06820);color:white;border-radius:999px;font-weight:600;text-decoration:none;">
        <i class="fas fa-arrow-left"></i> Ver cardápio
      </a>
    </div>`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const id = getIdFromURL();

  if (!id) { showNotFound(); return; }

  function tryFirestore() {
    if (!window.Firebase || !window.Firebase.db) {
      // Firebase não disponível — tenta fallback estático
      const fb = typeof BM_PRODUCTS !== 'undefined'
        ? BM_PRODUCTS.find(p => String(p.id) === String(id))
        : null;
      if (fb) { renderProduct(fb); renderRelated(fb); }
      else showNotFound();
      return;
    }

    const fs  = window.Firebase.fs;
    const db  = window.Firebase.db;

    // 1) Busca o produto específico pelo doc ID no Firestore
    fs.getDoc(fs.doc(db, 'produtos', id))
      .then(snap => {
        if (snap.exists()) {
          const product = normalizeDoc(snap.id, snap.data());

          // 2) Busca todos os produtos para relacionados
          const q = fs.query(fs.collection(db, 'produtos'), fs.orderBy('ordem'));
          return fs.getDocs(q).then(all => {
            _allProducts = all.docs
              .map(d => normalizeDoc(d.id, d.data()))
              .filter(p => p.available !== false);
            renderProduct(product);
            renderRelated(product);
          });
        } else {
          // ID não é doc Firestore — tenta BM_PRODUCTS (produtos locais)
          const local = typeof BM_PRODUCTS !== 'undefined'
            ? BM_PRODUCTS.find(p => String(p.id) === String(id))
            : null;
          if (local) { renderProduct(local); renderRelated(local); }
          else showNotFound();
        }
      })
      .catch(() => showNotFound());
  }

  // Aguarda Firebase.js (módulo async) estar pronto
  let attempts = 0;
  function waitFirebase() {
    if (window.Firebase) {
      tryFirestore();
    } else if (attempts < 25) {
      attempts++;
      setTimeout(waitFirebase, 150);
    } else {
      tryFirestore(); // chama com fallback
    }
  }
  waitFirebase();
});
