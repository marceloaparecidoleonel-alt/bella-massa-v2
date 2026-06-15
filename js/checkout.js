/**
 * checkout.js — Bella Massa
 * Lógica do checkout: renderização do resumo, validação, submissão do pedido.
 */

let isDelivery = true;

// ── Render sidebar summary ───────────────────────────────────────────────────
function renderCheckoutSummary() {
  const cart = Store.getCart();
  const listEl = document.getElementById('checkoutItemsList');

  if (!listEl) return;

  if (!cart.length) {
    window.location.href = 'carrinho.html';
    return;
  }

  listEl.innerHTML = cart.map(item => `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 0;border-bottom:1px solid var(--clr-border-light);">
      <img src="${item.image}" alt="${item.name}"
           style="width:50px;height:42px;object-fit:cover;border-radius:var(--radius-sm);flex-shrink:0;" />
      <div style="flex:1;min-width:0;">
        <div style="font-size:.82rem;font-weight:600;color:var(--clr-brown-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
        <div style="font-size:.75rem;color:var(--clr-text-muted);">${item.qty}x ${formatPrice(item.price)}</div>
      </div>
      <div style="font-size:.88rem;font-weight:700;color:var(--clr-brown-dark);flex-shrink:0;">${formatPrice(item.price * item.qty)}</div>
    </div>
  `).join('');

  updateCheckoutTotals();
}

function updateCheckoutTotals() {
  const subtotal = Store.getSubtotal();
  const delivery = Store.getDeliveryFee(isDelivery);
  const total    = subtotal + delivery;

  const el = id => document.getElementById(id);
  if (el('coSubtotal')) el('coSubtotal').textContent = formatPrice(subtotal);
  if (el('coDelivery')) {
    el('coDelivery').textContent = delivery === 0
      ? (isDelivery ? 'Grátis' : 'Não aplicável')
      : formatPrice(delivery);
  }
  if (el('coTotal')) el('coTotal').textContent = formatPrice(total);

  const deliveryRow = document.getElementById('coDeliveryRow');
  if (deliveryRow) deliveryRow.style.display = isDelivery ? '' : 'none';
}

// ── Delivery / Pickup toggle ─────────────────────────────────────────────────
function initDeliveryToggle() {
  const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
  const addressFields  = document.getElementById('addressFields');

  deliveryRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      isDelivery = radio.value === 'delivery';

      if (addressFields) {
        addressFields.style.display = isDelivery ? '' : 'none';
        // Required attribute management
        ['clientAddress', 'clientNeighborhood', 'clientCity'].forEach(id => {
          const field = document.getElementById(id);
          if (field) field.required = isDelivery;
        });
      }

      updateCheckoutTotals();
    });
  });
}

// ── Payment toggle (troco) ───────────────────────────────────────────────────
function initPaymentToggle() {
  const payRadios  = document.querySelectorAll('input[name="payment"]');
  const trocoField = document.getElementById('trocoPara');

  payRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (trocoField) {
        trocoField.classList.toggle('visible', radio.value === 'dinheiro');
      }
    });
  });
}

// ── Validation ───────────────────────────────────────────────────────────────
function showFieldError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err)   err.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => el.classList.remove('error'));
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
}

function validateForm(data) {
  let valid = true;
  clearErrors();

  if (!data.name.trim()) {
    showFieldError('clientName', 'err-name', 'Informe seu nome completo.');
    valid = false;
  }

  const phone = data.phone.replace(/\D/g, '');
  if (phone.length < 10) {
    showFieldError('clientPhone', 'err-phone', 'Informe um telefone válido.');
    valid = false;
  }

  if (isDelivery) {
    if (!data.address.trim()) {
      showFieldError('clientAddress', 'err-address', 'Informe seu endereço.');
      valid = false;
    }
    if (!data.neighborhood.trim()) {
      showFieldError('clientNeighborhood', 'err-neighborhood', 'Informe seu bairro.');
      valid = false;
    }
    if (!data.city.trim()) {
      showFieldError('clientCity', 'err-city', 'Informe sua cidade.');
      valid = false;
    }
  }

  return valid;
}

// ── Form submit ──────────────────────────────────────────────────────────────
function initForm() {
  const form = document.getElementById('checkoutForm');
  const btn  = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const data = {
      name:         document.getElementById('clientName').value,
      phone:        document.getElementById('clientPhone').value,
      address:      document.getElementById('clientAddress')?.value || '',
      neighborhood: document.getElementById('clientNeighborhood')?.value || '',
      city:         document.getElementById('clientCity')?.value || '',
      obs:          document.getElementById('clientObs')?.value || '',
      delivery:     isDelivery ? 'delivery' : 'pickup',
      payment:      document.querySelector('input[name="payment"]:checked')?.value || 'pix',
      troco:        document.getElementById('trocoVal')?.value || '',
    };

    if (!validateForm(data)) {
      showToast('Corrija os campos indicados.', 'error');
      return;
    }

    if (!Store.getCount()) {
      showToast('Seu carrinho está vazio.', 'error');
      return;
    }

    // Disable button, show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando…';

    // Build WhatsApp message
    const cart   = Store.getCart();
    const total  = formatPrice(Store.getGrandTotal(isDelivery));
    const payLabels = { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' };

    let msg = `🥖 *Pedido Bella Massa*\n\n`;
    msg += `👤 *Cliente:* ${data.name}\n`;
    msg += `📞 *Telefone:* ${data.phone}\n\n`;
    msg += `📦 *Itens:*\n`;
    cart.forEach(item => {
      msg += `• ${item.qty}x ${item.name} — ${formatPrice(item.price * item.qty)}\n`;
    });
    msg += `\n💰 *Total: ${total}*\n`;
    msg += `💳 *Pagamento:* ${payLabels[data.payment] || data.payment}`;
    if (data.payment === 'dinheiro' && data.troco) msg += ` (troco para R$ ${data.troco})`;
    msg += '\n\n';

    if (isDelivery) {
      msg += `🏠 *Entrega:* ${data.address}, ${data.neighborhood} — ${data.city}\n`;
    } else {
      msg += `🏪 *Retirada na loja*\n`;
    }

    if (data.obs) msg += `\n📝 *Obs:* ${data.obs}`;

    // Save order to session for success page
    sessionStorage.setItem('bm_last_order', JSON.stringify({
      name: data.name,
      phone: data.phone,
      address: data.address,
      neighborhood: data.neighborhood,
      city: data.city,
      delivery: data.delivery,
      payment: data.payment,
      total,
    }));

    // Simulate processing then clear cart and redirect
    setTimeout(() => {
      // Open WhatsApp
      const waURL = `https://wa.me/${BM_CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
      window.open(waURL, '_blank');

      Store.clearCart();
      window.location.href = 'pedido-confirmado.html';
    }, 900);
  });
}

// ── Phone mask ───────────────────────────────────────────────────────────────
function initPhoneMask() {
  const input = document.getElementById('clientPhone');
  if (!input) return;

  input.addEventListener('input', () => {
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) {
      v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    } else if (v.length > 2) {
      v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    } else if (v.length) {
      v = `(${v}`;
    }
    input.value = v;
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderCheckoutSummary();
  initDeliveryToggle();
  initPaymentToggle();
  initPhoneMask();
  initForm();

  Store.subscribe(renderCheckoutSummary);
});
