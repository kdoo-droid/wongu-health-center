/* ============================================
   WONGU HEALTH CENTER - Clinic configuration
   Single source of truth for hours, insurance wording, and policies.
   After editing, run `npm run generate` to update every page.
   ============================================ */

export const clinic = {
  name: 'Wongu Health Center',
  alternateName: 'Wongu University Health Center',
  description: "Nevada's only Oriental medicine university clinic offering acupuncture, cupping, custom herbal formulas, herbal teas, and traditional Chinese medicine in Las Vegas.",
  url: 'https://wonguhealthcenter.com/',
  phone: '+1-702-852-1280',
  email: 'clinic-office@wongu.edu',
  address: {
    street: '8630 S Eastern Ave',
    city: 'Las Vegas',
    region: 'NV',
    postalCode: '89123',
    country: 'US'
  },
  geo: { latitude: 36.0326, longitude: -115.1206 },
  mapUrl: 'https://maps.google.com/?q=8630+S+Eastern+Ave+Las+Vegas+NV+89123',
  sameAs: [
    'https://www.facebook.com/WonguUniversity',
    'https://www.instagram.com/wonguuniversity'
  ],
  parentOrganization: {
    name: 'Wongu University of Oriental Medicine',
    url: 'https://wongu.edu'
  }
  // No review count here: it can't be kept in sync with Google, so it isn't published.
};

/* Clinic hours.
   status: 'open'    -> regular hours (published in structured data)
           'morning' -> morning-only; shown on pages but not published as fixed hours
           'limited' -> appointments depend on academic scheduling; never published as fixed hours
           'closed'
   upcoming: a scheduled change. Before startsOn (Las Vegas date) the page shows the current
   status plus "... starting <date>"; from startsOn on, the upcoming status replaces it.
   Pages are static, so run `npm run generate` and redeploy on or after startsOn. */
export const hours = [
  { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], label: 'Monday – Friday', short: 'Mon–Fri', status: 'open', opens: '08:00', closes: '16:30' },
  // Once exact Saturday times are known, give upcoming status: 'open' with opens/closes
  // so Saturday is also published to Google via structured data.
  { days: ['Saturday'], label: 'Saturday', short: 'Sat', status: 'closed', upcoming: { status: 'morning', startsOn: '2026-10-10' } },
  { days: ['Sunday'], label: 'Sunday', short: 'Sun', status: 'closed' }
];

function lasVegasToday(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(date); // YYYY-MM-DD
}

function formatStartDate(isoDate) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/* Hours as they apply on the given date, with any upcoming change resolved. */
export function currentHours(date = new Date()) {
  const today = lasVegasToday(date);
  return hours.map(entry => {
    if (!entry.upcoming) return entry;
    const { startsOn, ...next } = entry.upcoming;
    if (today >= startsOn) return { ...entry, ...next, upcoming: undefined };
    return { ...entry, pendingChange: { ...next, startsOn } };
  });
}

export const LIMITED_HOURS_TEXT = 'Limited appointments — please contact the clinic for availability';

export const insurance = {
  lead: 'VA Community Care and Culinary patients',
  body: 'should contact Wongu Health Center before scheduling so we can verify eligibility, authorization, and provider availability.',
  coverage: 'Coverage is subject to applicable authorization, eligibility, and plan requirements.'
};

/* Late-cancellation window applies equally to cancelling and rescheduling. */
export const cancellationPolicy = {
  noticeHours: 24,
  fees: {
    intern: { late: 30, noShow: 50 },
    omd: { late: 50, noShow: 80 }
  }
};

export const herbalSafetyNote = 'Tell your practitioner about all medications and supplements you take. Herbal formulas may interact with medications and may not be appropriate during pregnancy or for certain medical conditions.';

/* ---------- Formatting helpers (shared by the build script and the contact API) ---------- */

function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatShortTime(hhmm) {
  return formatTime(hhmm).replace(':00', '').replace(' ', '');
}

export function hoursEntryText(entry, { short = false } = {}) {
  if (entry.pendingChange) {
    const { startsOn, ...next } = entry.pendingChange;
    const nowText = hoursEntryText({ ...entry, pendingChange: undefined }, { short });
    const nextText = hoursEntryText(next, { short: true }).toLowerCase();
    return `${nowText} (${nextText} starting ${formatStartDate(startsOn)})`;
  }
  if (entry.status === 'open') {
    return short
      ? `${formatShortTime(entry.opens)}–${formatShortTime(entry.closes)}`
      : `${formatTime(entry.opens)} – ${formatTime(entry.closes)}`;
  }
  if (entry.status === 'morning') return short ? 'Mornings only' : 'Mornings only — please contact the clinic for appointment times';
  if (entry.status === 'limited') return short ? 'Limited appts — please call' : LIMITED_HOURS_TEXT;
  return 'Closed';
}

/* One-line plain-text summary, e.g. for emails and FAQ answers. */
export function hoursSummaryText(date = new Date()) {
  return currentHours(date)
    .map(entry => {
      const label = entry.label.replace(' – ', '–');
      return entry.status === 'open' ? `${label} ${hoursEntryText(entry)}` : `${label}: ${hoursEntryText(entry)}`;
    })
    .join('. ') + '.';
}

export function insuranceText() {
  return `${insurance.lead} ${insurance.body}`;
}
