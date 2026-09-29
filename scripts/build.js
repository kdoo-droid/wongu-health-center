/* ============================================
   WONGU HEALTH CENTER - Content build
   Rewrites every <!-- build:NAME --> ... <!-- /build:NAME --> region in the
   site files from the shared data in /data. Pages stay plain static HTML,
   so search engines see the rendered content.

     npm run build          update files in place
     npm run build:check    exit 1 if any file is out of date (for CI)
   ============================================ */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clinic, currentHours, insurance, cancellationPolicy, herbalSafetyNote,
  hoursEntryText, hoursSummaryText
} from '../data/clinic.js';
import { activeProviders, activeInterns } from '../data/providers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGION = /<!-- build:([\w-]+) -->([\s\S]*?)<!-- \/build:\1 -->/g;
const EXTRA_FILES = ['main.js'];

const escapeHtml = value => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const money = amount => `$${amount.toFixed(2)}`;

/* ---------- Renderers ---------- */

function headshot(photo, alt) {
  const style = photo.position ? ` style="object-position:${photo.position};"` : '';
  return `<img src="${photo.src}" width="${photo.width}" height="${photo.height}" alt="${escapeHtml(alt)}" class="staff-headshot"${style} loading="lazy" decoding="async">`;
}

function providerAlt(p) {
  return `${p.name}, ${p.role.replace(' · ', ', ')} at Wongu Health Center`;
}

const renderers = {
  'providers-home': () => [
    '<div class="provider-grid">',
    ...activeProviders().map(p => [
      '  <div class="card">',
      `    <div class="team-photo">${headshot(p.photo, providerAlt(p))}</div>`,
      `    <h4>${escapeHtml(p.name)}</h4>`,
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
      `    <h3>${escapeHtml(p.name)}</h3>`,
      `    <p class="team-card-role">${escapeHtml(p.role)}${p.credentials ? ` &middot; ${escapeHtml(p.credentials)}` : ''}</p>`,
      `    <p>${escapeHtml(p.bio)}</p>`,
      '  </div>'
    ].join('\n')),
    '</div>'
  ].join('\n'),

  // Rendered once; main.js adds aria-hidden clones at runtime for the scrolling effect.
  'interns-home': () => {
    const interns = activeInterns();
    if (!interns.length) return '';
    return [
      '<h3 class="text-center" style="margin:48px 0 24px;">Our Interns</h3>',
      '<div class="team-carousel-wrapper">',
      '  <div class="team-carousel-track">',
      ...interns.map(i => [
        '    <div class="card">',
        `      <div class="team-photo">${headshot(i.profileImage, `Wongu student intern ${i.name}`)}</div>`,
        `      <h4>${escapeHtml(i.name)}</h4>`,
        '    </div>'
      ].join('\n')),
      '  </div>',
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

  'hours-footer': () => `<li>${currentHours().map(h => `${h.short}: ${hoursEntryText(h, { short: true })}`).join('<br>')}</li>`,

  'hours-contact': () => `<p>${currentHours().map(h => `${h.label}: ${hoursEntryText(h)}`).join('<br>')}</p>`,

  'hours-text': () => escapeHtml(hoursSummaryText()),

  'insurance-note': () => `<strong>${escapeHtml(insurance.lead)}</strong> ${escapeHtml(insurance.body).replace('contact the clinic', '<a href="/contact#contact-form" style="color:inherit;text-decoration:underline;font-weight:600;">contact the clinic</a>')}`,

  'insurance-coverage': () => escapeHtml(insurance.coverage),

  'herbal-safety': () => escapeHtml(herbalSafetyNote),

  'cancellation-table': () => {
    const { noticeHours: h, fees } = cancellationPolicy;
    return [
      '<table class="comparison-table">',
      '  <thead><tr><th>Policy</th><th>Intern</th><th>Licensed OMD</th></tr></thead>',
      '  <tbody>',
      `    <tr><td>Canceled or Rescheduled &mdash; ${h}+ Hours in Advance</td><td class="highlight">No Fee</td><td class="highlight">No Fee</td></tr>`,
      `    <tr><td>Late Cancellation / Rescheduling &mdash; Less than ${h} Hours</td><td>${money(fees.intern.late)}</td><td>${money(fees.omd.late)}</td></tr>`,
      `    <tr><td>No-Show</td><td>${money(fees.intern.noShow)}</td><td>${money(fees.omd.noShow)}</td></tr>`,
      '  </tbody>',
      '</table>'
    ].join('\n');
  },

  'cancellation-text': () => {
    const { noticeHours: h, fees } = cancellationPolicy;
    return `Appointments canceled or rescheduled at least ${h} hours in advance have no fee. Rescheduling with less than ${h} hours' notice is treated the same as a late cancellation: $${fees.intern.late} for intern appointments and $${fees.omd.late} for licensed OMD appointments. Missed appointments without notice (no-shows) are $${fees.intern.noShow} for intern appointments and $${fees.omd.noShow} for licensed OMD appointments.`;
  },

  'clinic-jsonld': () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'MedicalClinic',
      name: clinic.name,
      alternateName: clinic.alternateName,
      description: clinic.description,
      url: clinic.url,
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
      parentOrganization: { '@type': 'CollegeOrUniversity', name: clinic.parentOrganization.name, url: clinic.parentOrganization.url },
      sameAs: clinic.sameAs,
      aggregateRating: { '@type': 'AggregateRating', ratingValue: clinic.rating.value, reviewCount: clinic.rating.count }
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
  // faq-jsonld reads the rendered answers, so it runs after every other region.
  const pass = (source, onlyJsonLd) => source.replace(REGION, (match, name, _inner, offset) => {
    if ((name === 'faq-jsonld') !== onlyJsonLd) return match;
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

async function main() {
  const checkOnly = process.argv.includes('--check');
  const files = (await readdir(ROOT)).filter(f => f.endsWith('.html')).concat(EXTRA_FILES);
  const stale = [];

  for (const file of files) {
    const fullPath = path.join(ROOT, file);
    const original = await readFile(fullPath, 'utf8');
    const crlf = original.includes('\r\n');
    const rendered = renderRegions(crlf ? original.replace(/\r\n/g, '\n') : original, file);
    const updated = crlf ? rendered.replace(/\n/g, '\r\n') : rendered;
    if (updated === original) continue;
    stale.push(file);
    if (!checkOnly) await writeFile(fullPath, updated);
  }

  if (checkOnly && stale.length) {
    console.error(`Out of date (run npm run build): ${stale.join(', ')}`);
    process.exit(1);
  }
  console.log(stale.length ? `${checkOnly ? 'Stale' : 'Updated'}: ${stale.join(', ')}` : 'All generated content is up to date.');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
