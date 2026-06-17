// Appointment form behavior for the contact page.
(function() {
  var dateInput = document.getElementById('appt-date1');
  if (dateInput) {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    dateInput.min = year + '-' + month + '-' + day;
  }

  var hiddenInput = document.getElementById('appt-patient-type');
  var toggleButtons = document.querySelectorAll('.patient-toggle-btn');

  function setPatientType(btn) {
    toggleButtons.forEach(function(b) {
      b.classList.remove('selected');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-checked', 'true');
    if (hiddenInput) hiddenInput.value = btn.getAttribute('data-value');
  }

  toggleButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      setPatientType(btn);
    });
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  var form = document.getElementById('appointmentForm');
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

  function validatePatientType() {
    var selectedType = document.getElementById('appt-patient-type');
    if (selectedType && !selectedType.value) {
      showFormError('Please select whether you are a new or returning patient.');
      var firstToggle = form.querySelector('.patient-toggle-btn');
      if (firstToggle) firstToggle.focus();
      return false;
    }
    return true;
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
    if (!validatePatientType()) return;
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
          window.gtag('event', 'appointment_request', {
            event_category: 'CTA',
            event_label: 'Contact Form'
          });
        }
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Appointment Request';
        showFormError(result.payload && result.payload.error ? result.payload.error : 'Something went wrong. Please call us at (702) 852-1280 or email clinic-office@wongu.edu.');
      }
    }).catch(function() {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Appointment Request';
      showFormError('Something went wrong. Please call us at (702) 852-1280 or email clinic-office@wongu.edu.');
    });
  });
})();
