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
    let inertRoots = [];

    if (!mobileMenu.id) mobileMenu.id = 'mobile-menu';
    mobileToggle.setAttribute('aria-controls', mobileMenu.id);

    // iOS Safari ignores overflow:hidden on <body> alone, so lock <html> too
    function setScrollLock(locked) {
      document.documentElement.style.overflow = locked ? 'hidden' : '';
      document.body.style.overflow = locked ? 'hidden' : '';
    }

    function openMenu() {
      inertRoots = Array.from(document.body.children).filter(el => el !== mobileMenu && !el.contains(mobileMenu));
      inertRoots.forEach(el => { el.inert = true; });
      mobileMenu.classList.add('active');
      setScrollLock(true);
      mobileToggle.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
      // Move focus into the menu
      const firstFocusable = mobileMenu.querySelector(focusableSelectors);
      if (firstFocusable) firstFocusable.focus();
    }

    function closeMenu(restoreFocus = true) {
      if (!mobileMenu.classList.contains('active')) return;
      mobileMenu.classList.remove('active');
      setScrollLock(false);
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      inertRoots.forEach(el => { el.inert = false; });
      inertRoots = [];
      if (restoreFocus) mobileToggle.focus();
    }

    // If the screen widens past the collapsed-nav breakpoint (e.g. rotating a
    // tablet), close the overlay so it can't linger over the desktop nav.
    const wideNav = window.matchMedia('(min-width: 1200px)');
    const onWide = e => { if (e.matches) closeMenu(false); };
    if (wideNav.addEventListener) wideNav.addEventListener('change', onWide);

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
      // The booking link opens the confirmation dialog, which manages focus itself
      link.addEventListener('click', () => closeMenu(!link.classList.contains('online-booking-btn')));
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
    }, { passive: true });
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
        openItem.querySelector('.faq-answer').style.maxHeight = '';
      });

      // Toggle clicked. Size to the content so long answers aren't clipped on narrow screens.
      if (!wasActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
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
  // data-booking-direct: booking links that skip the English confirmation dialog (es.html)
  document.querySelectorAll('.online-booking-btn, [data-booking-direct]').forEach(el => {
    el.addEventListener('click', () => trackEvent('online_booking_click', el.textContent.trim()));
  });

  // --- Online Booking Routing Modal ---
  // Online booking is for self-pay patients only. VA Community Care/Culinary
  // patients need to contact the clinic so eligibility can be verified first.
  // The insurance wording below is generated from data/clinic.js (npm run build).
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
        <h3 id="bookingModalTitle">How Would You Like to Schedule?</h3>
        <p class="booking-intro">Choose the path that matches how your visit will be paid for.</p>
        <div class="booking-route booking-route-primary">
          <h4>Self-pay patients</h4>
          <p>Book online and choose a licensed OMD or supervised student intern on the next screen.</p>
          <button type="button" class="btn btn-primary btn-full booking-continue">Continue to Online Booking</button>
        </div>
        <div class="booking-route">
          <h4>VA Community Care or Culinary Health Fund</h4>
          <p>Contact us first so we can verify eligibility, authorization, and provider availability.</p>
          <a href="/contact.html#contact-form" class="btn btn-secondary btn-full">Verify Eligibility</a>
        </div>
        <details class="booking-details">
          <summary>Important booking information</summary>
          <div>
            <p><strong>One appointment per patient per day.</strong> Duplicate appointments may be canceled and late-cancellation fees may apply.</p>
            <p><strong>Booking for someone else?</strong> Each patient needs a separate account and completed intake forms.</p>
            <p>Not sure whom to choose? <a href="sms:+17025509483">Text 702-550-9483</a> or call us and we'll help.</p>
          </div>
        </details>
        <div class="booking-modal-actions">
          <a href="tel:+17028521280" class="btn btn-secondary btn-full">Call (702) 852-1280</a>
        </div>
      </div>
    `;
    document.body.appendChild(bookingOverlay);

    const bookingClose = bookingOverlay.querySelector('.booking-modal-close');
    const bookingCall = bookingOverlay.querySelector('a[href^="tel:"]');
    const bookingContinue = bookingOverlay.querySelector('.booking-continue');
    let pendingBookingUrl = null;
    let bookingLastFocused = null;

    function openBookingModal(url, trigger) {
      pendingBookingUrl = url;
      bookingLastFocused = trigger;
      bookingOverlay.classList.add('active');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      bookingClose.focus();
    }

    function closeBookingModal() {
      bookingOverlay.classList.remove('active');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      pendingBookingUrl = null;
      // The trigger may be inside the (now closed) mobile menu; fall back to the menu button
      const target = bookingLastFocused && bookingLastFocused.offsetParent !== null ? bookingLastFocused : document.querySelector('.mobile-toggle');
      if (target && target.offsetParent !== null) target.focus();
    }

    bookingTriggers.forEach(trigger => {
      trigger.addEventListener('click', e => {
        if (sessionStorage.getItem('wongu-booking-route') === 'self-pay') return;
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
      sessionStorage.setItem('wongu-booking-route', 'self-pay');
      closeBookingModal();
      if (url) {
        trackEvent('online_booking_confirmed', 'Booking Modal Continue');
        window.open(url, '_blank', 'noopener');
      }
    });
  }

  // --- Desktop dropdown menus ---
  // CSS opens them on hover; this adds click/tap (touch screens), Escape, and click-outside.
  document.documentElement.classList.add('js');
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');
  function closeDropdowns(except) {
    dropdownToggles.forEach(t => { if (t !== except) t.setAttribute('aria-expanded', 'false'); });
  }
  dropdownToggles.forEach(toggle => {
    const item = toggle.closest('.has-dropdown');
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(toggle);
      toggle.setAttribute('aria-expanded', String(open));
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    item.addEventListener('focusout', e => {
      if (!item.contains(e.relatedTarget)) toggle.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-dropdown')) closeDropdowns();
  });

  // --- Product Page: variant toggle + photo thumbnails ---
  // Without JS every variant and photo simply shows stacked; these only hide/show.
  document.querySelectorAll('[data-product]').forEach(product => {
    const selectors = product.querySelectorAll('[data-select]');
    function selectVariant(name) {
      product.dataset.active = name;
      selectors.forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.select === name)));
    }
    selectors.forEach(btn => btn.addEventListener('click', () => {
      selectVariant(btn.dataset.select);
      trackEvent('product_variant', btn.dataset.select);
    }));
    product.querySelector('.product-variants')?.removeAttribute('hidden');
    if (selectors.length) selectVariant(selectors[0].dataset.select);

    product.querySelectorAll('.product-gallery-set').forEach(set => {
      const slides = set.querySelectorAll('.product-slide');
      const thumbs = set.querySelectorAll('.product-thumb');
      function showSlide(i) {
        slides.forEach((s, n) => { s.hidden = n !== i; });
        thumbs.forEach((t, n) => t.setAttribute('aria-pressed', String(n === i)));
      }
      thumbs.forEach((t, n) => t.addEventListener('click', () => showSlide(n)));
      set.querySelector('.product-thumbs')?.removeAttribute('hidden');
      showSlide(0);
    });
  });

});
