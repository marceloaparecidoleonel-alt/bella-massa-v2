/**
 * config.js — Bella Massa
 * Carrega configurações do Firestore e atualiza BM_CONFIG dinamicamente.
 * Também atualiza elementos do DOM (WhatsApp, redes sociais, endereço, horário).
 */

(function () {
  'use strict';

  /* ── Formata número para exibição ── */
  function formatPhone(digits) {
    if (digits.length === 13) return '(' + digits.slice(2,4) + ') ' + digits.slice(4,9) + '-' + digits.slice(9);
    if (digits.length === 12) return '(' + digits.slice(2,4) + ') ' + digits.slice(4,8) + '-' + digits.slice(8);
    if (digits.length === 11) return '(' + digits.slice(0,2) + ') ' + digits.slice(2,7) + '-' + digits.slice(7);
    if (digits.length === 10) return '(' + digits.slice(0,2) + ') ' + digits.slice(2,6) + '-' + digits.slice(6);
    return digits;
  }

  /* ── Atualiza todos os links de WhatsApp na página ── */
  function applyWhatsApp(number) {
    if (!number) return;
    var clean = number.replace(/\D/g, '');
    var formatted = formatPhone(clean);
    // Links href wa.me — atualiza href preservando query text
    document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) {
      try {
        var url = new URL(a.href);
        var text = url.searchParams.get('text') || '';
        a.href = 'https://wa.me/' + clean + (text ? '?text=' + encodeURIComponent(text) : '');
      } catch (e) {
        a.href = 'https://wa.me/' + clean;
      }
    });
    // Textos visíveis de número (footer__info)
    document.querySelectorAll('.footer__info a[href*="wa.me"]').forEach(function (a) {
      if (/^\(\d{2}\)/.test(a.textContent.trim()) || /^\d{2,}/.test(a.textContent.trim())) {
        a.textContent = formatted;
      }
    });
    // contato.html — âncora texto WhatsApp em contato__item-text
    document.querySelectorAll('.contato__item-text a[href*="wa.me"]').forEach(function (a) {
      a.textContent = formatted;
    });
    // contato.html — parágrafos com IDs específicos
    var waNum = document.getElementById('contatoWaNumero');
    if (waNum) waNum.textContent = formatted + ' — Resposta rápida';
  }

  /* ── Atualiza redes sociais no footer ── */
  function applySocial(social) {
    if (!social) return;
    if (social.instagram) {
      document.querySelectorAll('a[aria-label="Instagram"].social__link, a[aria-label="instagram"].social__link').forEach(function (a) {
        a.href = social.instagram;
      });
    }
    if (social.facebook) {
      document.querySelectorAll('a[aria-label="Facebook"].social__link, a[aria-label="facebook"].social__link').forEach(function (a) {
        a.href = social.facebook;
      });
    }
    if (social.tiktok) {
      document.querySelectorAll('a[aria-label="TikTok"].social__link, a[aria-label="tiktok"].social__link').forEach(function (a) {
        a.href = social.tiktok;
      });
    }
  }

  /* ── Atualiza endereço e horário no footer e páginas ── */
  function applyEmpresa(data) {
    if (!data) return;

    if (data.nome) {
      BM_CONFIG.storeName = data.nome;
      // Header — .logo__name em todas as páginas
      document.querySelectorAll('.logo__name').forEach(function (el) {
        el.textContent = data.nome;
      });
      // Footer logo — span.footer__logo (contém ícone + texto direto)
      // Ignora elementos que já têm .logo__name interno (tratado pelo seletor acima)
      document.querySelectorAll('.footer__logo').forEach(function (el) {
        if (el.querySelector('.logo__name')) return; // já atualizado acima
        var icon = el.querySelector('i');
        if (icon) {
          el.textContent = ' ' + data.nome;
          el.insertBefore(icon, el.firstChild);
        } else {
          el.textContent = data.nome;
        }
      });
      // Footer bottom — texto de copyright (ex: "© 2024 Bella Massa. Todos...")
      document.querySelectorAll('.footer__bottom-inner p').forEach(function (p) {
        p.innerHTML = p.innerHTML.replace(/Bella Massa/g, data.nome);
      });
      // <title> da aba — substitui "Bella Massa" pelo nome configurado
      if (document.title) {
        document.title = document.title.replace(/Bella Massa/g, data.nome);
      }
    }
    if (data.whatsapp) {
      BM_CONFIG.whatsapp = data.whatsapp.replace(/\D/g, '');
      applyWhatsApp(data.whatsapp);
    }
    if (data.endereco) {
      BM_CONFIG.address = data.endereco;
      // Footer index.html
      document.querySelectorAll('.footer__info li').forEach(function (li) {
        if (li.querySelector('.fa-location-dot')) {
          var span = li.querySelector('span');
          if (span) span.textContent = data.endereco;
        }
      });
      // contato.html — elemento com ID
      var contatoEnd = document.getElementById('contatoEndereco');
      if (contatoEnd) contatoEnd.textContent = data.endereco;
    }
    if (data.horario) {
      BM_CONFIG.openHours = data.horario;
      // Footer index.html
      document.querySelectorAll('.footer__info li').forEach(function (li) {
        if (li.querySelector('.fa-clock')) {
          var span = li.querySelector('span');
          if (span) span.innerHTML = data.horario;
        }
      });
      // contato.html — elemento com ID
      var contatoHor = document.getElementById('contatoHorario');
      if (contatoHor) contatoHor.innerHTML = data.horario;
    }
    if (data.telefone) {
      var telClean = data.telefone.replace(/\D/g, '');
      var telFormatted = formatPhone(telClean);
      // Links tel:
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.href = 'tel:+55' + telClean;
      });
      // contato.html — parágrafo com ID
      var telNum = document.getElementById('contatoTelNumero');
      if (telNum) telNum.textContent = telFormatted + ' \u2014 Seg. a Sex. 7h\u201320h';
    }
  }

  function loadConfigFromFirestore() {
    if (!window.Firebase || !window.Firebase.db) {
      setTimeout(loadConfigFromFirestore, 200);
      return;
    }

    var fs = window.Firebase.fs;
    var db = window.Firebase.db;

    // Carregar configuração de entrega
    fs.getDoc(fs.doc(db, 'config', 'entrega'))
      .then(function (snap) {
        console.log('🔍 [CONFIG] Documento config/entrega:', snap.exists());
        if (snap.exists()) {
          var data = snap.data();
          console.log('🔍 [CONFIG] Dados do documento:', data);
          if (data.taxaFixa) {
            BM_CONFIG.deliveryFee = parseFloat(data.taxaFixa) || BM_CONFIG.deliveryFee;
            console.log('🔍 [CONFIG] Taxa de entrega atualizada:', BM_CONFIG.deliveryFee);
          }
          if (data.pedidoMinimo) {
            BM_CONFIG.minOrderDelivery = parseFloat(data.pedidoMinimo) || BM_CONFIG.minOrderDelivery;
          }
          if (data.raio) {
            BM_CONFIG.deliveryRadius = parseFloat(data.raio);
          }
          window.dispatchEvent(new Event('configLoaded'));
        } else {
          console.log('🔍 [CONFIG] Documento config/entrega não existe, usando valor padrão:', BM_CONFIG.deliveryFee);
        }
      })
      .catch(function (err) {
        console.warn('Erro ao carregar config de entrega:', err);
      });

    // Carregar configuração de empresa
    fs.getDoc(fs.doc(db, 'config', 'empresa'))
      .then(function (snap) {
        if (snap.exists()) {
          applyEmpresa(snap.data());
        }
      })
      .catch(function (err) {
        console.warn('Erro ao carregar config de empresa:', err);
      });

    // Carregar redes sociais
    fs.getDoc(fs.doc(db, 'config', 'social'))
      .then(function (snap) {
        if (snap.exists()) {
          applySocial(snap.data());
        }
      })
      .catch(function (err) {
        console.warn('Erro ao carregar config social:', err);
      });
  }

  // Iniciar quando Firebase estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfigFromFirestore);
  } else {
    loadConfigFromFirestore();
  }
})();
