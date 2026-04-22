const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 25;
const MAX_EMAIL_LENGTH = 254;
const MAX_NOTES_LENGTH = 2000;
const MIN_FORM_FILL_MS = 2000;
const MAX_FORM_AGE_MS = 1000 * 60 * 60 * 12;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const DEFAULT_CLINIC_EMAIL = 'clinic-office@wongu.edu';
const DEFAULT_RESEND_FROM_EMAIL = 'Wongu Health Center <appointments@wonguhealthcenter.com>';

const rateLimitStore = globalThis.__wonguRateLimitStore || new Map();
globalThis.__wonguRateLimitStore = rateLimitStore;

const ALLOWED_PATIENT_TYPES = new Set(['New Patient', 'Returning Patient']);
const ALLOWED_SERVICES = new Set([
  'Acupuncture',
  'Cupping Therapy',
  'Herbal Medicine Consultation',
  'Pain Management',
  'Wellness Consultation',
  'Not sure yet'
]);
const ALLOWED_INSURANCE = new Set([
  'VA (Veterans Affairs)',
  'Culinary Insurance',
  'Self-Pay',
  'Other'
]);
const ALLOWED_TIMES = new Set([
  'Morning (8:00 - 10:00 AM)',
  'Mid-Morning (10:00 AM - 12:00 PM)',
  'Afternoon (12:00 - 4:30 PM)',
  'Saturday Morning (8:00 AM - 12:00 PM)'
]);

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.slice(0, maxLength);
}

function getEnvText(name, fallback = '') {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeNotes(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_NOTES_LENGTH);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeMultilineHtml(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function normalizeChoice(value, allowedValues) {
  const normalized = normalizeText(value, 100);
  return normalized && allowedValues.has(normalized) ? normalized : '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return true;
  }
  return digits.length === 10;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

function getHeader(req, headerName) {
  if (!req || !req.headers) return '';
  if (typeof req.headers.get === 'function') {
    return req.headers.get(headerName) || '';
  }
  return req.headers[headerName] || req.headers[headerName.toLowerCase()] || '';
}

function getClientIp(req) {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = getHeader(req, 'x-real-ip');
  if (realIp) return realIp.trim();

  const cfIp = getHeader(req, 'cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  return 'unknown';
}

function cleanupRateLimitStore(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (!entry || entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function checkRateLimit(ip) {
  const now = Date.now();
  cleanupRateLimitStore(now);

  const key = `contact:${ip}`;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - existing.count),
    resetAt: existing.resetAt
  };
}

export default async function handler(req, res) {
  if (typeof res.setHeader === 'function') {
    res.setHeader('Cache-Control', 'no-store');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));
    }
    return res.status(429).json({
      error: 'Too many appointment requests from this connection. Please wait a few minutes and try again.'
    });
  }

  if (typeof res.setHeader === 'function') {
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
    res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
    res.setHeader('X-RateLimit-Reset', String(rateLimit.resetAt));
  }

  const body = getBody(req);

  const honeypot = normalizeText(body.website, 200);
  const startedAtRaw = normalizeText(body.form_started_at, 20);
  const startedAt = Number.parseInt(startedAtRaw, 10);

  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  if (Number.isFinite(startedAt)) {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_FORM_FILL_MS) {
      // Submitted too fast — almost certainly a bot; silent success to avoid signaling detection
      return res.status(200).json({ success: true });
    }
    if (elapsed > MAX_FORM_AGE_MS) {
      // Page was left open too long; real users should refresh and resubmit
      return res.status(400).json({ error: 'Your session has expired. Please refresh the page and try again.' });
    }
  }

  const name = normalizeText(body.name, MAX_NAME_LENGTH);
  const phone = normalizeText(body.phone, MAX_PHONE_LENGTH);
  const email = normalizeText(body.email, MAX_EMAIL_LENGTH).toLowerCase();
  const patientType = normalizeChoice(body.patient_type, ALLOWED_PATIENT_TYPES);
  const service = normalizeChoice(body.service, ALLOWED_SERVICES);
  const insurance = normalizeChoice(body.insurance, ALLOWED_INSURANCE);
  const preferredDate = normalizeText(body.preferred_date, 10);
  const preferredTime = normalizeChoice(body.preferred_time, ALLOWED_TIMES);
  const notes = normalizeNotes(body.notes);

  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

  if (name.length < 2) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  if (!patientType) {
    return res.status(400).json({ error: 'Please select whether you are a new or returning patient.' });
  }

  if (body.service && !service) {
    return res.status(400).json({ error: 'Please choose a valid service option.' });
  }

  if (body.insurance && !insurance) {
    return res.status(400).json({ error: 'Please choose a valid insurance option.' });
  }

  if (preferredDate && !isValidDate(preferredDate)) {
    return res.status(400).json({ error: 'Please choose a valid preferred date.' });
  }

  if (body.preferred_time && !preferredTime) {
    return res.status(400).json({ error: 'Please choose a valid preferred time.' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY');
    return res.status(500).json({ error: 'Server is not configured to send email.' });
  }

  const clinicEmail = getEnvText('CLINIC_APPOINTMENT_EMAIL', DEFAULT_CLINIC_EMAIL);
  const resendFromEmail = getEnvText('RESEND_FROM_EMAIL', DEFAULT_RESEND_FROM_EMAIL);

  if (/onboarding@resend\.dev/i.test(resendFromEmail)) {
    console.error('RESEND_FROM_EMAIL must use a verified sending domain, not onboarding@resend.dev');
    return res.status(500).json({ error: 'Server email sender is not configured.' });
  }

  const safeName = escapeHtml(name);
  const safePhone = escapeHtml(phone);
  const safeEmail = escapeHtml(email);
  const safePatientType = escapeHtml(patientType);
  const safeService = escapeHtml(service || 'Not specified');
  const safeInsurance = escapeHtml(insurance || 'Not specified');
  const safePreferredDate = escapeHtml(preferredDate || 'Flexible');
  const safePreferredTime = escapeHtml(preferredTime || 'Any time');
  const safeNotes = notes ? escapeMultilineHtml(notes) : '';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#2d4a32;padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">New Appointment Request</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.9rem;">Wongu Health Center</p>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;width:40%;color:#6b7280;font-size:0.9rem;">Patient Type</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safePatientType}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Full Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safePhone}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safeEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Service</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safeService}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Insurance</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safeInsurance}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Preferred Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safePreferredDate}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Preferred Time</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safePreferredTime}</td>
          </tr>
          ${safeNotes ? `
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-size:0.9rem;vertical-align:top;">Notes</td>
            <td style="padding:10px 0;color:#111827;">${safeNotes}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;">
          <p style="margin:0;font-size:0.85rem;color:#6b7280;">Reply directly to this email to respond to <strong>${safeName}</strong> at <a href="mailto:${safeEmail}" style="color:#7a9e7e;">${safeEmail}</a> or call <a href="tel:${safePhone}" style="color:#7a9e7e;">${safePhone}</a>.</p>
        </div>
      </div>
    </div>
  `;

  const confirmationHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#2d4a32;padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">Appointment Request Received</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.9rem;">Wongu Health Center</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#111827;font-size:1rem;line-height:1.7;">Hi ${safeName},</p>
        <p style="color:#374151;line-height:1.7;">Thank you for requesting an appointment at Wongu Health Center. Our front desk has received your request and will follow up within <strong>24 business hours (Mon–Fri)</strong> to confirm your appointment time.</p>
        <p style="color:#374151;line-height:1.7;">Requests submitted on weekends will be handled the following Monday.</p>
        <div style="margin:24px 0;padding:16px 20px;background:#f0f4f0;border-left:4px solid #4a7c59;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-weight:600;color:#2d4a32;margin-bottom:8px;">Your Request Summary</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Patient Type:</strong> ${safePatientType}</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Service:</strong> ${safeService}</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Preferred Date:</strong> ${safePreferredDate}</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Preferred Time:</strong> ${safePreferredTime}</p>
        </div>
        <p style="color:#374151;line-height:1.7;">Need to reach us sooner? Call or text us directly:</p>
        <p style="margin:0;"><a href="tel:+17028521280" style="color:#4a7c59;font-weight:600;">(702) 852-1280</a> &nbsp;|&nbsp; <a href="sms:+17025509483" style="color:#4a7c59;font-weight:600;">Text: 702-550-9483</a></p>
        <p style="color:#374151;line-height:1.7;margin-top:16px;">We look forward to seeing you!</p>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">Wongu Health Center &middot; 8630 S Eastern Ave, Las Vegas, NV 89123 &middot; Mon–Fri 8AM–4:30PM, Sat 8AM–12PM</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [clinicEmail],
        reply_to: email,
        subject: `New Appointment Request - ${name} (${patientType})`,
        html
      })
    });

    if (!response.ok) {
      let err = null;
      try {
        err = await response.json();
      } catch {
        err = { status: response.status, statusText: response.statusText };
      }
      console.error('Resend error (clinic email):', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    // Send confirmation to patient — non-blocking; log but don't fail the request if it errors
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email],
        reply_to: clinicEmail,
        subject: 'Your Appointment Request — Wongu Health Center',
        html: confirmationHtml
      })
    }).catch(err => console.error('Confirmation email error:', err));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
