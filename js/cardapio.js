/**
 * cardapio.js — Bella Massa
 * Lógica da página de cardápio: filtros, ordenação, renderização de cards.
 * Fonte de dados: Firestore (coleção 'produtos', ativo == true).
 * Fallback: BM_PRODUCTS de data.js se Firebase indisponível.
 */

let currentCat   = 'all';
let currentSort  = 'default';
let allProducts  = [];   // lista mestra vinda do Firestore ou BM_PRODUCTS

// ── Normaliza um doc Firestore para o formato interno ─────────────────────────
function normalizeFirestoreProduct(id, data) {
  return {
    id:        id,
    category:  data.categoria  || '',
    name:      data.nome       || '',
    shortDesc: data.descCurta  || data.descricao || '',
    price:     typeof data.preco === 'number' ? data.preco : 0,
    image:     data.imagem     || '',
    badge:     data.destaque   ? 'Destaque' : null,
    badgeType: data.destaque   ? 'bestseller' : null,
    featured:  !!data.destaque,
    available: data.ativo !== false,
    weight:    data.peso       || '',
  };
}

// ── Build product card HTML ───────────────────────────────────────────────────
function buildProdCard(product) {
  const catName = BM_CATEGORIES.find(c => c.id === product.category)?.name || '';
  const badge   = product.badge
    ? `<span class="prod-card__badge prod-card__badge--${product.badgeType}">${product.badge}</span>`
    : '';

  return `
    <article class="prod-card reveal" role="listitem" data-id="${product.id}">
      <a href="produto.html?id=${product.id}" class="prod-card__img-wrap" tabindex="-1" aria-label="Ver ${product.name}">
        <img class="prod-card__img" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${badge}
      </a>
      <div class="prod-card__body">
        <span class="prod-card__cat">${catName}</span>
        <a href="produto.html?id=${product.id}" style="text-decoration:none;">
          <h3 class="prod-card__name">${product.name}</h3>
        </a>
        <p class="prod-card__desc">${product.shortDesc}</p>
        <div class="prod-card__footer">
          <div>
            <div class="prod-card__price">${formatPrice(product.price)}</div>
            ${product.weight ? `<div class="prod-card__weight">${product.weight}</div>` : ''}
          </div>
          <button
            class="prod-card__add"
            data-id="${product.id}"
            aria-label="Adicionar ${product.name} ao carrinho"
            title="Adicionar ao carrinho"
          >
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

// ── Get sorted & filtered products ───────────────────────────────────────────
function getFiltered() {
  let list = currentCat === 'all'
    ? [...allProducts]
    : allProducts.filter(p => p.category === currentCat);

  switch (currentSort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
    default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  return list;
}

// ── Render ───────────────────────────────────────────────────────────────────
function renderCatalog() {
  const grid = document.getElementById('catalogoGrid');
  if (!grid) return;

  const list = getFiltered();

  const countEl = document.getElementById('prodCount');
  if (countEl) countEl.textContent = list.length;

  if (!list.length) {
    grid.innerHTML = `
      <div class="catalogo__empty">
        <i class="fas fa-magnifying-glass"></i>
        <p>Nenhum produto encontrado nesta categoria.</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map(buildProdCard).join('');

  setTimeout(() => {
    if (typeof observeReveal === 'function') observeReveal();
  }, 60);

  grid.querySelectorAll('.prod-card__add').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const product = allProducts.find(p => String(p.id) === String(btn.dataset.id));
      if (!product) return;
      Store.addItem(product, 1);
      if (typeof showToast === 'function') showToast(`${product.name} adicionado ao carrinho!`, 'success');
      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = '#4caf7d';
      setTimeout(() => { btn.innerHTML = '<i class="fas fa-plus"></i>'; btn.style.background = ''; }, 1400);
    });
  });
}

// ── Build sidebar filters ─────────────────────────────────────────────────────
function buildFilters() {
  const listEl = document.getElementById('filterList');
  if (!listEl) return;

  const countAllEl = document.getElementById('count-all');
  if (countAllEl) countAllEl.textContent = allProducts.length;

  // Limpa filtros dinâmicos (mantém o item "Todos")
  listEl.querySelectorAll('li[data-dyn]').forEach(li => li.remove());

  BM_CATEGORIES.forEach(cat => {
    const count = allProducts.filter(p => p.category === cat.id).length;
    if (count === 0) return;
    const li = document.createElement('li');
    li.dataset.dyn = '1';
    li.innerHTML = `
      <button class="filter-list__btn" data-cat="${cat.id}">
        <i class="${cat.icon}"></i>
        ${cat.name}
        <span class="filter-list__count">${count}</span>
      </button>`;
    listEl.appendChild(li);
  });

  listEl.querySelectorAll('.filter-list__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      listEl.querySelectorAll('.filter-list__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      renderCatalog();
    });
  });
}

// ── Sort ──────────────────────────────────────────────────────────────────────
function initSort() {
  const sel = document.getElementById('sortSelect');
  if (!sel) return;
  sel.addEventListener('change', () => { currentSort = sel.value; renderCatalog(); });
}

// ── Mobile filter toggle ──────────────────────────────────────────────────────
function initFilterToggle() {
  const btn     = document.getElementById('filterToggle');
  const sidebar = document.getElementById('catalogoSidebar');
  if (!btn || !sidebar) return;
  btn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.innerHTML = open
      ? '<i class="fas fa-xmark"></i> Fechar'
      : '<i class="fas fa-sliders"></i> Filtros';
  });
}

// ── URL pre-filter ────────────────────────────────────────────────────────────
function applyURLFilter() {
  const params = new URLSearchParams(location.search);
  const cat    = params.get('cat');
  if (cat && BM_CATEGORIES.find(c => c.id === cat)) {
    currentCat = cat;
    document.querySelectorAll('.filter-list__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === cat);
    });
  }
}

// ── Firestore listener ────────────────────────────────────────────────────────
function initFirestoreProducts() {
  if (!window.Firebase || !window.Firebase.db) {
    console.warn('⚠️ Firebase indisponível — usando BM_PRODUCTS como fallback.');
    allProducts = (typeof BM_PRODUCTS !== 'undefined' ? BM_PRODUCTS : []).filter(p => p.available !== false);
    buildFilters();
    applyURLFilter();
    renderCatalog();
    return;
  }

  const fs = window.Firebase.fs;
  const q  = fs.query(
    fs.collection(window.Firebase.db, 'produtos'),
    fs.orderBy('ordem')
  );

  fs.onSnapshot(q, snapshot => {
    if (snapshot.empty) {
      // Sem produtos no Firestore — usa fallback
      console.warn('⚠️ Nenhum produto no Firestore — usando BM_PRODUCTS como fallback.');
      allProducts = (typeof BM_PRODUCTS !== 'undefined' ? BM_PRODUCTS : []).filter(p => p.available !== false);
    } else {
      allProducts = snapshot.docs
        .map(d => normalizeFirestoreProduct(d.id, d.data()))
        .filter(p => p.available !== false);
    }
    buildFilters();
    applyURLFilter();
    renderCatalog();
  }, err => {
    console.error('Erro ao carregar produtos:', err);
    allProducts = (typeof BM_PRODUCTS !== 'undefined' ? BM_PRODUCTS : []).filter(p => p.available !== false);
    buildFilters();
    applyURLFilter();
    renderCatalog();
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSort();
  initFilterToggle();

  // Aguarda Firebase.js carregar (module async), com fallback
  let attempts = 0;
  function tryInit() {
    if (window.Firebase) {
      initFirestoreProducts();
    } else if (attempts < 20) {
      attempts++;
      setTimeout(tryInit, 150);
    } else {
      initFirestoreProducts(); // chama com fallback
    }
  }
  tryInit();
});
