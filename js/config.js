/**
 * config.js — Bella Massa
 * Carrega configurações do Firestore e atualiza BM_CONFIG dinamicamente.
 */

(function () {
  'use strict';

  function loadConfigFromFirestore() {
    if (!window.Firebase || !window.Firebase.db) {
      setTimeout(loadConfigFromFirestore, 200);
      return;
    }

    const fs = window.Firebase.fs;
    const db = window.Firebase.db;

    // Carregar configuração de entrega
    fs.getDoc(fs.doc(db, 'config', 'entrega'))
      .then(function (snap) {
        if (snap.exists()) {
          const data = snap.data();
          if (data.taxaFixa) {
            BM_CONFIG.deliveryFee = parseFloat(data.taxaFixa) || BM_CONFIG.deliveryFee;
          }
          if (data.pedidoMinimo) {
            BM_CONFIG.minOrderDelivery = parseFloat(data.pedidoMinimo) || BM_CONFIG.minOrderDelivery;
          }
          if (data.raio) {
            BM_CONFIG.deliveryRadius = parseFloat(data.raio);
          }
          // Disparar evento para recalcular o carrinho
          window.dispatchEvent(new Event('configLoaded'));
        }
      })
      .catch(function (err) {
        console.warn('Erro ao carregar config de entrega:', err);
      });

    // Carregar configuração de empresa (WhatsApp, etc)
    fs.getDoc(fs.doc(db, 'config', 'empresa'))
      .then(function (snap) {
        if (snap.exists()) {
          const data = snap.data();
          if (data.whatsapp) {
            BM_CONFIG.whatsapp = data.whatsapp.replace(/\D/g, ''); // Apenas dígitos
          }
          if (data.endereco) {
            BM_CONFIG.address = data.endereco;
          }
          if (data.horario) {
            BM_CONFIG.openHours = data.horario;
          }
        }
      })
      .catch(function (err) {
        console.warn('Erro ao carregar config de empresa:', err);
      });
  }

  // Iniciar quando Firebase estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfigFromFirestore);
  } else {
    loadConfigFromFirestore();
  }
})();
