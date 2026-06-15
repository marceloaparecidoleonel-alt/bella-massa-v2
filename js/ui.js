/**
 * ui.js — Bella Massa
 * Componentes de UI compartilhados entre todas as páginas.
 * Header sticky, toast, mini-cart badge, smooth scroll.
 */

// ── Header sticky / hide-on-scroll ──────────────────────────────────────────
function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  let lastY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > 80) {
          header.classList.add('header--scrolled');
          if (y > lastY + 6) {
            header.classList.add('header--hidden');
          } else if (y < lastY - 6) {
            header.classList.remove('header--hidden');
          }
        } else {
          header.classList.remove('header--scrolled', 'header--hidden');
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ── Mobile hamburger menu ────────────────────────────────────────────────────
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.header__nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('nav--open');
    hamburger.classList.toggle('hamburger--active', open);
    hamburger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('body--no-scroll', open);
  });

  nav.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      hamburger.classList.remove('hamburger--active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('body--no-scroll');
    });
  });

  document.addEventListener('click', e => {
    if (!header?.contains(e.target) && nav.classList.contains('nav--open')) {
      nav.classList.remove('nav--open');
      hamburger.classList.remove('hamburger--active');
      document.body.classList.remove('body--no-scroll');
    }
  });
}

// ── Active nav link by current page ─────────────────────────────────────────
function setActiveNavLink() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const linkPage = href.split('/').pop();
    link.classList.toggle('nav__link--active', linkPage === page || (page === '' && linkPage === 'index.html'));
  });
}

// ── Toast notification ───────────────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-circle-exclamation', info: 'fa-circle-info' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('toast--visible'));

  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, duration);
}

// ── Intersection Observer reveal ─────────────────────────────────────────────
function observeReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}

// ── Smooth scroll for anchor links ──────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ── Footer year ──────────────────────────────────────────────────────────────
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

// ── Init all shared UI ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  setActiveNavLink();
  initSmoothScroll();
  setFooterYear();
  setTimeout(observeReveal, 80);
});
