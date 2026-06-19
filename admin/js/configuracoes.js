/* =====================================================================
   Bella Massa Admin — configuracoes.js
   Lê e salva configurações na coleção 'config' do Firestore.
   Documento: config/empresa, config/entrega, config/social, config/operacional
   ===================================================================== */

(function () {
  'use strict';

  /* ── Toast ── */
  function toast(msg, type) {
    type = type || 'success';
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const t = document.createElement('div');
    t.className = 'toast toast--' + type;
    const icons = { success: 'circle-check', error: 'circle-xmark', warning: 'triangle-exclamation', info: 'circle-info' };
    t.innerHTML = '<i class="fas fa-' + (icons[type] || 'circle-info') + '"></i><span>' + msg + '</span>';
    stack.prepend(t);
    requestAnimationFrame(() => t.classList.add('is-visible'));
    setTimeout(() => { t.classList.remove('is-visible'); setTimeout(() => t.remove(), 400); }, 3500);
  }

  /* ── Sidebar ── */
  const burgerBtn = document.getElementById('burgerBtn');
  const sidebar   = document.getElementById('sidebar');
  const backdrop  = document.getElementById('sidebarBackdrop');
  if (burgerBtn) burgerBtn.addEventListener('click', () => { sidebar.classList.toggle('is-open'); backdrop.classList.toggle('is-visible'); });
  if (backdrop)  backdrop.addEventListener('click', () => { sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible'); });

  /* ── Helpers ── */
  function getVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function setVal(id, val) { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; }
  function getChk(id) { const el = document.getElementById(id); return el ? el.checked : false; }
  function setChk(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; }

  /* ── Carregar configurações do Firestore ── */
  async function loadConfig() {
    if (!window.Firebase || !window.Firebase.db) return;
    const fs = window.Firebase.fs;
    const db = window.Firebase.db;

    const docs = ['empresa', 'entrega', 'social', 'operacional'];
    for (const docId of docs) {
      try {
        const snap = await fs.getDoc(fs.doc(db, 'config', docId));
        if (snap.exists()) {
          applyConfig(docId, snap.data());
        }
      } catch (e) {
        console.warn('Não foi possível carregar config/' + docId, e);
      }
    }
  }

  function applyConfig(docId, data) {
    if (docId === 'empresa') {
      setVal('cfgNomeEmpresa',    data.nome);
      setVal('cfgTelefone',       data.telefone);
      setVal('cfgWhatsapp',       data.whatsapp);
      setVal('cfgEndereco',       data.endereco);
      setVal('cfgHorario',        data.horario);
    }
    if (docId === 'entrega') {
      setVal('cfgTaxaEntrega',    data.taxaFixa);
      setVal('cfgPedidoMinimo',   data.pedidoMinimo);
      setVal('cfgRaioEntrega',    data.raio);
    }
    if (docId === 'social') {
      setVal('cfgInstagram',      data.instagram);
      setVal('cfgFacebook',       data.facebook);
      setVal('cfgTiktok',         data.tiktok);
    }
    if (docId === 'operacional') {
      setChk('cfgAceitarPedidos', data.aceitarPedidos);
      setChk('cfgNotificacoes',   data.notificacoes);
      setChk('cfgDelivery',       data.delivery);
      setChk('cfgBannerPromo',    data.bannerPromo);
    }
  }

  /* ── Salvar formulário ── */
  async function saveForm(btn) {
    if (!window.Firebase || !window.Firebase.db) { toast('Firebase indisponível.', 'error'); return; }
    const docId = btn.dataset.form;
    const label = btn.dataset.label || 'configurações';
    const orig  = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando…';

    let data = {};
    if (docId === 'empresa') {
      data = {
        nome:      getVal('cfgNomeEmpresa'),
        telefone:  getVal('cfgTelefone'),
        whatsapp:  getVal('cfgWhatsapp'),
        endereco:  getVal('cfgEndereco'),
        horario:   getVal('cfgHorario'),
      };
    } else if (docId === 'entrega') {
      data = {
        taxaFixa:      getVal('cfgTaxaEntrega'),
        raio:          getVal('cfgRaioEntrega') ? Number(getVal('cfgRaioEntrega')) : null,
      };
    } else if (docId === 'social') {
      data = {
        instagram: getVal('cfgInstagram'),
        facebook:  getVal('cfgFacebook'),
        tiktok:    getVal('cfgTiktok'),
      };
    } else if (docId === 'operacional') {
      data = {
        aceitarPedidos: getChk('cfgAceitarPedidos'),
        notificacoes:   getChk('cfgNotificacoes'),
        delivery:       getChk('cfgDelivery'),
        bannerPromo:    getChk('cfgBannerPromo'),
      };
    }

    try {
      const fs = window.Firebase.fs;
      await fs.setDoc(fs.doc(window.Firebase.db, 'config', docId), Object.assign(data, { atualizadoEm: fs.serverTimestamp() }), { merge: true });
      toast(label.charAt(0).toUpperCase() + label.slice(1) + ' salvas com sucesso!', 'success');
    } catch (err) {
      console.error('Erro ao salvar config:', err);
      toast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  }

  /* ── Toggle operacional — salva imediatamente ── */
  document.querySelectorAll('.toggle input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', async () => {
      const lbl = chk.closest('.toggle-wrap')?.querySelector('strong')?.textContent || 'Opção';
      toast(lbl + ': ' + (chk.checked ? 'ativado' : 'desativado'), chk.checked ? 'success' : 'warning');

      if (!window.Firebase || !window.Firebase.db) return;
      /* Mapeamento direto de ID para chave do Firestore */
      const keyMap = {
        'cfgAceitarPedidos': 'aceitarPedidos',
        'cfgNotificacoes': 'notificacoes',
        'cfgDelivery': 'delivery',
        'cfgBannerPromo': 'bannerPromo'
      };
      const key = keyMap[chk.id];
      if (!key) return;
      try {
        const fs = window.Firebase.fs;
        const update = {};
        update[key] = chk.checked;
        update['atualizadoEm'] = fs.serverTimestamp();
        await fs.setDoc(fs.doc(window.Firebase.db, 'config', 'operacional'), update, { merge: true });
      } catch (e) { console.warn('Erro ao salvar toggle:', e); toast('Erro ao salvar configuração.', 'error'); }
    });
  });

  /* ── Bind save buttons ── */
  document.querySelectorAll('.save-form-btn').forEach(btn => {
    btn.addEventListener('click', () => saveForm(btn));
  });

  /* ── Init com auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, user => {
      if (user) {
        loadConfig();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }
  initAfterAuth();

})();
