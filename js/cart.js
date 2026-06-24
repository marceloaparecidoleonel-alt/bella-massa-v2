/**
 * cart.js
 * Bella Massa — Padaria Artesanal
 *
 * Offcanvas de carrinho da home. Usa Store como única fonte de verdade,
 * garantindo sincronismo com a página carrinho.html.
 */

// ─── Utilitários ─────────────────────────────────────────────────────────────
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── addToCart (chamado pelos botões dos cards de produto) ───────────────────
function addToCart(productId) {
  const strId = String(productId);

  // Busca em _liveProducts (Firestore) depois em BM_PRODUCTS (estático)
  let product = null;
  if (typeof getProductById === 'function') {
    product = getProductById(strId);
  }
  if (!product && typeof BM_PRODUCTS !== 'undefined') {
    product = BM_PRODUCTS.find(p => String(p.id) === strId) || null;
  }

  if (!product) {
    if (typeof showToast === 'function') showToast('Produto não encontrado.', 'error');
    return;
  }

  const name  = product.name  || product.nome  || '';
  const price = typeof product.price === 'number' ? product.price : (product.preco || 0);
  const image = product.image || product.imagem || '';

  Store.addItem({ id: strId, name, price, image }, 1);

  if (typeof showToast === 'function') showToast(`${name} adicionado ao carrinho!`, 'success');
  animateCartBtn();
}

// ─── Offcanvas: abrir / fechar ───────────────────────────────────────────────
function openCart() {
  const cartEl    = document.getElementById('cart');
  const overlayEl = document.getElementById('cartOverlay');
  if (cartEl) { cartEl.classList.add('cart--open'); cartEl.setAttribute('aria-hidden', 'false'); }
  if (overlayEl) overlayEl.classList.add('cart-overlay--visible');
  document.body.classList.add('body--no-scroll');
}

function closeCart() {
  const cartEl    = document.getElementById('cart');
  const overlayEl = document.getElementById('cartOverlay');
  if (cartEl) { cartEl.classList.remove('cart--open'); cartEl.setAttribute('aria-hidden', 'true'); }
  if (overlayEl) overlayEl.classList.remove('cart-overlay--visible');
  document.body.classList.remove('body--no-scroll');
}

// ─── Micro animação no botão do carrinho ─────────────────────────────────────
function animateCartBtn() {
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.classList.add('cart-btn--pulse');
  setTimeout(() => btn.classList.remove('cart-btn--pulse'), 600);
}

// ─── Renderização do offcanvas ───────────────────────────────────────────────
function updateCartUI() {
  const itemsList  = document.getElementById('cartItems');
  const emptyEl    = document.getElementById('cartEmpty');
  const footerEl   = document.getElementById('cartFooter');
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl    = document.getElementById('cartTotal');
  const delivEl    = document.querySelector('.cart__delivery-free');

  if (!itemsList) return;

  const cartItems = Store.getCart();
  const count     = Store.getCount();
  const subtotal  = Store.getSubtotal();
  const delivery  = Store.getDeliveryFee(true);
  const total     = subtotal + delivery;

  const isEmpty = count === 0;
  if (emptyEl)  emptyEl.style.display  = isEmpty ? 'flex'  : 'none';
  if (footerEl) footerEl.style.display = isEmpty ? 'none'  : 'flex';
  itemsList.style.display = isEmpty ? 'none' : 'block';

  if (isEmpty) return;

  itemsList.innerHTML = cartItems.map(item => `
    <li class="cart__item" data-id="${item.id}">
      <div class="cart__item-img">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="cart__item-info">
        <h4 class="cart__item-name">${item.name}</h4>
        <span class="cart__item-price">${formatCurrency(item.price)}</span>
        <div class="cart__item-qty">
          <button class="qty__btn" onclick="Store.updateQty('${item.id}', ${item.qty - 1})" aria-label="Diminuir">
            <i class="fas fa-minus"></i>
          </button>
          <span class="qty__value">${item.qty}</span>
          <button class="qty__btn" onclick="Store.updateQty('${item.id}', ${item.qty + 1})" aria-label="Aumentar">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <div class="cart__item-right">
        <span class="cart__item-total">${formatCurrency(item.price * item.qty)}</span>
        <button class="cart__item-remove" onclick="Store.removeItem('${item.id}')" aria-label="Remover ${item.name}">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
    </li>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (totalEl)    totalEl.textContent    = formatCurrency(total);
  if (delivEl) {
    delivEl.textContent = delivery === 0
      ? `Grátis acima de ${formatCurrency(BM_CONFIG.freeDeliveryAbove)}`
      : formatCurrency(delivery);
    delivEl.style.color = delivery === 0 ? '#4caf50' : 'inherit';
  }
}

// ─── Inicialização ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Garante que o offcanvas começa fechado ao carregar a página
  const cartEl = document.getElementById('cart');
  if (cartEl) {
    cartEl.classList.remove('cart--open');
    cartEl.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('cartOverlay')?.classList.remove('cart-overlay--visible');

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    Store.clearCart();
    if (typeof showToast === 'function') showToast('Carrinho esvaziado.', 'info');
  });

  document.getElementById('ctaCartBtn')?.addEventListener('click', openCart);

  document.getElementById('cartEmptyBtn')?.addEventListener('click', () => {
    closeCart();
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });

  // Fecha o offcanvas ao clicar em qualquer link de navegação interna
  document.querySelectorAll('a.nav__link, .header__logo, .footer__links a').forEach(link => {
    link.addEventListener('click', closeCart);
  });

  // Sincroniza UI sempre que Store mudar
  Store.subscribe(updateCartUI);

  // Atualiza imediatamente com estado atual
  updateCartUI();

  // Recalcula quando config de entrega for carregada do Firestore
  window.addEventListener('configLoaded', updateCartUI);
});
