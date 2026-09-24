/* ============================================
   WONGU HEALTH CENTER - Shared JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // --- Mobile Navigation ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileClose = document.querySelector('.mobile-close');

  if (mobileToggle && mobileMenu) {
    const focusableSelectors = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openMenu() {
      mobileMenu.classList.add('active');
      document.body.style.overflow = 'hidden';
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      // Move focus into the menu
      const firstFocusable = mobileMenu.querySelector(focusableSelectors);
      if (firstFocusable) firstFocusable.focus();
    }

    function closeMenu() {
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      mobileToggle.focus();
    }

    // Trap focus within the open menu
    mobileMenu.addEventListener('keydown', e => {
      if (!mobileMenu.classList.contains('active')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(mobileMenu.querySelectorAll(focusableSelectors));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    mobileToggle.addEventListener('click', openMenu);

    if (mobileClose) {
      mobileClose.setAttribute('aria-label', 'Close menu');
      mobileClose.addEventListener('click', closeMenu);
    }

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Initial ARIA state
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  // --- Header Scroll Effect ---
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

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
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || /^(tel:|sms:|mailto:|https?:)/.test(href)) return;

    const linkPath = href.split('#')[0].replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach((btn, idx) => {
    const item = btn.closest('.faq-item');
    const answer = item.querySelector('.faq-answer');
    const answerId = 'faq-answer-' + idx;
    answer.id = answerId;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', answerId);

    btn.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item.active').forEach(openItem => {
        openItem.classList.remove('active');
        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked
      if (!wasActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- Team Carousel: clone cards at runtime for seamless infinite scroll ---
  document.querySelectorAll('.team-carousel-track').forEach(function(track) {
    var cards = Array.from(track.children);
    cards.forEach(function(card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  });

  // --- Conversion Tracking ---
  // Fires gtag events when visitors click key CTAs.
  function trackEvent(action, label) {
    if (typeof gtag === 'function') {
      gtag('event', action, { event_category: 'CTA', event_label: label });
    }
  }

  document.querySelectorAll('a[href^="tel:"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('phone_call', el.textContent.trim()));
  });
  document.querySelectorAll('a[href^="sms:"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('sms_click', el.textContent.trim()));
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
    el.addEventListener('click', () => trackEvent('email_click', el.getAttribute('href')));
  });
  document.querySelectorAll('.online-booking-btn').forEach(el => {
    el.addEventListener('click', () => trackEvent('online_booking_click', el.textContent.trim()));
  });

  // --- Online Booking Confirmation Modal ---
  // Online booking is for self-pay patients only. VA/insurance patients need
  // to call so the front desk can confirm eligibility before scheduling.
  const bookingTriggers = document.querySelectorAll('a.online-booking-btn[href*="patient.unifiedpractice.com"]');
  if (bookingTriggers.length) {
    const bookingOverlay = document.createElement('div');
    bookingOverlay.className = 'booking-modal-overlay';
    bookingOverlay.setAttribute('role', 'dialog');
    bookingOverlay.setAttribute('aria-modal', 'true');
    bookingOverlay.setAttribute('aria-labelledby', 'bookingModalTitle');
    bookingOverlay.innerHTML = `
      <div class="booking-modal">
        <button type="button" class="booking-modal-close" aria-label="Close">&times;</button>
        <h3 id="bookingModalTitle">Before You Book Online</h3>
        <p>Online booking is for <strong>self-pay</strong> patients.</p>
        <p>If you plan to use <strong>VA or Culinary insurance</strong> (not self-pay), please call our office instead so we can confirm your eligibility and match you with a credentialed provider.</p>
        <div class="booking-modal-actions">
          <a href="tel:+17028521280" class="btn btn-secondary btn-full">Call (702) 852-1280</a>
          <button type="button" class="btn btn-primary btn-full">Book Your Appointment</button>
        </div>
      </div>
    `;
    document.body.appendChild(bookingOverlay);

    const bookingClose = bookingOverlay.querySelector('.booking-modal-close');
    const bookingCall = bookingOverlay.querySelector('a[href^="tel:"]');
    const bookingContinue = bookingOverlay.querySelector('.booking-modal-actions button');
    let pendingBookingUrl = null;
    let bookingLastFocused = null;

    function openBookingModal(url, trigger) {
      pendingBookingUrl = url;
      bookingLastFocused = trigger;
      bookingOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      bookingClose.focus();
    }

    function closeBookingModal() {
      bookingOverlay.classList.remove('active');
      document.body.style.overflow = '';
      pendingBookingUrl = null;
      if (bookingLastFocused) bookingLastFocused.focus();
    }

    bookingTriggers.forEach(trigger => {
      trigger.addEventListener('click', e => {
        e.preventDefault();
        openBookingModal(trigger.href, trigger);
      });
    });

    bookingClose.addEventListener('click', closeBookingModal);

    bookingCall.addEventListener('click', () => {
      trackEvent('phone_call', bookingCall.textContent.trim());
      closeBookingModal();
    });

    bookingOverlay.addEventListener('click', e => {
      if (e.target === bookingOverlay) closeBookingModal();
    });

    bookingOverlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') { closeBookingModal(); return; }
      if (e.key !== 'Tab') return;
      const focusable = bookingOverlay.querySelectorAll('a[href], button:not([disabled])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    bookingContinue.addEventListener('click', () => {
      const url = pendingBookingUrl;
      closeBookingModal();
      if (url) {
        trackEvent('online_booking_confirmed', 'Booking Modal Continue');
        window.open(url, '_blank', 'noopener');
      }
    });
  }

});
