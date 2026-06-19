/* =====================================================================
   Bella Massa Admin — produtos.js
   CRUD completo de produtos via Firestore.
   O grid é renderizado em tempo real via onSnapshot.
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

  /* ── State ── */
  let currentFilter = 'todos';
  let currentSearch = '';
  let editingId     = null;

  const CATEGORIES = {
    paes:     'Pães',
    bolos:    'Bolos',
    doces:    'Doces',
    salgados: 'Salgados',
    bebidas:  'Bebidas',
  };

  /* ── Render card ── */
  function renderCard(p) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.cat = p.categoria || '';
    card.dataset.id  = p.id;

    const badgeClass = p.ativo ? 'badge--success' : 'badge--muted';
    const badgeLabel = p.ativo ? 'Ativo' : 'Inativo';
    const catName    = CATEGORIES[p.categoria] || p.categoria || '—';
    const price      = typeof p.preco === 'number'
      ? p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : '—';

    card.innerHTML =
      '<div class="product-card__img">' +
        '<img src="' + (p.imagem || 'https://via.placeholder.com/400x300?text=Sem+Foto') + '" alt="' + p.nome + '" loading="lazy" />' +
        '<div class="product-card__badge"><span class="badge ' + badgeClass + '">' + badgeLabel + '</span></div>' +
        '<div class="product-card__img-overlay">' +
          '<button class="abtn abtn--sm edit-btn" data-id="' + p.id + '" title="Editar" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);"><i class="fas fa-pen"></i></button>' +
          '<button class="abtn abtn--sm delete-btn" data-id="' + p.id + '" title="Excluir" style="background:rgba(217,64,64,0.7);color:#fff;border:none;"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>' +
      '<div class="product-card__body">' +
        '<div class="product-card__cat">' + catName + '</div>' +
        '<div class="product-card__name">' + p.nome + '</div>' +
        '<div class="product-card__desc">' + (p.descricao || '') + '</div>' +
        '<div class="product-card__footer">' +
          '<span class="product-card__price">' + price + '</span>' +
          '<div class="product-card__actions">' +
            '<button class="abtn abtn--sm abtn--secondary edit-btn" data-id="' + p.id + '" title="Editar"><i class="fas fa-pen"></i></button>' +
            '<button class="abtn abtn--sm toggle-btn" data-id="' + p.id + '" data-ativo="' + p.ativo + '" title="' + (p.ativo ? 'Desativar' : 'Ativar') + '" style="' + (p.ativo ? 'color:var(--a-gold);' : 'color:var(--a-text-muted);') + '"><i class="fas ' + (p.ativo ? 'fa-eye' : 'fa-eye-slash') + '"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';

    return card;
  }

  /* ── Populate grid ── */
  const productGrid = document.getElementById('productGrid');
  let allProducts = [];

  function applyFilters() {
    if (!productGrid) return;
    productGrid.innerHTML = '';

    const filtered = allProducts.filter(p => {
      const matchCat = currentFilter === 'todos' || p.categoria === currentFilter;
      const matchQ   = !currentSearch || (p.nome + ' ' + (p.descricao || '')).toLowerCase().includes(currentSearch);
      return matchCat && matchQ;
    });

    if (filtered.length === 0) {
      productGrid.innerHTML = '<p style="color:var(--a-text-muted);padding:2rem;grid-column:1/-1;">Nenhum produto encontrado.</p>';
      return;
    }

    filtered.forEach((p, i) => {
      const card = renderCard(p);
      card.style.opacity = '0';
      card.style.transform = 'translateY(18px)';
      card.style.transition = 'opacity 350ms ease ' + (i * 50) + 'ms, transform 350ms ease ' + (i * 50) + 'ms';
      productGrid.appendChild(card);
      requestAnimationFrame(() => { card.style.opacity = '1'; card.style.transform = 'none'; });
    });
  }

  /* ── Category filter ── */
  const catFilters = document.getElementById('catFilters');
  if (catFilters) {
    catFilters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      catFilters.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      currentFilter = chip.dataset.cat || 'todos';
      applyFilters();
    });
  }

  /* ── Search ── */
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.toLowerCase();
      applyFilters();
    });
  }

  /* ── Delegated clicks (edit / delete / toggle) ── */
  if (productGrid) {
    productGrid.addEventListener('click', e => {
      const editBtn   = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');
      const toggleBtn = e.target.closest('.toggle-btn');

      if (editBtn)   { openEditModal(editBtn.dataset.id); return; }
      if (deleteBtn) { confirmDelete(deleteBtn.dataset.id); return; }
      if (toggleBtn) { toggleActive(toggleBtn.dataset.id, toggleBtn.dataset.ativo === 'true'); return; }
    });
  }

  /* ── Modal ── */
  const modal         = document.getElementById('productModal');
  const titleEl       = document.getElementById('productModalTitle');
  const form          = document.getElementById('productForm');
  const imgInput      = document.getElementById('fieldImagem');
  const imgPreview    = document.getElementById('imgPreview');
  const imgFileInput  = document.getElementById('fieldImagemFile');
  const imgUploadArea = document.getElementById('imgUploadArea');
  const imgPlaceholder= document.getElementById('imgUploadPlaceholder');
  const imgRemoveBtn  = document.getElementById('imgRemoveBtn');
  const openBtn       = document.getElementById('openProductModal');
  const newProdBtn    = document.getElementById('newProductBtn');
  const closeBtn      = document.getElementById('closeProductModal');
  const cancelBtn     = document.getElementById('cancelProductModal');
  const saveBtn       = document.getElementById('saveProduct');

  /* ── Controle de imagem ── */
  let currentImageBase64 = null; // base64 da imagem selecionada via arquivo

  function setImagePreview(src) {
    if (!imgPreview) return;
    imgPreview.src = src;
    imgPreview.style.display = 'block';
    if (imgPlaceholder) imgPlaceholder.style.display = 'none';
    if (imgRemoveBtn)  imgRemoveBtn.style.display = 'flex';
    if (imgUploadArea) imgUploadArea.classList.add('has-image');
  }

  function clearImagePreview() {
    if (imgPreview)    { imgPreview.src = ''; imgPreview.style.display = 'none'; }
    if (imgPlaceholder) imgPlaceholder.style.display = 'flex';
    if (imgRemoveBtn)  imgRemoveBtn.style.display = 'none';
    if (imgUploadArea) imgUploadArea.classList.remove('has-image');
    currentImageBase64 = null;
    if (imgInput) imgInput.value = '';
  }

  function processImageFile(file) {
    if (!file || !file.type.startsWith('image/')) { toast('Selecione um arquivo de imagem.', 'warning'); return; }
    if (file.size > 2 * 1024 * 1024) { toast('Imagem muito grande. Máx. 2MB.', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      currentImageBase64 = e.target.result;
      if (imgInput) imgInput.value = ''; // limpa URL ao usar arquivo
      setImagePreview(currentImageBase64);
    };
    reader.readAsDataURL(file);
  }

  // Clique na área abre seletor de arquivo
  if (imgUploadArea) {
    imgUploadArea.addEventListener('click', e => {
      if (e.target.closest('#imgRemoveBtn')) return;
      imgFileInput && imgFileInput.click();
    });
  }

  // Seleção via input file
  if (imgFileInput) {
    imgFileInput.addEventListener('change', () => {
      if (imgFileInput.files[0]) processImageFile(imgFileInput.files[0]);
    });
  }

  // Drag and drop
  if (imgUploadArea) {
    imgUploadArea.addEventListener('dragover', e => { e.preventDefault(); imgUploadArea.classList.add('drag-over'); });
    imgUploadArea.addEventListener('dragleave', () => imgUploadArea.classList.remove('drag-over'));
    imgUploadArea.addEventListener('drop', e => {
      e.preventDefault();
      imgUploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processImageFile(file);
    });
  }

  // Remover imagem
  if (imgRemoveBtn) {
    imgRemoveBtn.addEventListener('click', e => { e.stopPropagation(); clearImagePreview(); });
  }

  // URL manual atualiza preview (e limpa base64)
  if (imgInput) {
    imgInput.addEventListener('input', () => {
      const url = imgInput.value.trim();
      if (url) { currentImageBase64 = null; setImagePreview(url); }
      else     { clearImagePreview(); }
    });
  }

  function openNewModal() {
    editingId = null;
    if (titleEl) titleEl.textContent = 'Novo Produto';
    if (form) form.reset();
    clearImagePreview();
    if (modal) modal.classList.add('is-open');
  }

  function openEditModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    if (titleEl) titleEl.textContent = 'Editar Produto';

    document.getElementById('fieldNome').value      = p.nome || '';
    document.getElementById('fieldCategoria').value = p.categoria || '';
    document.getElementById('fieldPreco').value     = p.preco != null ? p.preco.toFixed(2).replace('.', ',') : '';
    document.getElementById('fieldDescricao').value = p.descricao || '';
    document.getElementById('fieldDescCurta').value = p.descCurta || '';
    document.getElementById('fieldImagem').value    = p.imagem || '';
    document.getElementById('fieldPeso').value      = p.peso || '';
    document.getElementById('fieldDestaque').checked = !!p.destaque;
    document.getElementById('fieldAtivo').value     = p.ativo ? '1' : '0';
    document.getElementById('fieldOrdem').value     = p.ordem != null ? p.ordem : '';

    currentImageBase64 = null;
    if (p.imagem) setImagePreview(p.imagem);
    else clearImagePreview();

    if (modal) modal.classList.add('is-open');
  }

  function closeModal() { if (modal) modal.classList.remove('is-open'); editingId = null; clearImagePreview(); }

  if (openBtn)    openBtn.addEventListener('click', openNewModal);
  if (newProdBtn) newProdBtn.addEventListener('click', openNewModal);
  if (closeBtn)   closeBtn.addEventListener('click', closeModal);
  if (cancelBtn)  cancelBtn.addEventListener('click', closeModal);
  if (modal)      modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });


  /* ── Save ── */
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!window.Firebase || !window.Firebase.db) { toast('Firebase não disponível.', 'error'); return; }

      const nome      = (document.getElementById('fieldNome')?.value || '').trim();
      const categoria = (document.getElementById('fieldCategoria')?.value || '').trim();
      const precoRaw  = (document.getElementById('fieldPreco')?.value || '').replace(',', '.').replace(/[^\d.]/g, '');
      const preco     = parseFloat(precoRaw);

      if (!nome)              { document.getElementById('fieldNome').style.borderColor      = 'var(--a-danger)'; toast('Nome obrigatório.', 'warning'); return; }
      if (!categoria)         { document.getElementById('fieldCategoria').style.borderColor = 'var(--a-danger)'; toast('Categoria obrigatória.', 'warning'); return; }
      if (isNaN(preco) || preco <= 0) { document.getElementById('fieldPreco').style.borderColor = 'var(--a-danger)'; toast('Preço inválido.', 'warning'); return; }

      ['fieldNome', 'fieldCategoria', 'fieldPreco'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = '';
      });

      const ativoVal = document.getElementById('fieldAtivo')?.value;
      const data = {
        nome,
        categoria,
        preco,
        descricao:  (document.getElementById('fieldDescricao')?.value || '').trim(),
        descCurta:  (document.getElementById('fieldDescCurta')?.value || '').trim(),
        imagem:     currentImageBase64 || (document.getElementById('fieldImagem')?.value || '').trim(),
        peso:       (document.getElementById('fieldPeso')?.value      || '').trim(),
        destaque:   !!document.getElementById('fieldDestaque')?.checked,
        ativo:      ativoVal !== '0',
        ordem:      parseInt(document.getElementById('fieldOrdem')?.value || '0') || 0,
        atualizadoEm: window.Firebase.fs.serverTimestamp(),
      };

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando…';

      try {
        const fs = window.Firebase.fs;
        const db = window.Firebase.db;
        if (editingId) {
          await fs.updateDoc(fs.doc(db, 'produtos', editingId), data);
          toast('Produto atualizado!', 'success');
        } else {
          data.criadoEm = fs.serverTimestamp();
          await fs.addDoc(fs.collection(db, 'produtos'), data);
          toast('Produto criado!', 'success');
        }
        closeModal();
      } catch (err) {
        console.error('Erro ao salvar produto:', err);
        const isPermission = err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission'));
        const msg = isPermission
          ? 'Sem permissão. Configure as Regras do Firestore no Firebase Console (ver FIREBASE_SETUP.md).'
          : 'Erro ao salvar produto: ' + err.message;
        toast(msg, 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvar produto';
      }
    });
  }

  /* ── Delete ── */
  async function confirmDelete(id) {
    if (!confirm('Excluir este produto permanentemente?')) return;
    if (!window.Firebase || !window.Firebase.db) { toast('Firebase não disponível.', 'error'); return; }
    try {
      const fs = window.Firebase.fs;
      await fs.deleteDoc(fs.doc(window.Firebase.db, 'produtos', id));
      toast('Produto excluído.', 'warning');
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      toast('Erro ao excluir produto.', 'error');
    }
  }

  /* ── Toggle ativo ── */
  async function toggleActive(id, currentlyActive) {
    if (!window.Firebase || !window.Firebase.db) { toast('Firebase não disponível.', 'error'); return; }
    try {
      const fs = window.Firebase.fs;
      await fs.updateDoc(fs.doc(window.Firebase.db, 'produtos', id), {
        ativo: !currentlyActive,
        atualizadoEm: fs.serverTimestamp(),
      });
      toast(!currentlyActive ? 'Produto ativado.' : 'Produto desativado.', 'info');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      toast('Erro ao alterar status.', 'error');
    }
  }

  /* ── Firestore listener ── */
  function initListener() {
    if (!window.Firebase || !window.Firebase.db) {
      console.warn('⚠️ Firebase indisponível');
      if (productGrid) productGrid.innerHTML = '<p style="color:var(--a-text-muted);padding:2rem;grid-column:1/-1;">Firebase indisponível.</p>';
      return;
    }
    const fs = window.Firebase.fs;
    const q  = fs.query(fs.collection(window.Firebase.db, 'produtos'), fs.orderBy('ordem'));
    fs.onSnapshot(q, snapshot => {
      allProducts = snapshot.docs.map(d => Object.assign({ id: d.id }, d.data()));
      allProducts.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || (a.nome || '').localeCompare(b.nome || ''));
      applyFilters();
      const total = document.getElementById('totalProdutos');
      if (total) total.textContent = allProducts.length;
    }, err => {
      console.error('Erro ao carregar produtos:', err);
      toast('Erro ao carregar produtos.', 'error');
    });
  }

  /* ── Init com auth ── */
  function initAfterAuth() {
    if (!window.Firebase || !window.Firebase.authApi) { setTimeout(initAfterAuth, 200); return; }
    window.Firebase.authApi.onAuthStateChanged(window.Firebase.auth, user => {
      if (user) {
        initListener();
      } else {
        window.location.href = 'admin-login.html';
      }
    });
  }
  initAfterAuth();

})();
