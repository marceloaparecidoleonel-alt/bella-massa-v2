/**
 * cart.js
 * Bella Massa — Padaria Artesanal
 *
 * Gerenciamento completo do carrinho de compras (offcanvas).
 * Preparado para futura integração com Firebase / API de pagamento.
 */

// ─── Estado do Carrinho ─────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('bellaMassaCart')) || [];

// ─── Utilitários ────────────────────────────────────────────────────────────
/**
 * Formata valor em Reais (BRL)
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Salva o carrinho no localStorage
 */
function saveCart() {
  localStorage.setItem('bellaMassaCart', JSON.stringify(cart));
}

/**
 * Exibe uma notificação toast
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast toast--${type} toast--visible`;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, 3000);
}

// ─── Carrinho: CRUD ──────────────────────────────────────────────────────────
/**
 * Adiciona um produto ao carrinho
 * @param {number} productId
 */
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
    showToast(`+1 ${product.name} adicionado!`, 'success');
  } else {
    cart.push({ ...product, quantity: 1 });
    showToast(`${product.name} adicionado ao carrinho!`, 'success');
  }

  saveCart();
  updateCartUI();
  animateCartBtn();
}

/**
 * Remove um produto do carrinho pelo id
 * @param {number} productId
 */
function removeFromCart(productId) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx === -1) return;

  const name = cart[idx].name;
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
  showToast(`${name} removido do carrinho.`, 'info');
}

/**
 * Altera a quantidade de um produto no carrinho
 * @param {number} productId
 * @param {number} delta — +1 ou -1
 */
function changeQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  updateCartUI();
}

/**
 * Limpa todo o carrinho
 */
function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  showToast('Carrinho esvaziado.', 'info');
}

// ─── Cálculos ────────────────────────────────────────────────────────────────
/**
 * Retorna o total de itens no carrinho
 * @returns {number}
 */
function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Retorna o valor subtotal do carrinho
 * @returns {number}
 */
function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calcula o frete (grátis acima de R$ 50)
 * @returns {number}
 */
function getDeliveryFee() {
  const subtotal = getCartSubtotal();
  return subtotal >= 50 ? 0 : 8.90;
}

/**
 * Retorna o total final (subtotal + frete)
 * @returns {number}
 */
function getCartTotal() {
  return getCartSubtotal() + getDeliveryFee();
}

// ─── Renderização do Carrinho ────────────────────────────────────────────────
/**
 * Atualiza toda a interface do carrinho
 */
function updateCartUI() {
  const badge     = document.getElementById('cartBadge');
  const itemsList = document.getElementById('cartItems');
  const emptyEl   = document.getElementById('cartEmpty');
  const footerEl  = document.getElementById('cartFooter');
  const subtotalEl= document.getElementById('cartSubtotal');
  const totalEl   = document.getElementById('cartTotal');
  const delivEl   = document.querySelector('.cart__delivery-free');

  const count    = getCartCount();
  const subtotal = getCartSubtotal();
  const delivery = getDeliveryFee();
  const total    = getCartTotal();

  // Badge
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('cart__badge--active', count > 0);
  }

  if (!itemsList) return;

  // Vazio vs populado
  const isEmpty = cart.length === 0;
  if (emptyEl) emptyEl.style.display = isEmpty ? 'flex' : 'none';
  if (footerEl) footerEl.style.display = isEmpty ? 'none' : 'flex';
  itemsList.style.display = isEmpty ? 'none' : 'block';

  if (isEmpty) return;

  // Renderiza itens
  itemsList.innerHTML = cart.map(item => `
    <li class="cart__item" data-id="${item.id}">
      <div class="cart__item-img">
        <img src="${item.image}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="cart__item-info">
        <h4 class="cart__item-name">${item.name}</h4>
        <span class="cart__item-price">${formatCurrency(item.price)}</span>
        <div class="cart__item-qty">
          <button class="qty__btn" onclick="changeQuantity(${item.id}, -1)" aria-label="Diminuir">
            <i class="fas fa-minus"></i>
          </button>
          <span class="qty__value">${item.quantity}</span>
          <button class="qty__btn" onclick="changeQuantity(${item.id}, 1)" aria-label="Aumentar">
            <i class="fas fa-plus"></i>
          </button>
        </div>
      </div>
      <div class="cart__item-right">
        <span class="cart__item-total">${formatCurrency(item.price * item.quantity)}</span>
        <button class="cart__item-remove" onclick="removeFromCart(${item.id})" aria-label="Remover ${item.name}">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
    </li>
  `).join('');

  // Resumo financeiro
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (totalEl)    totalEl.textContent    = formatCurrency(total);
  if (delivEl) {
    delivEl.textContent = delivery === 0 ? 'Grátis 🎉' : formatCurrency(delivery);
    delivEl.style.color = delivery === 0 ? '#4caf50' : 'inherit';
  }
}

// ─── Abertura / Fechamento do Carrinho ───────────────────────────────────────
function openCart() {
  const cartEl   = document.getElementById('cart');
  const overlayEl= document.getElementById('cartOverlay');

  if (cartEl) {
    cartEl.classList.add('cart--open');
    cartEl.setAttribute('aria-hidden', 'false');
  }
  if (overlayEl) overlayEl.classList.add('cart-overlay--visible');
  document.body.classList.add('body--no-scroll');
}

function closeCart() {
  const cartEl   = document.getElementById('cart');
  const overlayEl= document.getElementById('cartOverlay');

  if (cartEl) {
    cartEl.classList.remove('cart--open');
    cartEl.setAttribute('aria-hidden', 'true');
  }
  if (overlayEl) overlayEl.classList.remove('cart-overlay--visible');
  document.body.classList.remove('body--no-scroll');
}

// ─── Micro Animação no Botão do Carrinho ─────────────────────────────────────
function animateCartBtn() {
  const btn = document.getElementById('cartBtn');
  if (!btn) return;
  btn.classList.add('cart-btn--pulse');
  setTimeout(() => btn.classList.remove('cart-btn--pulse'), 600);
}

// ─── Inicialização ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Botão abrir carrinho
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.addEventListener('click', openCart);

  // Botão fechar carrinho
  const cartClose = document.getElementById('cartClose');
  if (cartClose) cartClose.addEventListener('click', closeCart);

  // Overlay fecha carrinho
  const overlay = document.getElementById('cartOverlay');
  if (overlay) overlay.addEventListener('click', closeCart);

  // Limpar carrinho
  const clearBtn = document.getElementById('clearCartBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearCart);

  // Botão CTA abre carrinho
  const ctaCartBtn = document.getElementById('ctaCartBtn');
  if (ctaCartBtn) ctaCartBtn.addEventListener('click', openCart);

  // Botão "ver produtos" no estado vazio
  const cartEmptyBtn = document.getElementById('cartEmptyBtn');
  if (cartEmptyBtn) {
    cartEmptyBtn.addEventListener('click', () => {
      closeCart();
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Fecha carrinho com ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });

  // Inicializa UI com dados do localStorage
  updateCartUI();
});
