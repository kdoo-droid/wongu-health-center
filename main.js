/* ============================================
   WONGU HEALTH CENTER - Shared JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    if (mobileClose) {
      mobileClose.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // --- Header Scroll Effect ---
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item.active').forEach(i => {
        i.classList.remove('active');
      });

      // Toggle clicked
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

  // --- Scroll Reveal Animation ---
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach((el, i) => {
      el.style.transitionDelay = `${i % 3 * 100}ms`;
      observer.observe(el);
    });
  }

  // --- Active Nav Link ---
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

});
