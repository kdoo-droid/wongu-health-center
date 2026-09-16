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

// In-memory store: only rate-limits requests handled by the same warm
// serverless instance, not globally across Vercel's instance pool. It still
// catches bursts from one instance and works alongside the honeypot/timing
// checks below, but for a hard per-IP cap across all instances this needs a
// shared store (e.g. Vercel KV / Upstash Redis).
const rateLimitStore = globalThis.__wonguRateLimitStore || new Map();
globalThis.__wonguRateLimitStore = rateLimitStore;

const ALLOWED_TOPICS = new Set([
  'General Question',
  'Herbal Formula & Tea Request',
  'VA / Insurance Eligibility Question',
  'Billing Question',
  'Other'
]);
const ALLOWED_INSURANCE = new Set([
  'VA (Veterans Affairs)',
  'Culinary Insurance',
  'Self-Pay',
  'Other'
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

async function sendResendEmail(payload) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let err = null;
    try {
      err = await response.json();
    } catch {
      err = { status: response.status, statusText: response.statusText };
    }
    throw err;
  }

  return response;
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
      error: 'Too many messages from this connection. Please wait a few minutes and try again.'
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
  const topic = normalizeChoice(body.service, ALLOWED_TOPICS);
  const insurance = normalizeChoice(body.insurance, ALLOWED_INSURANCE);
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

  if (body.service && !topic) {
    return res.status(400).json({ error: 'Please choose a valid topic option.' });
  }

  if (body.insurance && !insurance) {
    return res.status(400).json({ error: 'Please choose a valid insurance option.' });
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
  const safeTopic = escapeHtml(topic || 'Not specified');
  const safeInsurance = escapeHtml(insurance || 'Not specified');
  const safeNotes = notes ? escapeMultilineHtml(notes) : '';

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#2d4a32;padding:24px 32px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">New Contact Message</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.9rem;">Wongu Health Center</p>
      </div>
      <div style="padding:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;width:40%;color:#6b7280;font-size:0.9rem;">Full Name</td>
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
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Reason for Contact</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${safeTopic}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-size:0.9rem;">Insurance / Payment Type</td>
            <td style="padding:10px 0;font-weight:600;color:#111827;">${safeInsurance}</td>
          </tr>
          ${safeNotes ? `
          <tr>
            <td style="padding:10px 0;border-top:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;vertical-align:top;">Message</td>
            <td style="padding:10px 0;border-top:1px solid #f3f4f6;color:#111827;">${safeNotes}</td>
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
        <h1 style="color:white;margin:0;font-size:1.3rem;">Message Received</h1>
        <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:0.9rem;">Wongu Health Center</p>
      </div>
      <div style="padding:32px;">
        <p style="color:#111827;font-size:1rem;line-height:1.7;">Hi ${safeName},</p>
        <p style="color:#374151;line-height:1.7;">Thank you for contacting Wongu Health Center. Our front desk has received your message and will get back to you within <strong>24 business hours (Mon–Fri)</strong>.</p>
        <p style="color:#374151;line-height:1.7;">Messages sent on weekends will be answered the following Monday.</p>
        <div style="margin:24px 0;padding:16px 20px;background:#f0f4f0;border-left:4px solid #4a7c59;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-weight:600;color:#2d4a32;margin-bottom:8px;">Your Message Summary</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Reason for Contact:</strong> ${safeTopic}</p>
          <p style="margin:4px 0;color:#374151;font-size:0.9rem;"><strong>Insurance / Payment Type:</strong> ${safeInsurance}</p>
        </div>
        <p style="color:#374151;line-height:1.7;">Ready to book an appointment? Self-pay patients can book instantly through our <a href="https://patient.unifiedpractice.com/wongu-health-center" style="color:#4a7c59;font-weight:600;">online patient portal</a>. VA &amp; Culinary insurance patients: our front desk will confirm eligibility with you first.</p>
        <p style="color:#374151;line-height:1.7;">Need to reach us sooner? Call or text us directly:</p>
        <p style="margin:0;"><a href="tel:+17028521280" style="color:#4a7c59;font-weight:600;">(702) 852-1280</a> &nbsp;|&nbsp; <a href="sms:+17025509483" style="color:#4a7c59;font-weight:600;">Text: 702-550-9483</a></p>
        <p style="color:#374151;line-height:1.7;margin-top:16px;">We look forward to hearing from you!</p>
        <p style="color:#6b7280;font-size:0.85rem;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;">Wongu Health Center &middot; 8630 S Eastern Ave, Las Vegas, NV 89123 &middot; Mon–Fri 8AM–4:30PM, Closed Sat–Sun</p>
      </div>
    </div>
  `;

  try {
    try {
      await sendResendEmail({
        from: resendFromEmail,
        to: [clinicEmail],
        reply_to: email,
        subject: `New Contact Message - ${name} (${topic || 'General Question'})`,
        html
      });
    } catch (err) {
      console.error('Resend error (clinic email):', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    }

    // Attempt the confirmation email too, but keep the contact message
    // successful even if the patient's inbox rejects it or Resend returns an error.
    try {
      await sendResendEmail({
        from: resendFromEmail,
        to: [email],
        reply_to: clinicEmail,
        subject: 'We Received Your Message — Wongu Health Center',
        html: confirmationHtml
      });
    } catch (err) {
      console.error('Resend error (confirmation email):', err);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
