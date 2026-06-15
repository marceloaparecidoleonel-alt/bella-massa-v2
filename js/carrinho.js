/**
 * carrinho.js — Bella Massa
 * Lógica da página de carrinho: listar itens, alterar qtd, remover, resumo.
 */

// ── Render cart rows ─────────────────────────────────────────────────────────
function renderCartPage() {
  const cart       = Store.getCart();
  const listEl     = document.getElementById('cartItemsList');
  const summaryEl  = document.getElementById('orderSummary');
  const layoutEl   = document.getElementById('carrinhoLayout');
  const subtitle   = document.getElementById('cartHeaderSubtitle');

  if (!listEl) return;

  if (!cart.length) {
    listEl.innerHTML = `
      <div class="carrinho__empty">
        <i class="fas fa-bag-shopping"></i>
        <h3>Seu carrinho está vazio</h3>
        <p>Adicione produtos do nosso catálogo para começar.</p>
        <a href="catalogo.html" style="display:inline-flex;align-items:center;gap:.5em;padding:.82em 1.8em;background:linear-gradient(135deg,#d4a040,#a06820);color:white;border-radius:999px;font-weight:600;text-decoration:none;font-size:.9rem;">
          <i class="fas fa-bag-shopping"></i> Ver catálogo
        </a>
      </div>`;
    if (summaryEl) summaryEl.style.display = 'none';
    if (subtitle)  subtitle.textContent = 'Seu carrinho está vazio.';
    return;
  }

  if (summaryEl) summaryEl.style.display = '';
  if (subtitle)  subtitle.textContent = `${Store.getCount()} ${Store.getCount() === 1 ? 'item' : 'itens'} no carrinho.`;

  listEl.innerHTML = cart.map(item => `
    <div class="cart-row" data-id="${item.id}">
      <img class="cart-row__img" src="${item.image}" alt="${item.name}" loading="lazy" />
      <div class="cart-row__info">
        <div class="cart-row__name">${item.name}</div>
        <div class="cart-row__unit">${formatPrice(item.price)} / unid.</div>
        <div class="cart-row__controls">
          <div class="cart-row__qty">
            <button class="cart-row__qty-btn" data-action="dec" data-id="${item.id}" aria-label="Diminuir">
              <i class="fas fa-minus"></i>
            </button>
            <span class="cart-row__qty-val">${item.qty}</span>
            <button class="cart-row__qty-btn" data-action="inc" data-id="${item.id}" aria-label="Aumentar">
              <i class="fas fa-plus"></i>
            </button>
          </div>
          <button class="cart-row__remove" data-id="${item.id}" aria-label="Remover ${item.name}">
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      </div>
      <div class="cart-row__subtotal">
        <div class="cart-row__price">${formatPrice(item.price * item.qty)}</div>
      </div>
    </div>
  `).join('');

  // Controls
  listEl.querySelectorAll('.cart-row__qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id   = Number(btn.dataset.id);
      const item = Store.getCart().find(i => i.id === id);
      if (!item) return;
      if (btn.dataset.action === 'inc') {
        Store.updateQty(id, item.qty + 1);
      } else {
        Store.updateQty(id, item.qty - 1);
      }
    });
  });

  listEl.querySelectorAll('.cart-row__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.removeItem(btn.dataset.id);
      showToast('Item removido do carrinho.', 'info');
    });
  });

  updateSummary();
}

// ── Update summary panel ──────────────────────────────────────────────────────
function updateSummary() {
  const subtotal  = Store.getSubtotal();
  const delivery  = Store.getDeliveryFee(true);
  const total     = subtotal + delivery;
  const hint      = document.getElementById('freeDeliveryHint');

  const fmt = v => formatPrice(v);

  const el = id => document.getElementById(id);
  if (el('summarySubtotal')) el('summarySubtotal').textContent = fmt(subtotal);
  if (el('summaryDelivery')) el('summaryDelivery').textContent = delivery === 0 ? 'Grátis' : fmt(delivery);
  if (el('summaryTotal'))    el('summaryTotal').textContent    = fmt(total);

  if (hint) {
    if (delivery > 0) {
      const remaining = BM_CONFIG.freeDeliveryAbove - subtotal;
      hint.style.display = '';
      hint.textContent = `Faltam ${fmt(remaining)} para frete grátis!`;
    } else if (subtotal > 0) {
      hint.style.display = '';
      hint.textContent = 'Você ganhou frete grátis! 🎉';
    } else {
      hint.style.display = 'none';
    }
  }

  // Disable checkout button if cart empty
  const btn = document.getElementById('checkoutBtn');
  if (btn) {
    if (!Store.getCount()) {
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.5';
    } else {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
    }
  }
}

// ── Suggestions ──────────────────────────────────────────────────────────────
function renderSuggestions() {
  const grid = document.getElementById('suggestGrid');
  if (!grid) return;

  const cartIds  = Store.getCart().map(i => i.id);
  const featured = BM_PRODUCTS.filter(p => p.featured && !cartIds.includes(p.id)).slice(0, 4);

  if (!featured.length) {
    document.getElementById('suggestSection')?.style && (document.getElementById('suggestSection').style.display = 'none');
    return;
  }

  grid.innerHTML = featured.map(p => {
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
            <button class="prod-card__add" data-id="${p.id}" aria-label="Adicionar ${p.name}">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.prod-card__add').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = getProductById(btn.dataset.id);
      if (!p) return;
      Store.addItem(p, 1);
      showToast(`${p.name} adicionado!`, 'success');
    });
  });

  setTimeout(() => { if (typeof observeReveal === 'function') observeReveal(); }, 60);
}

// ── Clear cart button ────────────────────────────────────────────────────────
function initClearBtn() {
  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    if (!Store.getCount()) return;
    if (confirm('Deseja remover todos os itens do carrinho?')) {
      Store.clearCart();
      showToast('Carrinho limpo.', 'info');
    }
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCartPage();
  renderSuggestions();
  initClearBtn();

  Store.subscribe(() => {
    renderCartPage();
    renderSuggestions();
  });
});
