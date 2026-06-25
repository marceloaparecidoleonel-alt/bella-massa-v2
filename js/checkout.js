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
      if (typeof updateTrocoVisibility === 'function') updateTrocoVisibility();
    });
  });
}

// ── Payment toggle (troco) ───────────────────────────────────────────────────
function updateTrocoVisibility() {
  const trocoField   = document.getElementById('trocoPara');
  if (!trocoField) return;
  const paySelected  = document.querySelector('input[name="payment"]:checked')?.value;
  const showTroco    = paySelected === 'dinheiro' && isDelivery;
  trocoField.classList.toggle('visible', showTroco);
  if (!showTroco) {
    const inp = document.getElementById('trocoVal');
    if (inp) inp.value = '';
  }
}

function initPaymentToggle() {
  const payRadios = document.querySelectorAll('input[name="payment"]');
  payRadios.forEach(radio => {
    radio.addEventListener('change', updateTrocoVisibility);
  });
  updateTrocoVisibility();
}

// ── Validation ───────────────────────────────────────────────────────────────
function showFieldError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err)   err.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.form-input.error, .form-select.error, .form-textarea.error').forEach(el => el.classList.remove('error'));
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
    if (data.payment === 'dinheiro') {
      const trocoNum = parseFloat(data.troco);
      if (!data.troco || data.troco.trim() === '' || isNaN(trocoNum) || trocoNum < 0) {
        showFieldError('trocoVal', 'err-troco', 'Informe o valor para o troco (pode ser R$ 0,00 se não precisar).');
        valid = false;
      }
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
      // PIX fica oculto no admin até confirmação do pagamento
      ...(data.payment === 'pix' && { status: 'aguardando_pix', paymentStatus: 'pending' }),
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
    const sessionOrder = {
      numero: orderNumber,
      orderId: orderId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      neighborhood: data.neighborhood,
      city: data.city,
      delivery: data.delivery,
      payment: data.payment,
      troco: data.troco || '',
      total,
    };
    sessionStorage.setItem('bm_last_order', JSON.stringify(sessionOrder));

    // Para PIX: banner só aparece após pagamento confirmado (ver startPixPolling)
    // Para cartão/dinheiro: persiste imediatamente
    if (data.payment !== 'pix') {
      localStorage.setItem('bm_active_order', JSON.stringify({
        orderId: orderId,
        numero: orderNumber,
        delivery: data.delivery,
      }));
    }

    // PIX → QR Code no modal | Cartão/Dinheiro → confirmação direta
    if (data.payment === 'pix') {
      try {
        openPixModal();
        const response = await fetch('/api/create-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map(item => ({
              name: item.name,
              qty: item.qty,
              price: item.price
            })),
            deliveryFee: isDelivery ? Store.getDeliveryFee(true) : 0,
            payer: { name: data.name, email: 'cliente@bellamassa.com' },
            orderId: orderId
          })
        });

        const text = await response.text();
        let result;
        try {
          result = text ? JSON.parse(text) : {};
        } catch (e) {
          throw new Error('Resposta inválida do servidor');
        }

        if (!response.ok) {
          const detail = result.details || result.error || JSON.stringify(result);
          throw new Error(detail);
        }

        showPixQr(result.qr_code_base64, result.qr_code, result.payment_id, orderId);
        btn.disabled = false;
        btn.innerHTML = 'Finalizar pedido';

      } catch (err) {
        console.error('❌ Erro ao gerar PIX:', err);
        closePixModal();
        showToast('Erro ao gerar PIX: ' + err.message + '. Tente novamente.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Finalizar pedido';
      }
    } else {
      // Cartão ou Dinheiro → pagamento presencial, vai direto para confirmação
      console.log('✅ Pedido registrado — pagamento presencial:', data.payment);
      Store.clearCart();
      window.location.href = `pedido-confirmado.html?status=success&orderId=${orderId}`;
    }
  });
}

// ── PIX Modal ────────────────────────────────────────────────────────────────
let _pixPollInterval = null;

function openPixModal() {
  const modal = document.getElementById('pixModal');
  if (!modal) return;
  document.getElementById('pixLoading').style.display = 'block';
  document.getElementById('pixContent').style.display = 'none';
  document.getElementById('pixPaidMsg').style.display = 'none';
  modal.style.display = 'flex';
}

function closePixModal() {
  const modal = document.getElementById('pixModal');
  if (modal) modal.style.display = 'none';
  if (_pixPollInterval) { clearInterval(_pixPollInterval); _pixPollInterval = null; }
}

function showPixQr(base64, copyCode, paymentId, orderId) {
  document.getElementById('pixLoading').style.display = 'none';
  const content = document.getElementById('pixContent');
  content.style.display = 'block';

  const img = document.getElementById('pixQrImg');
  if (base64) {
    img.src = 'data:image/png;base64,' + base64;
    img.style.display = 'block';
  } else {
    img.style.display = 'none';
  }

  document.getElementById('pixCopyCode').value = copyCode || '';
  startPixPolling(paymentId, orderId);
}

function copyPixCode() {
  const input = document.getElementById('pixCopyCode');
  if (!input || !input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = document.getElementById('pixCopyBtn');
    btn.textContent = 'Copiado!';
    btn.style.background = '#2d7a3a';
    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.background = '#c8963e'; }, 2000);
  });
}

function startPixPolling(paymentId, orderId) {
  if (!paymentId) return;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutos (5s * 60)

  _pixPollInterval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(_pixPollInterval);
      document.getElementById('pixStatusMsg').innerHTML = '<i class="fas fa-exclamation-circle"></i> Tempo expirado. Feche e tente novamente.';
      return;
    }

    try {
      const res = await fetch(`/api/check-pix-status?payment_id=${paymentId}`);
      const { status } = await res.json();

      if (status === 'approved') {
        clearInterval(_pixPollInterval);
        document.getElementById('pixContent').style.display = 'none';
        document.getElementById('pixPaidMsg').style.display = 'block';

        // Fallback: atualiza status no Firestore caso webhook não tenha chegado
        if (orderId && window.Firebase && window.Firebase.db && window.Firebase.fs) {
          const fs = window.Firebase.fs;
          fs.getDoc(fs.doc(window.Firebase.db, 'pedidos', orderId)).then(snap => {
            if (snap.exists() && snap.data().status === 'aguardando_pix') {
              fs.updateDoc(fs.doc(window.Firebase.db, 'pedidos', orderId), {
                status: 'pendente',
                paymentStatus: 'approved',
                atualizadoEm: fs.serverTimestamp()
              }).catch(() => {});
            }
          }).catch(() => {});
        }

        // Salva banner agora que pagamento foi confirmado
        const lastOrder = JSON.parse(sessionStorage.getItem('bm_last_order') || 'null');
        if (lastOrder) {
          localStorage.setItem('bm_active_order', JSON.stringify({
            orderId: lastOrder.orderId || orderId,
            numero: lastOrder.numero,
            delivery: lastOrder.delivery,
          }));
        }
        Store.clearCart();
        setTimeout(() => { window.location.href = `pedido-confirmado.html?status=success&orderId=${orderId}`; }, 2000);
      } else if (status === 'rejected' || status === 'cancelled') {
        clearInterval(_pixPollInterval);
        document.getElementById('pixStatusMsg').innerHTML = '<i class="fas fa-times-circle"></i> Pagamento recusado. Feche e tente novamente.';
        document.getElementById('pixStatusMsg').style.background = '#fff0f0';
        document.getElementById('pixStatusMsg').style.borderColor = '#f0a0a0';
        document.getElementById('pixStatusMsg').style.color = '#8b0000';
      }
    } catch (e) {
      // ignora erros de rede no polling
    }
  }, 5000);
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
