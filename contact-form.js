// Contact form behavior for general questions and herbal formula requests.
(function() {
  var form = document.getElementById('contactForm');
  var success = document.getElementById('formSuccess');
  var errorDiv = document.getElementById('formError');
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  var startedAt = document.getElementById('appt-started-at');
  var phoneInput = document.getElementById('appt-phone');
  if (!form || !submitBtn) return;
  if (startedAt) startedAt.value = String(Date.now());

  function showFormError(msg) {
    if (!errorDiv) return;
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    errorDiv.focus();
  }

  function hideFormError() {
    if (!errorDiv) return;
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }

  function isValidUsPhone(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '1') digits = digits.slice(1);
    return digits.length === 10;
  }

  function updatePhoneValidity() {
    if (!phoneInput) return true;
    if (!phoneInput.value.trim()) {
      phoneInput.setCustomValidity('');
      return false;
    }
    var valid = isValidUsPhone(phoneInput.value);
    phoneInput.setCustomValidity(valid ? '' : 'Please enter a valid 10-digit phone number.');
    return valid;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', updatePhoneValidity);
    phoneInput.addEventListener('blur', updatePhoneValidity);
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    hideFormError();
    updatePhoneValidity();
    if (!form.reportValidity()) return;

    var fd = new FormData(form);
    var data = {};
    fd.forEach(function(val, key) { data[key] = val; });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    fetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    }).then(function(res) {
      return res.json().catch(function() { return {}; }).then(function(payload) {
        return { ok: res.ok, payload: payload };
      });
    }).then(function(result) {
      if (result.ok) {
        form.style.display = 'none';
        if (success) success.style.display = 'block';
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'contact_message', {
            event_category: 'CTA',
            event_label: 'Contact Form'
          });
        }
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
        showFormError(result.payload && result.payload.error ? result.payload.error : 'Something went wrong. Please call us at (702) 852-1280 or email clinic-office@wongu.edu.');
      }
    }).catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      showFormError('Something went wrong. Please call us at (702) 852-1280 or email clinic-office@wongu.edu.');
    });
  });
})();
