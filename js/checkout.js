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

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Evita múltiplas submissões
    if (btn.disabled) {
      console.log('Formulário já está sendo processado');
      return;
    }

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

    const cart = Store.getCart();

    // Save order to Firestore first
    const orderNumber = String(Date.now()).slice(-4);
    const orderData = {
      numero: orderNumber,
      cliente: {
        nome: data.name,
        telefone: data.phone
      },
      endereco: isDelivery ? {
        rua: data.address,
        bairro: data.neighborhood,
        cidade: data.city
      } : null,
      itens: cart.map(item => ({
        id: item.id,
        nome: item.name,
        qty: item.qty,
        preco: item.price
      })),
      pagamento: data.payment,
      troco: data.troco || '',
      tipo: isDelivery ? 'delivery' : 'pickup',
      total: Store.getGrandTotal(isDelivery),
      status: 'pendente', // Status inicial: aguardando pagamento
      paymentStatus: 'pending',
      obs: data.obs || '',
    };

    let orderId = null;

    // Aguarda Firebase inicializar (máx 5s) antes de tentar salvar
    const waitForFirebase = () => new Promise((resolve) => {
      if (window.Firebase && window.Firebase.db && window.Firebase.fs) {
        return resolve(true);
      }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.Firebase && window.Firebase.db && window.Firebase.fs) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts >= 25) { // 25 * 200ms = 5s
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
    });

    const firebaseReady = await waitForFirebase();

    // Save to Firestore
    if (firebaseReady) {
      try {
        // Adiciona timestamps apenas quando Firebase está disponível
        orderData.criadoEm = window.Firebase.fs.serverTimestamp();
        orderData.atualizadoEm = window.Firebase.fs.serverTimestamp();

        const docRef = await window.Firebase.fs.addDoc(
          window.Firebase.fs.collection(window.Firebase.db, 'pedidos'),
          orderData
        );
        orderId = docRef.id;
        console.log('✅ Pedido salvo no Firestore:', orderNumber, orderId);
      } catch (err) {
        console.error('❌ Erro ao salvar pedido no Firestore:', err);
        showToast('Erro ao salvar pedido no banco. Verifique sua conexão e tente novamente.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Finalizar pedido';
        return;
      }
    } else {
      console.warn('⚠️ Firebase não inicializado — pedido não será salvo no banco');
      showToast('Erro: Firebase não disponível.', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Finalizar pedido';
      return;
    }

    // Salva dados do pedido na sessão para página de confirmação
    const total = formatPrice(Store.getGrandTotal(isDelivery));
    sessionStorage.setItem('bm_last_order', JSON.stringify({
      numero: orderNumber,
      name: data.name,
      phone: data.phone,
      address: data.address,
      neighborhood: data.neighborhood,
      city: data.city,
      delivery: data.delivery,
      payment: data.payment,
      total,
    }));

    // PIX → Mercado Pago API | Cartão/Dinheiro → confirmação direta
    if (data.payment === 'pix') {
      try {
        const response = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(item => ({
              name: item.name,
              qty: item.qty,
              price: item.price
            })),
            deliveryFee: isDelivery ? Store.getDeliveryFee(true) : 0,
            payer: {
              name: data.name,
              phone: data.phone,
              email: 'cliente@bellamassa.com'
            },
            orderId: orderId,
            metadata: {
              orderNumber: orderNumber,
              tipo: isDelivery ? 'delivery' : 'pickup'
            }
          })
        });

        const text = await response.text();
        let result;
        try {
          result = text ? JSON.parse(text) : {};
        } catch (parseErr) {
          console.error('Erro ao parsear JSON:', parseErr, 'Resposta:', text);
          throw new Error('Resposta inválida do servidor');
        }

        if (!response.ok) {
          const errorMsg = result.error || result.details || 'Erro ao criar pagamento';
          console.error('Erro da API:', errorMsg);
          throw new Error(errorMsg);
        }

        if (!result.init_point || typeof result.init_point !== 'string' || !result.init_point.startsWith('http')) {
          console.error('init_point inválido:', result.init_point);
          throw new Error('Link de pagamento inválido');
        }

        console.log('✅ Redirecionando para Mercado Pago (PIX):', result.init_point);
        Store.clearCart();
        window.location.href = result.init_point;

      } catch (err) {
        console.error('❌ Erro ao criar pagamento PIX:', err);
        showToast('Erro ao processar PIX: ' + err.message + '. Tente novamente.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Finalizar pedido';
      }
    } else {
      // Cartão ou Dinheiro → pagamento presencial, vai direto para confirmação
      console.log('✅ Pedido registrado — pagamento presencial:', data.payment);
      Store.clearCart();
      window.location.href = 'pedido-confirmado.html?status=success';
    }
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

  // Recalcular resumo quando config do Firestore for carregada
  window.addEventListener('configLoaded', () => {
    renderCheckoutSummary();
  });
});
