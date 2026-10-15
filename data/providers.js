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
   bookingEnabled: whether patients can currently request this provider.
   slug: profile page at /practitioners/<slug>.html (only for providers who have one).
   focus: areas named in the provider's own bio; used for structured data (knowsAbout). */
export const providers = [
  {
    id: 'yu',
    name: 'Dr. Eunhee Yu',
    credentials: 'MSOM, L.Ac., Dipl. OM',
    role: 'Clinic Director · Licensed OMD',
    category: 'clinicLeadership',
    active: true,
    bookingEnabled: true,
    slug: 'dr-yu',
    focus: ['Acupuncture', 'Chinese herbal medicine', 'Fertility support', "Women's health", 'Chronic conditions'],
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
    slug: 'dr-keita-sekine',
    focus: ['Acupuncture', 'Japanese acupuncture', 'Chronic internal conditions'],
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
   supervisor: provider id from the list above, if assigned.
   shortBio: optional; interns without one get the generic internBio() text below.
   Interns are listed by first name and last initial only. */
export const interns = [
  {
    name: 'Franica M.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-francisca.webp', width: 800, height: 800 }
  },
  {
    name: 'Tichelle H.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-tchelle.webp', width: 800, height: 800 }
  },
  {
    name: 'Joyce W.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-joyce.webp', width: 800, height: 800 }
  },
  {
    name: 'Bria H.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-bria.webp', width: 800, height: 800 }
  },
  {
    name: 'Brittany T.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-brittany.webp', width: 800, height: 800 }
  },
  {
    name: 'Roman G.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-roman.webp', width: 800, height: 800 }
  },
  {
    name: 'Amy P.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-amy.webp', width: 800, height: 800 }
  },
  {
    name: 'Rhenand M.',
    quarter: null,
    active: true,
    supervisor: null,
    profileImage: { src: 'images/intern-rhenand.webp', width: 800, height: 800 }
  }
];

const CATEGORY_ORDER = ['clinicLeadership', 'clinicalSupervisors', 'licensedProviders'];

export function activeProviders() {
  return providers
    .filter(p => p.active === true)
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
}

// Generic on purpose: interns are at different points in the program, so no year or specialty.
export function internBio(intern) {
  if (intern.shortBio) return intern.shortBio;
  const first = intern.name.split(' ')[0];
  return `${first} is a student in Wongu University's master's program in Oriental medicine, training to become a licensed Oriental Medicine Doctor (OMD). All of ${first}'s patient care is supervised by licensed OMD faculty.`;
}

export function activeInterns() {
  return interns.filter(i => i.active === true);
}
