/* ============================================
   WONGU HEALTH CENTER - Content build
   Rewrites every <!-- build:NAME --> ... <!-- /build:NAME --> region in the
   site files from the shared data in /data, then regenerates sitemap.xml.
   Pages stay plain static HTML, so search engines see the rendered content.

     npm run generate          update files in place
     npm run generate:check    exit 1 if any file is out of date (for CI)
   ============================================ */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SITE_URL, BOOKING_URL, clinic, currentHours, insurance, cancellationPolicy, herbalSafetyNote,
  prices, hoursEntryText, hoursSummaryText
} from '../data/clinic.js';
import { activeProviders, activeInterns } from '../data/providers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGION = /<!-- build:([\w-]+) -->([\s\S]*?)<!-- \/build:\1 -->/g;
const PAGE_DIRS = ['', 'conditions', 'practitioners'];
const EXTRA_FILES = ['main.js'];
// Bump when styles.css changes so browsers and the CDN pick up the new file.
const CSS_VERSION = 17;
// Shows the "Español" footer link on every page. Turn on once es.html has been reviewed by a
// native Spanish speaker and its robots noindex tag removed.
const SPANISH_PAGE_PUBLISHED = false;

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const money = amount => `$${amount.toFixed(2)}`;

/* 'index.html' -> '/', 'about.html' -> '/about', 'conditions/sciatica.html' -> '/conditions/sciatica' */
function pagePath(file) {
  const clean = file.replace(/\\/g, '/').replace(/\.html$/, '');
  return clean === 'index' ? '/' : `/${clean.replace(/\/index$/, '')}`;
}

const pageUrl = file => SITE_URL + pagePath(file);

/* ---------- Site chrome (header, footer) ---------- */

const NAV = [
  { href: '/services', label: 'Services' },
  { href: '/conditions', label: 'Conditions' },
  { href: '/student-clinic', label: 'Student Clinic' },
  { href: '/practitioners', label: 'Practitioners' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' }
];

// The mobile menu has room for the pages that only live in the footer on desktop.
const MOBILE_NAV = [
  { href: '/', label: 'Home' },
  ...NAV.slice(0, 2),
  { href: '/what-to-expect', label: 'What to Expect' },
  ...NAV.slice(2),
  { href: '/faq', label: 'FAQ' }
];

const FOOTER_COLUMNS = [
  { title: 'Services', links: [
    ['/acupuncture-las-vegas', 'Acupuncture'],
    ['/cupping-las-vegas', 'Cupping Therapy'],
    ['/chinese-herbal-medicine-las-vegas', 'Chinese Herbal Medicine'],
    ['/student-clinic', 'Student Clinic'],
    ['/services', 'All Services']
  ] },
  { title: 'Conditions', links: [
    ['/conditions/back-pain', 'Back Pain'],
    ['/conditions/sciatica', 'Sciatica'],
    ['/conditions/headaches-migraines', 'Headaches &amp; Migraines'],
    ['/conditions', 'All Conditions']
  ] },
  { title: 'Clinic', links: [
    ['/about', 'About Us'],
    ['/practitioners', 'Practitioners'],
    ['/pricing', 'Pricing'],
    ['/what-to-expect', 'What to Expect'],
    ['/faq', 'FAQ'],
    ['/blog', 'Blog'],
    ['/contact', 'Contact']
  ] }
];

/* A nav item is active on its own page and on pages nested under it (e.g. /conditions/sciatica). */
function navState(href, current) {
  if (href === current) return ' class="active" aria-current="page"';
  if (href !== '/' && current.startsWith(`${href}/`)) return ' class="active"';
  return '';
}

function renderHeader(file) {
  const current = pagePath(file);
  return [
    '<a href="#main-content" class="skip-nav" style="position:absolute;top:-100%;left:16px;">Skip to main content</a>',
    '<header class="site-header" role="banner">',
    '  <div class="header-top">',
    '    <div class="container">',
    "      <span>Nevada's Only Oriental Medicine University Clinic</span>",
    '      <div style="display:flex;gap:24px;align-items:center;">',
    `        <a href="tel:${clinic.phone.replace(/-/g, '')}">&#128222; (702) 852-1280</a>`,
    `        <a href="${clinic.parentOrganization.url}" target="_blank" rel="noopener">Part of Wongu University &rarr;</a>`,
    '      </div>',
    '    </div>',
    '  </div>',
    '  <div class="header-main">',
    '    <div class="container">',
    '      <a href="/" class="logo" aria-label="Wongu Health Center Home">',
    '        <div class="logo-icon"><img src="/images/logo-96.png" width="96" height="96" alt="Wongu Health Center Logo" decoding="async"></div>',
    '        <div class="logo-text"><span class="logo-name">Wongu Health Center</span><span class="logo-tagline">University Acupuncture Clinic</span></div>',
    '      </a>',
    '      <nav aria-label="Main Navigation">',
    '        <ul class="nav-links">',
    ...NAV.map(n => `          <li><a href="${n.href}"${navState(n.href, current)}>${n.label}</a></li>`),
    '        </ul>',
    '      </nav>',
    `      <a href="${BOOKING_URL}" target="_blank" rel="noopener" class="btn btn-primary nav-cta online-booking-btn">Book Appointment</a>`,
    '      <button class="mobile-toggle" aria-label="Open menu"><span></span><span></span><span></span></button>',
    '    </div>',
    '  </div>',
    '</header>',
    '',
    '<div class="mobile-menu" role="dialog" aria-label="Mobile navigation">',
    '  <button class="mobile-close" aria-label="Close menu">&times;</button>',
    ...MOBILE_NAV.map(n => `  <a href="${n.href}"${n.href === current ? ' aria-current="page"' : ''}>${n.label}</a>`),
    `  <a href="${BOOKING_URL}" target="_blank" rel="noopener" class="btn btn-primary online-booking-btn">Book Online</a>`,
    '  <a href="tel:+17028521280" class="btn btn-secondary">Call (702) 852-1280</a>',
    '</div>'
  ].join('\n');
}

function renderFooter() {
  const hours = currentHours().map(h => `${h.short}: ${hoursEntryText(h, { short: true })}`).join('<br>');
  return [
    '<footer class="site-footer" role="contentinfo">',
    '  <div class="container">',
    '    <div class="footer-grid">',
    '      <div class="footer-brand">',
    '        <div class="logo-name">Wongu Health Center</div>',
    "        <p>Nevada's only Oriental medicine university clinic. Acupuncture, cupping, and Chinese herbal medicine in Las Vegas, with licensed OMDs and supervised senior interns.</p>",
    '        <div class="footer-social">',
    '          <a href="https://www.facebook.com/WonguUniversity" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>',
    '          <a href="https://www.instagram.com/wonguuniversity" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg></a>',
    '          <a href="https://g.page/r/CRPIuds9oPwlEBM" target="_blank" rel="noopener" aria-label="Google Business"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></a>',
    '        </div>',
    '      </div>',
    ...FOOTER_COLUMNS.map(col => [
      '      <div class="footer-col">',
      `        <h3>${col.title}</h3>`,
      '        <ul>',
      ...col.links.map(([href, label]) => `          <li><a href="${href}">${label}</a></li>`),
      '        </ul>',
      '      </div>'
    ].join('\n')),
    '      <div class="footer-col">',
    '        <h3>Contact</h3>',
    '        <ul>',
    '          <li><a href="tel:+17028521280">(702) 852-1280</a></li>',
    '          <li><a href="sms:+17025509483">Text: 702-550-9483</a></li>',
    `          <li><a href="mailto:${clinic.email}">${clinic.email}</a></li>`,
    `          <li>${clinic.address.street}<br>${clinic.address.city}, ${clinic.address.region} ${clinic.address.postalCode}</li>`,
    `          <li>${hours}</li>`,
    '        </ul>',
    '      </div>',
    '    </div>',
    '    <div class="footer-bottom">',
    `      <span>&copy; ${new Date().getFullYear()} Wongu Health Center. Part of <a href="${clinic.parentOrganization.url}" target="_blank" rel="noopener" style="text-decoration:underline;">${clinic.parentOrganization.name}</a>.</span>`,
    `      <div class="footer-links-row"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/hipaa">HIPAA Notice</a>${SPANISH_PAGE_PUBLISHED ? '<a href="/es" lang="es" hreflang="es">Español</a>' : ''}</div>`,
    '    </div>',
    '  </div>',
    '</footer>',
    '',
    '<script src="/main.js"></script>',
    '<!-- Sticky Mobile Book Now Bar -->',
    '<div class="mobile-book-bar">',
    '  <a href="tel:+17028521280" class="mobile-call-btn" aria-label="Call Wongu Health Center at (702) 852-1280">&#128222; Call</a>',
    `  <a href="${BOOKING_URL}" target="_blank" rel="noopener" class="online-booking-btn">Book Online &rarr;</a>`,
    '</div>'
  ].join('\n');
}

/* Canonical URL, og:url, shared assets, and BreadcrumbList. The canonical comes from the file
   path, so a page can never point at the wrong host or a stale URL. */
function renderHeadAssets({ content, file }) {
  const url = pageUrl(file);
  const lines = [
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:url" content="${url}">`,
    '<meta property="og:site_name" content="Wongu Health Center">',
    '<link rel="icon" type="image/x-icon" href="/images/favicon.ico">',
    '<link rel="icon" type="image/png" sizes="192x192" href="/images/favicon-192.png">',
    '<link rel="apple-touch-icon" href="/images/apple-touch-icon.png">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garant:wght@400;500;600&family=Figtree:wght@400;500;600;700;800&display=swap">',
    `<link rel="stylesheet" href="/styles.css?v=${CSS_VERSION}">`,
    '<!-- Google Analytics 4 (loaded after page load by analytics.js) -->',
    '<script defer src="/analytics.js"></script>'
  ];
  const crumbs = breadcrumbItems(content, url);
  if (crumbs.length > 1) {
    lines.push(jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url }))
    }));
  }
  return lines.join('\n');
}

/* Reads the visible breadcrumb trail: links for ancestors, a plain <span> for the current page. */
function breadcrumbItems(content, url) {
  const trail = content.match(/<(div|nav) class="breadcrumb"[^>]*>([\s\S]*?)<\/\1>/);
  if (!trail) return [];
  const items = [...trail[2].matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>|<span(?! class="sep")[^>]*>([\s\S]*?)<\/span>/g)];
  return items.map(([, href, linkText, spanText]) => ({
    name: toPlainText(linkText ?? spanText),
    url: href ? SITE_URL + (href === '/' ? '/' : href) : url
  }));
}

/* ---------- Spanish (es.html) ---------- */

const DAYS_ES = { 'Mon–Fri': 'Lunes a viernes', Sat: 'Sábado', Sun: 'Domingo' };

function timeEs(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
}

function hoursEntryTextEs(entry, { short = false } = {}) {
  if (entry.pendingChange) {
    const { startsOn, ...next } = entry.pendingChange;
    const date = new Date(`${startsOn}T12:00:00Z`).toLocaleDateString('es-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
    return `${hoursEntryTextEs({ ...entry, pendingChange: undefined })} (${hoursEntryTextEs(next, { short: true }).toLowerCase()} a partir del ${date})`;
  }
  if (entry.status === 'open') return `${timeEs(entry.opens)} – ${timeEs(entry.closes)}`;
  if (entry.status === 'morning') return short ? 'Solo por la mañana' : 'Solo por la mañana; llame para consultar horarios';
  if (entry.status === 'limited') return 'Citas limitadas; llame a la clínica';
  if (entry.status === 'closed') return 'Cerrado';
  throw new Error(`es.html: no Spanish text for hours status "${entry.status}"`);
}

function renderHoursEs() {
  return `<p>${currentHours().map(h => {
    const day = DAYS_ES[h.short];
    if (!day) throw new Error(`es.html: add a Spanish name for "${h.short}" to DAYS_ES`);
    return `${day}: ${hoursEntryTextEs(h)}`;
  }).join('<br>')}</p>`;
}

function renderPriceSummaryEs() {
  const { intern, omd } = prices;
  const length = text => text.replace('hours', 'horas').replace('about 1 hour', 'aprox. 1 hora').replace('about', 'aprox.').replace('minutes', 'minutos');
  return [
    '<table class="comparison-table stack-table" role="table">',
    '  <thead role="rowgroup"><tr role="row"><th role="columnheader">Visita</th><th role="columnheader">Estudiante supervisado</th><th role="columnheader">Doctor con licencia (OMD)</th></tr></thead>',
    '  <tbody role="rowgroup">',
    `    <tr role="row"><td role="rowheader">Primera visita (consulta + tratamiento)</td><td role="cell" data-label="Estudiante supervisado">$${intern.initial} &middot; ${length(intern.initialLength)}</td><td role="cell" data-label="Doctor con licencia (OMD)">$${omd.initial} &middot; ${length(omd.initialLength)}</td></tr>`,
    `    <tr role="row"><td role="rowheader">Visita de seguimiento</td><td role="cell" data-label="Estudiante supervisado">$${intern.followUp} &middot; ${length(intern.followUpLength)}</td><td role="cell" data-label="Doctor con licencia (OMD)">$${omd.followUp} &middot; ${length(omd.followUpLength)}</td></tr>`,
    `    <tr role="row"><td role="rowheader">Ventosas (hasta 30 min)</td><td role="cell" data-label="Estudiante supervisado">$${intern.cupping}</td><td role="cell" data-label="Doctor con licencia (OMD)">$${omd.cupping} (incluye consulta)</td></tr>`,
    `    <tr role="row"><td role="rowheader">Fórmulas y tés de hierbas personalizados</td><td role="cell" data-label="Estudiante supervisado">Desde $${prices.herbsPerDay} por día</td><td role="cell" data-label="Doctor con licencia (OMD)">Desde $${prices.herbsPerDay} por día</td></tr>`,
    '  </tbody>',
    '</table>'
  ].join('\n');
}

/* ---------- Renderers ---------- */

// Headshots display at 150–240px, so phones get the 480px variant when it exists.
function headshot(photo, alt) {
  const style = photo.position ? ` style="object-position:${photo.position};"` : '';
  const src = `/${photo.src}`;
  const small = src.replace(/\.webp$/, '-480.webp');
  const srcset = existsSync(path.join(ROOT, small)) ? ` srcset="${small} 480w, ${src} ${photo.width}w" sizes="240px"` : '';
  return `<img src="${src}"${srcset} width="${photo.width}" height="${photo.height}" alt="${escapeHtml(alt)}" class="staff-headshot"${style} loading="lazy" decoding="async">`;
}

function providerAlt(p) {
  return `${p.name}, ${p.role.replace(' · ', ', ')} at Wongu Health Center`;
}

const profileHref = p => (p.slug ? `/practitioners/${p.slug}` : null);

function providerName(p, tag) {
  const href = profileHref(p);
  return href ? `<${tag}><a href="${href}">${escapeHtml(p.name)}</a></${tag}>` : `<${tag}>${escapeHtml(p.name)}</${tag}>`;
}

function providerFor(file) {
  const slug = path.basename(file, '.html');
  const provider = activeProviders().find(p => p.slug === slug);
  if (!provider) throw new Error(`${file}: no active provider with slug "${slug}"`);
  return provider;
}

const renderers = {
  'site-header': ({ file }) => renderHeader(file),

  'site-footer': () => renderFooter(),

  'head-assets': renderHeadAssets,

  'providers-home': () => [
    '<div class="provider-grid">',
    ...activeProviders().map(p => [
      '  <div class="card">',
      `    <div class="team-photo">${headshot(p.photo, providerAlt(p))}</div>`,
      `    ${providerName(p, 'h4')}`,
      `    <p class="team-card-role">${escapeHtml(p.role)}</p>`,
      '  </div>'
    ].join('\n')),
    '</div>'
  ].join('\n'),

  'providers-about': () => [
    '<div class="provider-grid provider-grid--detailed">',
    ...activeProviders().map(p => [
      '  <div class="card card--center">',
      `    <div class="team-photo">${headshot(p.photo, providerAlt(p))}</div>`,
      `    ${providerName(p, 'h3')}`,
      `    <p class="team-card-role">${escapeHtml(p.role)}${p.credentials ? ` &middot; ${escapeHtml(p.credentials)}` : ''}</p>`,
      `    <p>${escapeHtml(p.bio)}</p>`,
      profileHref(p) ? `    <p><a href="${profileHref(p)}" class="text-sage fw-600">Meet ${escapeHtml(p.name)} &rarr;</a></p>` : null,
      '  </div>'
    ].filter(Boolean).join('\n')),
    '</div>'
  ].join('\n'),

  // Person markup for a practitioner profile page; the provider is chosen by the file name.
  'provider-jsonld': ({ file }) => {
    const p = providerFor(file);
    return jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': `${pageUrl(file)}#person`,
      name: p.name,
      honorificPrefix: 'Dr.',
      jobTitle: p.role.replace(' · ', ', '),
      description: p.bio,
      image: `${SITE_URL}/${p.photo.src}`,
      url: pageUrl(file),
      knowsAbout: p.focus,
      worksFor: { '@type': 'MedicalClinic', '@id': clinic.id, name: clinic.name }
    });
  },

  // Swipeable row on phones, wrapped grid on larger screens. No auto-scrolling.
  'interns-home': () => {
    const interns = activeInterns();
    if (!interns.length) return '';
    return [
      '<h3 class="text-center" id="interns-heading" style="margin:48px 0 24px;">Our Interns</h3>',
      '<div class="intern-strip" role="region" aria-labelledby="interns-heading" tabindex="0">',
      '  <ul class="intern-strip-list">',
      ...interns.map(i => [
        '    <li class="card">',
        `      <div class="team-photo">${headshot(i.profileImage, `Wongu student intern ${i.name}`)}</div>`,
        `      <h4>${escapeHtml(i.name)}</h4>`,
        '    </li>'
      ].join('\n')),
      '  </ul>',
      '</div>'
    ].join('\n');
  },

  'interns-student-clinic': () => {
    const interns = activeInterns();
    if (!interns.length) {
      return '<p class="section-note">Our intern roster changes each academic quarter. Please call the clinic to learn which interns are currently seeing patients.</p>';
    }
    return [
      '<div class="student-intern-grid">',
      ...interns.map(i => [
        '  <article class="student-intern-card">',
        `    <div class="intern-photo">${headshot(i.profileImage, `Wongu student intern ${i.name} at the student clinic`)}</div>`,
        `    <h3>${escapeHtml(i.name)}</h3>`,
        '    <p class="team-card-role">Senior Intern</p>',
        `    <p class="team-card-bio">${escapeHtml(i.shortBio)}</p>`,
        '  </article>'
      ].join('\n')),
      '</div>'
    ].join('\n');
  },

  // Compact intern-vs-OMD price table for service, condition, and practitioner pages.
  'price-summary': () => {
    const { intern, omd } = prices;
    return [
      '<table class="comparison-table stack-table" role="table">',
      '  <thead role="rowgroup"><tr role="row"><th role="columnheader">Visit</th><th role="columnheader">Supervised Intern</th><th role="columnheader">Licensed OMD</th></tr></thead>',
      '  <tbody role="rowgroup">',
      `    <tr role="row"><td role="rowheader">Initial visit (consultation + treatment)</td><td role="cell" data-label="Supervised Intern">$${intern.initial} &middot; ${intern.initialLength}</td><td role="cell" data-label="Licensed OMD">$${omd.initial} &middot; ${omd.initialLength}</td></tr>`,
      `    <tr role="row"><td role="rowheader">Follow-up visit</td><td role="cell" data-label="Supervised Intern">$${intern.followUp} &middot; ${intern.followUpLength}</td><td role="cell" data-label="Licensed OMD">$${omd.followUp} &middot; ${omd.followUpLength}</td></tr>`,
      `    <tr role="row"><td role="rowheader">Cupping (up to 30 min)</td><td role="cell" data-label="Supervised Intern">$${intern.cupping}</td><td role="cell" data-label="Licensed OMD">$${omd.cupping} (includes OMD consultation)</td></tr>`,
      `    <tr role="row"><td role="rowheader">Custom herbal formulas &amp; teas</td><td role="cell" data-label="Supervised Intern">From $${prices.herbsPerDay}/day</td><td role="cell" data-label="Licensed OMD">From $${prices.herbsPerDay}/day</td></tr>`,
      '  </tbody>',
      '</table>'
    ].join('\n');
  },

  'price-summary-es': renderPriceSummaryEs,

  'hours-es': renderHoursEs,

  'hours-footer': () => `<li>${currentHours().map(h => `${h.short}: ${hoursEntryText(h, { short: true })}`).join('<br>')}</li>`,

  'hours-contact': () => `<p>${currentHours().map(h => `${h.label}: ${hoursEntryText(h)}`).join('<br>')}</p>`,

  'hours-text': () => escapeHtml(hoursSummaryText()),

  'insurance-note': () => `<strong>${escapeHtml(insurance.lead)}</strong> ${escapeHtml(insurance.body).replace('contact Wongu Health Center', '<a href="/contact#contact-form" style="color:inherit;text-decoration:underline;font-weight:600;">contact Wongu Health Center</a>')}`,

  'insurance-coverage': () => escapeHtml(insurance.coverage),

  'herbal-safety': () => escapeHtml(herbalSafetyNote),

  'cancellation-table': () => {
    const { noticeHours: h, fees } = cancellationPolicy;
    return [
      // stack-table + data-label: rows become labeled cards on narrow screens (see styles.css)
      '<table class="comparison-table stack-table" role="table">',
      '  <thead role="rowgroup"><tr role="row"><th role="columnheader">Policy</th><th role="columnheader">Intern</th><th role="columnheader">Licensed OMD</th></tr></thead>',
      '  <tbody role="rowgroup">',
      ...[
        [`${h}+ hours before appointment`, 'No Fee', 'No Fee', ' class="highlight"'],
        [`Late Cancellation / Rescheduling (&lt;${h} Hours)`, money(fees.intern.late), money(fees.omd.late), ''],
        ['No-Show', money(fees.intern.noShow), money(fees.omd.noShow), '']
      ].map(([policy, intern, omd, cls]) =>
        `    <tr role="row"><td role="rowheader">${policy}</td><td role="cell" data-label="Intern"${cls}>${intern}</td><td role="cell" data-label="Licensed OMD"${cls}>${omd}</td></tr>`),
      '  </tbody>',
      '</table>'
    ].join('\n');
  },

  'cancellation-text': () => {
    const { noticeHours: h, fees } = cancellationPolicy;
    return `Appointments canceled or rescheduled at least ${h} hours in advance have no fee. Late Cancellation / Rescheduling (&lt;${h} Hours): rescheduling with less than ${h} hours' notice is treated the same as a late cancellation — $${fees.intern.late} for intern appointments and $${fees.omd.late} for licensed OMD appointments. Missed appointments without notice (no-shows) are $${fees.intern.noShow} for intern appointments and $${fees.omd.noShow} for licensed OMD appointments.`;
  },

  'clinic-jsonld': () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      '@id': clinic.id,
      name: clinic.name,
      alternateName: clinic.alternateName,
      description: clinic.description,
      url: clinic.url,
      logo: `${SITE_URL}/images/logo.png`,
      image: `${SITE_URL}/images/clinic-exterior.jpg`,
      telephone: clinic.phone,
      email: clinic.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: clinic.address.street,
        addressLocality: clinic.address.city,
        addressRegion: clinic.address.region,
        postalCode: clinic.address.postalCode,
        addressCountry: clinic.address.country
      },
      geo: { '@type': 'GeoCoordinates', latitude: clinic.geo.latitude, longitude: clinic.geo.longitude },
      // Only regular, guaranteed hours are published; 'limited' days are described in page copy.
      openingHoursSpecification: currentHours()
        .filter(h => h.status === 'open')
        .map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
      hasMap: clinic.mapUrl,
      priceRange: '$$',
      medicalSpecialty: 'Acupuncture',
      availableService: [
        ['Acupuncture', '/acupuncture-las-vegas'],
        ['Cupping therapy', '/cupping-las-vegas'],
        ['Chinese herbal medicine', '/chinese-herbal-medicine-las-vegas']
      ].map(([name, href]) => ({ '@type': 'MedicalTherapy', name, url: SITE_URL + href })),
      employee: activeProviders().filter(p => p.slug).map(p => ({
        '@type': 'Person', '@id': `${SITE_URL}/practitioners/${p.slug}#person`, name: p.name, url: `${SITE_URL}/practitioners/${p.slug}`
      })),
      parentOrganization: { '@type': 'CollegeOrUniversity', name: clinic.parentOrganization.name, url: clinic.parentOrganization.url },
      sameAs: clinic.sameAs
    };
    return jsonLdScript(data);
  },

  // Built from the visible FAQ answers on the same page so the two can never drift apart.
  'faq-jsonld': ({ content }) => {
    const items = [...content.matchAll(/<button class="faq-question">([\s\S]*?)<span class="faq-icon">[\s\S]*?<div class="faq-answer-inner">([\s\S]*?)<\/div><\/div>/g)];
    return jsonLdScript({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: items.map(([, q, a]) => ({
        '@type': 'Question',
        name: toPlainText(q),
        acceptedAnswer: { '@type': 'Answer', text: toPlainText(a) }
      }))
    });
  }
};

// Regions that read other rendered content on the page run in a second pass.
const LATE_REGIONS = new Set(['faq-jsonld', 'head-assets']);

function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 2).replace(/<\//g, '<\\/');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

const ENTITIES = { amp: '&', mdash: '—', ndash: '–', nbsp: ' ', rsquo: '’', lsquo: '‘', quot: '"', lt: '<', gt: '>', middot: '·', rarr: '→' };

function toPlainText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&(\w+);/g, (m, name) => ENTITIES[name] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- Region replacement ---------- */

function lineIndent(content, offset) {
  const lineStart = content.lastIndexOf('\n', offset - 1) + 1;
  return content.slice(lineStart, offset).match(/^[ \t]*/)[0];
}

function renderRegions(content, file) {
  const pass = (source, late) => source.replace(REGION, (match, name, _inner, offset) => {
    if (LATE_REGIONS.has(name) !== late) return match;
    const render = renderers[name];
    if (!render) throw new Error(`${file}: unknown build region "${name}"`);
    const output = render({ content: source, file });
    if (!output.includes('\n')) return `<!-- build:${name} -->${output}<!-- /build:${name} -->`;
    const indent = lineIndent(source, offset);
    const body = output.split('\n').map(line => (line ? indent + line : line)).join('\n');
    return `<!-- build:${name} -->\n${body}\n${indent}<!-- /build:${name} -->`;
  });
  return pass(pass(content, false), true);
}

/* ---------- Sitemap ---------- */

/* Last-modified date: today for files with uncommitted changes, otherwise the last commit date. */
function lastModified(file) {
  const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  try {
    if (git(['status', '--porcelain', '--', file])) return new Date().toISOString().slice(0, 10);
    return git(['log', '-1', '--format=%cs', '--', file]) || new Date().toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function renderSitemap(pages) {
  const urls = pages
    .filter(p => !/<meta name="robots" content="[^"]*noindex/.test(p.content))
    .map(p => ({ loc: pageUrl(p.file), lastmod: lastModified(p.file) }))
    .sort((a, b) => (a.loc === `${SITE_URL}/` ? -1 : b.loc === `${SITE_URL}/` ? 1 : a.loc.localeCompare(b.loc)));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Generated by scripts/build.js (npm run generate). Do not edit by hand. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`),
    '</urlset>',
    ''
  ].join('\n');
}

/* ---------- Main ---------- */

async function pageFiles() {
  const files = [];
  for (const dir of PAGE_DIRS) {
    const full = path.join(ROOT, dir);
    if (!existsSync(full)) continue;
    for (const name of await readdir(full)) {
      if (name.endsWith('.html')) files.push(dir ? `${dir}/${name}` : name);
    }
  }
  return files;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const htmlFiles = await pageFiles();
  const stale = [];
  const pages = [];

  for (const file of htmlFiles.concat(EXTRA_FILES)) {
    const fullPath = path.join(ROOT, file);
    const original = await readFile(fullPath, 'utf8');
    const crlf = original.includes('\r\n');
    const rendered = renderRegions(crlf ? original.replace(/\r\n/g, '\n') : original, file);
    const updated = crlf ? rendered.replace(/\n/g, '\r\n') : rendered;
    if (file.endsWith('.html')) pages.push({ file, content: rendered });
    if (updated === original) continue;
    stale.push(file);
    if (!checkOnly) await writeFile(fullPath, updated);
  }

  // Sitemap dates depend on git state, so --check compares URLs only.
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const sitemap = renderSitemap(pages);
  const existing = existsSync(sitemapPath) ? await readFile(sitemapPath, 'utf8') : '';
  const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).join('\n');
  if (checkOnly ? locs(existing) !== locs(sitemap) : existing !== sitemap) {
    stale.push('sitemap.xml');
    if (!checkOnly) await writeFile(sitemapPath, sitemap);
  }

  if (checkOnly && stale.length) {
    console.error(`Out of date (run npm run generate): ${stale.join(', ')}`);
    process.exit(1);
  }
  console.log(stale.length ? `${checkOnly ? 'Stale' : 'Updated'}: ${stale.join(', ')}` : 'All generated content is up to date.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
