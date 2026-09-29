/* ============================================
   WONGU HEALTH CENTER - Provider & intern roster
   Single source of truth for every team section on the site
   (Home, About, Student Clinic). Only entries with active: true are shown.

   Quarterly roster change:
     1. Set active: false on departing interns/providers (keep the entry for history).
     2. Add new entries with a headshot in /images.
     3. Run `npm run generate`.
   ============================================ */

/* category: 'clinicLeadership' | 'clinicalSupervisors' | 'licensedProviders'
   bookingEnabled: whether patients can currently request this provider. */
export const providers = [
  {
    id: 'yu',
    name: 'Dr. Yu',
    credentials: 'MSOM, L.Ac., Dipl. OM',
    role: 'Clinic Director · Licensed OMD',
    category: 'clinicLeadership',
    active: true,
    bookingEnabled: true,
    photo: { src: 'images/dr-yu.webp', width: 800, height: 800 },
    bio: "Dr. Yu leads our clinic with a deep commitment to patient-centered care. With years of experience in fertility, women's health, and chronic conditions, she brings both expertise and genuine compassion to every treatment."
  },
  {
    id: 'sekine',
    name: 'Dr. Keita Sekine',
    credentials: 'MSOM, L.Ac., Dipl. OM',
    role: 'Licensed OMD · Clinical Supervisor',
    category: 'clinicalSupervisors',
    active: true,
    bookingEnabled: true,
    photo: { src: 'images/dr-sekine.webp', width: 800, height: 800 },
    bio: 'Dr. Sekine specializes in Japanese acupuncture techniques and chronic internal conditions. Known for his gentle approach and thorough evaluations, patients consistently describe him as attentive and deeply knowledgeable.'
  },
  {
    id: 'eng',
    name: 'Dr. Eng',
    credentials: '',
    role: 'Licensed OMD',
    category: 'licensedProviders',
    active: false, // not currently providing clinic coverage
    bookingEnabled: false,
    photo: { src: 'images/dr-joanne-eng.webp', width: 800, height: 800 },
    bio: "Dr. Eng is a licensed OMD providing thoughtful, patient-centered care tailored to each individual's needs."
  },
  {
    id: 'kelso',
    name: 'Dr. Kelso',
    credentials: '',
    role: 'Licensed OMD',
    category: 'licensedProviders',
    active: false, // not currently providing clinic coverage
    bookingEnabled: false,
    photo: { src: 'images/dr-kelso.webp', width: 800, height: 1043, position: 'center top' },
    bio: 'Dr. Kelso is a licensed OMD with a background in traditional Oriental medicine and a dedication to compassionate, patient-centered care.'
  }
];

/* quarter: academic quarter the intern is on the clinic floor, e.g. 'Fall 2026'.
   supervisor: provider id from the list above, if assigned. */
export const interns = [
  {
    name: 'Franica M.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-francisca.webp', width: 800, height: 800 },
    shortBio: 'A 4th-year intern at Wongu University finishing up her clinical training, Franica brings a thorough, caring approach to every session. She is passionate about helping patients feel heard, supported, and cared for through traditional Oriental medicine.'
  },
  {
    name: 'Tichelle H.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-tchelle.webp', width: 800, height: 800 },
    shortBio: 'Tichelle is a dedicated intern in her final year at Wongu University, committed to patient-centered care. She brings warmth and attentiveness to each treatment, helping patients pursue their wellness goals through traditional Oriental medicine.'
  },
  {
    name: 'Joyce W.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-joyce.webp', width: 800, height: 800 },
    shortBio: 'Joyce is finishing up her final year at Wongu University and brings a calm, attentive presence to patient visits. She is committed to thoughtful care, clear communication, and helping patients feel comfortable throughout treatment.'
  },
  {
    name: 'Bria H.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-bria.webp', width: 800, height: 800 },
    shortBio: 'Bria is finishing up her final year at Wongu University and brings warmth and genuine care to every patient interaction. She is dedicated to thorough, attentive treatment grounded in traditional Oriental medicine.'
  },
  {
    name: 'Brittany T.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-brittany.webp', width: 800, height: 800 },
    shortBio: 'Brittany is finishing up her final year at Wongu University, committed to patient-centered care. She brings a thoughtful, detail-oriented approach to each session, helping patients feel supported throughout their treatment.'
  },
  {
    name: 'Roman G.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-roman.webp', width: 800, height: 800 },
    shortBio: 'Roman is finishing up his final year at Wongu University and approaches patient care with focus and professionalism. He is dedicated to clear communication and helping patients reach their wellness goals.'
  },
  {
    name: 'Amy P.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-amy.webp', width: 800, height: 800 },
    shortBio: 'Amy is finishing up her final year at Wongu University and brings a warm, attentive approach to patient care. She is dedicated to helping patients feel comfortable and supported throughout treatment.'
  }
];

const CATEGORY_ORDER = ['clinicLeadership', 'clinicalSupervisors', 'licensedProviders'];

export function activeProviders() {
  return providers
    .filter(p => p.active === true)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
}

export function activeInterns() {
  return interns.filter(i => i.active === true);
}
