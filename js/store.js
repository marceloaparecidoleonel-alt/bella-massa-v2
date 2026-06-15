/**
 * store.js — Bella Massa
 * Gerenciamento global de estado do carrinho.
 * Usa LocalStorage para persistência.
 * Interface preparada para integração com Firebase.
 */

const Store = (() => {
  const STORAGE_KEY = 'bm_cart';

  // ── State ────────────────────────────────────────────────────────
  let _cart = _load();
  const _listeners = [];

  function _load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_cart));
    _notify();
  }

  function _notify() {
    _listeners.forEach(fn => fn(_cart));
  }

  // ── Public API ───────────────────────────────────────────────────
  function getCart() {
    return [..._cart];
  }

  function addItem(product, qty = 1) {
    const existing = _cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      _cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty,
      });
    }
    _save();
  }

  function removeItem(productId) {
    _cart = _cart.filter(i => i.id !== Number(productId));
    _save();
  }

  function updateQty(productId, qty) {
    const item = _cart.find(i => i.id === Number(productId));
    if (!item) return;
    if (qty <= 0) {
      removeItem(productId);
    } else {
      item.qty = qty;
      _save();
    }
  }

  function clearCart() {
    _cart = [];
    _save();
  }

  function getTotal() {
    return _cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function getCount() {
    return _cart.reduce((sum, i) => sum + i.qty, 0);
  }

  function getSubtotal() {
    return getTotal();
  }

  function getDeliveryFee(isDelivery = true) {
    if (!isDelivery) return 0;
    const subtotal = getSubtotal();
    if (subtotal === 0) return 0;
    return subtotal >= BM_CONFIG.freeDeliveryAbove ? 0 : BM_CONFIG.deliveryFee;
  }

  function getGrandTotal(isDelivery = true) {
    return getSubtotal() + getDeliveryFee(isDelivery);
  }

  function subscribe(fn) {
    _listeners.push(fn);
  }

  function unsubscribe(fn) {
    const idx = _listeners.indexOf(fn);
    if (idx > -1) _listeners.splice(idx, 1);
  }

  return {
    getCart, addItem, removeItem, updateQty, clearCart,
    getTotal, getCount, getSubtotal, getDeliveryFee, getGrandTotal,
    subscribe, unsubscribe,
  };
})();

// ── Cart badge updater (shared across all pages) ─────────────────────────────
function updateCartBadges() {
  const count = Store.getCount();
  document.querySelectorAll('.cart__badge, [data-cart-count]').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? '' : 'none';
  });
}

Store.subscribe(updateCartBadges);
document.addEventListener('DOMContentLoaded', updateCartBadges);
