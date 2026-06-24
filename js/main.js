/**
 * main.js
 * Bella Massa — Padaria Artesanal
 *
 * Inicialização, renderização de componentes e interações da interface.
 * Preparado para futura integração com Firebase.
 */

// ─── Renderização das Categorias ─────────────────────────────────────────────
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map((cat, index) => `
    <article
      class="category__card reveal"
      style="--delay: ${index * 0.08}s"
      data-category="${cat.id}"
      onclick="filterProducts('${cat.id}'); scrollToProducts();"
      role="listitem button"
      tabindex="0"
      aria-label="Ver categoria ${cat.name}"
    >
      <div class="category__img-wrap">
        <img src="${cat.image}" alt="${cat.name}" loading="lazy" />
        <div class="category__overlay"></div>
      </div>
      <div class="category__content">
        <div class="category__icon" style="background:${cat.color}22; color:${cat.color}">
          <i class="${cat.icon}"></i>
        </div>
        <h3 class="category__name">${cat.name}</h3>
        <p class="category__desc">${cat.description}</p>
        <span class="category__cta">Ver produtos <i class="fas fa-arrow-right"></i></span>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.category__card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

// ─── Renderização dos Produtos ───────────────────────────────────────────────
let activeFilter = 'all';
let _liveProducts = null; // produtos carregados do Firestore

/**
 * Monta o HTML de um card de produto
 */
function buildProductCard(product, index) {
  const imgSrc = product.image || product.imagem || '';
  const name   = product.name  || product.nome  || '';
  const desc   = product.description || product.descCurta || product.descricao || '';
  const price  = typeof product.price === 'number' ? product.price : (product.preco || 0);
  const cat    = product.category || product.categoria || '';
  const badge  = product.badge  || null;
  const badgeT = product.badgeType || (product.destaque ? 'bestseller' : null);
  const pid    = product.id || product._id || index;

  return `
    <article class="product__card reveal" style="--delay: ${index * 0.07}s" data-id="${pid}">
      <div class="product__img-wrap">
        <img src="${imgSrc}" alt="${name}" loading="lazy" />
        ${badge ? `<span class="product__badge product__badge--${badgeT}">${badge}</span>` : (product.destaque ? '<span class="product__badge product__badge--bestseller">Destaque</span>' : '')}
        <div class="product__img-overlay">
          <button class="product__quick-add" onclick="addToCart('${pid}')" aria-label="Adicionar ${name} ao carrinho">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <div class="product__body">
        <span class="product__category">${getCategoryName(cat)}</span>
        <h3 class="product__name">${name}</h3>
        <p class="product__desc">${desc}</p>
        <div class="product__footer">
          <span class="product__price">${formatCurrency(price)}</span>
          <button class="btn btn--add-cart" onclick="addToCart('${pid}')" aria-label="Adicionar ao carrinho">
            <i class="fas fa-basket-shopping"></i>
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </article>`;
}

/**
 * Renderiza os cards de produto conforme o filtro ativo
 * @param {string} filter — id da categoria ou 'all'
 * @param {Array}  source — lista de produtos (opcional, usa _liveProducts ou PRODUCTS)
 */
function renderProducts(filter = 'all', source) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const pool = source || (_liveProducts !== null ? _liveProducts : []);
  const filtered = filter === 'all'
    ? pool
    : pool.filter(p => (p.category || p.categoria) === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p class="products__empty">Nenhum produto nesta categoria ainda.</p>';
    return;
  }

  grid.classList.add('products__grid--exit');
  setTimeout(() => {
    grid.innerHTML = filtered.map((p, i) => buildProductCard(p, i)).join('');
    grid.classList.remove('products__grid--exit');
    observeRevealElements();
  }, 200);
}

/**
 * Inicializa o listener Firestore para produtos em destaque.
 * Nunca usa dados estáticos — mostra spinner até Firestore responder.
 */
function initProductsFromFirestore() {
  const grid = document.getElementById('productsGrid');

  if (!window.Firebase || !window.Firebase.db) {
    if (grid) grid.innerHTML = '<p class="products__empty">Catálogo em breve.</p>';
    return;
  }

  if (grid) grid.innerHTML = '<p class="products__empty" style="opacity:.5"><i class="fas fa-spinner fa-spin"></i> Carregando catálogo…</p>';

  const fs = window.Firebase.fs;
  const q  = fs.query(
    fs.collection(window.Firebase.db, 'produtos'),
    fs.orderBy('ordem')
  );

  fs.onSnapshot(q, snapshot => {
    _liveProducts = snapshot.docs
      .map(d => Object.assign({ id: d.id }, d.data()))
      .filter(p => p.ativo !== false && p.destaque === true);

    renderProducts(activeFilter);
  }, () => {
    if (grid) grid.innerHTML = '<p class="products__empty">Não foi possível carregar o catálogo.</p>';
  });
}

/**
 * Retorna o nome da categoria pelo id
 * @param {string} categoryId
 * @returns {string}
 */
function getCategoryName(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

/**
 * Filtra os produtos por categoria e atualiza os botões de filtro
 * @param {string} filter
 */
function filterProducts(filter) {
  activeFilter = filter;

  // Atualiza botões ativos
  document.querySelectorAll('.filter__btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderProducts(filter);
}

/**
 * Scrolla suavemente até a seção de produtos
 */
function scrollToProducts() {
  setTimeout(() => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ─── Renderização do Processo Artesanal ──────────────────────────────────────
function renderProcess() {
  const grid = document.getElementById('processGrid');
  if (!grid || typeof PROCESS_STEPS === 'undefined') return;

  grid.innerHTML = PROCESS_STEPS.map((step, index) => `
    <div class="process__step reveal" style="--delay:${index * 0.12}s">
      <div class="process__num">${step.num}</div>
      <div class="process__icon"><i class="${step.icon}"></i></div>
      <h3 class="process__title">${step.title}</h3>
      <p class="process__desc">${step.desc}</p>
    </div>
  `).join('');
}

// ─── Renderização dos Depoimentos ────────────────────────────────────────────
function renderTestimonials() {
  // Renderização dinâmica via avaliacoes.js (Firestore)
  const grid = document.getElementById('testimonialsGrid');
  if (grid) grid.innerHTML = '<p style="text-align:center;opacity:.5;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Carregando avaliações…</p>';
}

// ─── Header: scroll + sticky ─────────────────────────────────────────────────
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const current = window.scrollY;

    // Sticky com sombra
    header.classList.toggle('header--scrolled', current > 60);

    // Hide on scroll down, show on scroll up
    if (current > lastScroll && current > 150) {
      header.classList.add('header--hidden');
    } else {
      header.classList.remove('header--hidden');
    }

    lastScroll = current <= 0 ? 0 : current;
  }, { passive: true });
}

// ─── Menu Mobile (Hamburger) ─────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('mainNav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('nav--open');
    hamburger.classList.toggle('hamburger--active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('body--no-scroll', isOpen);
  });

  // Fecha ao clicar em um link
  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      hamburger.classList.remove('hamburger--active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('body--no-scroll');
    });
  });

  // Fecha ao clicar fora
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove('nav--open');
      hamburger.classList.remove('hamburger--active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('body--no-scroll');
    }
  });
}

// ─── Filtros de Produtos ─────────────────────────────────────────────────────
function initProductFilters() {
  const filtersEl = document.getElementById('productFilters');
  if (!filtersEl) return;

  filtersEl.addEventListener('click', e => {
    const btn = e.target.closest('.filter__btn');
    if (!btn) return;
    filterProducts(btn.dataset.filter);
  });
}

// ─── Smooth Scroll para links âncora ─────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ─── Animações de Reveal (Intersection Observer) ─────────────────────────────
function observeRevealElements() {
  const elements = document.querySelectorAll('.reveal:not(.revealed)');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

// ─── Nav Link Ativo por Scroll ───────────────────────────────────────────────
function initActiveNavOnScroll() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav__link');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'nav__link--active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  sections.forEach(sec => observer.observe(sec));
}

// ─── Contador Animado ────────────────────────────────────────────────────────
function animateCounters() {
  const counters = document.querySelectorAll('.stat__number');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const rawText = el.textContent;
        const numMatch = rawText.match(/[\d,.]+/);
        if (!numMatch) return;

        const target = parseFloat(numMatch[0].replace(/[,.]/g, ''));
        const suffix = rawText.replace(/[\d,.]+/, '').trim();
        let start = 0;
        const duration = 1800;
        const step = (timestamp) => {
          if (!el._startTime) el._startTime = timestamp;
          const progress = Math.min((timestamp - el._startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.floor(eased * target);

          if (target >= 1000) {
            el.textContent = value.toLocaleString('pt-BR') + suffix;
          } else {
            el.textContent = value + suffix;
          }

          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = rawText; // restaura exato
        };

        requestAnimationFrame(step);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ─── Entrada Principal ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render dinâmico
  renderCategories();
  renderProcess();
  renderTestimonials();

  // Produtos: aguarda Firebase, sem fallback estático
  function tryFirebaseProducts() {
    if (window.Firebase && window.Firebase.db) {
      initProductsFromFirestore();
    } else if (window._firebaseInitAttempts > 30) {
      const g = document.getElementById('productsGrid');
      if (g) g.innerHTML = '<p class="products__empty">Catálogo em breve.</p>';
    } else {
      window._firebaseInitAttempts = (window._firebaseInitAttempts || 0) + 1;
      setTimeout(tryFirebaseProducts, 150);
    }
  }
  tryFirebaseProducts();

  // UI
  initHeader();
  initMobileMenu();
  initProductFilters();
  initSmoothScroll();
  initActiveNavOnScroll();
  animateCounters();

  // Observers (aguarda render)
  setTimeout(observeRevealElements, 120);

  // Ano dinâmico no footer
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
