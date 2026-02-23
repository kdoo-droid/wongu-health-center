# Wongu Health Center — Website Strategy & Implementation Guide

## File Structure
```
wongu-health-center/
├── index.html          — Homepage (conversion-focused landing)
├── about.html          — About Us (credibility & team)
├── services.html       — Services (SEO-rich treatment pages)
├── pricing.html        — Pricing (transparent comparison)
├── student-clinic.html — Student Clinic (unique value prop)
├── faq.html            — FAQ (with Schema.org FAQPage markup)
├── contact.html        — Contact (directions, hours, HIPAA notice)
├── styles.css          — Shared stylesheet
├── main.js             — Shared JavaScript (nav, FAQ accordion, scroll)
└── STRATEGY-AND-RECOMMENDATIONS.md — This file
```

---

## SEO Strategy

### Target Keywords (by page)
| Page | Primary Keyword | Secondary Keywords |
|------|----------------|-------------------|
| Homepage | acupuncture Las Vegas | affordable acupuncture, oriental medicine Las Vegas, acupuncture clinic near me |
| About | Wongu Health Center | university acupuncture clinic, licensed OMDs Las Vegas |
| Services | acupuncture services Las Vegas | cupping therapy, Chinese herbal medicine, moxibustion Las Vegas |
| Pricing | acupuncture cost Las Vegas | affordable acupuncture near me, cheap acupuncture, low cost acupuncture |
| Student Clinic | student acupuncture clinic | supervised acupuncture, $20 acupuncture Las Vegas |
| FAQ | acupuncture FAQ | does acupuncture hurt, is acupuncture safe, acupuncture insurance |
| Contact | acupuncture clinic Las Vegas contact | S Eastern Ave acupuncture, acupuncture near Henderson |

### Implemented SEO Features
- Unique `<title>` and `<meta description>` per page
- JSON-LD LocalBusiness structured data (homepage)
- JSON-LD FAQPage structured data (FAQ page)
- JSON-LD MedicalBusiness with services (services page)
- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- `<h1>` through `<h4>` hierarchy on every page
- Canonical URLs on every page
- Internal linking between all pages
- Alt text placeholders for images
- Descriptive `aria-label` attributes

### Additional SEO Recommendations (post-launch)
1. **Google Business Profile** — Claim and fully optimize with photos, hours, services, and FAQs
2. **Blog/Content** — Add a `/blog` section targeting long-tail queries (e.g., "benefits of acupuncture for migraines", "acupuncture vs dry needling Las Vegas")
3. **Local Citations** — Submit NAP (Name, Address, Phone) consistently to Yelp, Healthgrades, Zocdoc, Vitals, and local directories
4. **Image Optimization** — Use WebP format, descriptive filenames (e.g., `acupuncture-treatment-las-vegas.webp`), and complete alt attributes
5. **Page Speed** — Current static HTML is already fast; add image lazy-loading and consider a CDN (Cloudflare)

---

## Conversion Strategy

### CTA Placement Map
Every page includes multiple booking CTAs:
- **Header**: Persistent "Book Now" button (desktop nav + mobile menu)
- **Hero sections**: Primary CTA above the fold
- **Mid-page**: Contextual CTAs within content sections
- **Bottom CTA banner**: Full-width conversion block before footer
- **Footer**: Phone number and booking link

### CTA Button Hierarchy
1. **Primary** (green): "Book Your Appointment" → Unified Practice link
2. **Secondary** (outlined): "View Services", "Learn More" → internal navigation
3. **Gold accent**: "Leave a Review" → Google review link
4. **Phone CTA**: Always visible for users who prefer calling

### Conversion Principles Applied
- **Price anchoring**: $20 student clinic price shown prominently against private practice rates
- **Social proof**: Star ratings, review count, patient testimonials
- **Trust signals**: University affiliation, licensed OMD supervision, HIPAA compliance badges
- **Urgency-free persuasion**: Focus on value and accessibility rather than artificial urgency
- **Friction reduction**: External booking (Unified Practice) handles everything — no forms on-site

---

## Google Reviews Strategy

### On-Site
- **Homepage**: Review score badge with "Leave a Review" CTA
- **Contact page**: Dedicated "Share Your Experience" section with review link
- **Post-treatment**: Implement automated email/SMS follow-up via Unified Practice

### Off-Site Recommendations
1. **In-clinic signage**: QR code at checkout linking directly to Google review form
2. **Business card inserts**: "Enjoyed your visit? Leave us a review!" with QR code
3. **Email follow-up**: Set up automated post-appointment email (2 hours after visit) with a direct Google review link
4. **Staff training**: Train front desk to politely ask satisfied patients to leave a review
5. **Response strategy**: Reply to ALL Google reviews within 24–48 hours (positive and negative)
6. **Goal**: Aim for 200+ reviews with 4.8+ average to dominate local search

---

## HIPAA Compliance Notes

### What This Website Does (✅ Compliant)
- All booking handled by Unified Practice (HIPAA-compliant external platform)
- No intake forms, health questionnaires, or PHI collection on the website
- No patient portal or login on the website
- HIPAA notice displayed on Contact page
- Privacy Policy and HIPAA Notice links in footer

### What to Avoid (⚠️ Important)
- **Never** add a contact form that asks about health conditions
- **Never** store patient emails/names in website analytics tied to health data
- **Never** use chat widgets that could capture PHI without a BAA
- **Never** embed Unified Practice intake forms directly — always link out
- **Always** ensure any future email marketing platform has a signed BAA

---

## Before-Launch Checklist

- [ ] Replace all `PLACEHOLDER` URLs with actual Unified Practice booking link
- [ ] Replace `(702) 852-1280` with actual clinic phone number
- [ ] Replace email address with actual clinic email
- [ ] Verify street address is correct
- [ ] Add real team member names, credentials, and photos
- [ ] Upload professional clinic and treatment photos
- [ ] Add actual Google Business Profile review link
- [ ] Embed Google Maps iframe on Contact page
- [ ] Add real social media profile links
- [ ] Set up Google Analytics 4 and Google Search Console
- [ ] Submit sitemap to Google Search Console
- [ ] Add favicon and Open Graph images
- [ ] Test all pages on mobile devices
- [ ] Run PageSpeed Insights and fix any issues
- [ ] Verify Unified Practice booking flow works end-to-end
- [ ] Add SSL certificate (HTTPS required)
- [ ] Set up Google Business Profile with matching NAP info

---

## Tech Notes

- **No backend required** — pure static HTML/CSS/JS
- **Hosting recommendation**: Netlify, Vercel, or GitHub Pages (free SSL, fast CDN)
- **Font loading**: Google Fonts (DM Serif Display + Plus Jakarta Sans)
- **No external JS dependencies** — vanilla JS only
- **Mobile-first responsive** — tested at 320px, 768px, 1024px, 1440px breakpoints
