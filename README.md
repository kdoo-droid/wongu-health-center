# Wongu Health Center — Image Guide

## Appointment Form Email

The appointment form posts to `/api/contact`, which sends email through Resend.
Production deployments need these environment variables:

- `RESEND_API_KEY`: Resend API key with sending access.
- `RESEND_FROM_EMAIL`: verified sender, normally `Wongu Health Center <appointments@wonguhealthcenter.com>`.
- `CLINIC_APPOINTMENT_EMAIL`: optional recipient override; defaults to `clinic-office@wongu.edu`.

Do not use `onboarding@resend.dev` in production. Resend treats it as a test sender
and can reject real recipient emails with a 403.

## Folder Structure
Put all your photos in this `/images` folder. Use the exact filenames below
so they match what's already referenced in the HTML.

## Required Images

### Homepage
| Filename | Where It Shows | Recommended Size | What to Shoot |
|----------|---------------|-----------------|---------------|
| `hero-clinic.jpg` | Hero section (main image) | 800x1000px | Licensed acupuncturist treating patient in clean clinic |
| `clinic-room.jpg` | "Why Wongu" section | 800x600px | Bright treatment room with clean linens, calming decor |

### About Page
| Filename | Where It Shows | Recommended Size | What to Shoot |
|----------|---------------|-----------------|---------------|
| `clinic-exterior.jpg` | Mission section | 800x600px | Wongu Health Center building/entrance or reception area |
| `team-director.jpg` | Team section | 400x400px | Clinical Director headshot (square crop) |
| `team-omd-1.jpg` | Team section | 400x400px | Supervising OMD #1 headshot (square crop) |
| `team-omd-2.jpg` | Team section | 400x400px | Supervising OMD #2 headshot (square crop) |

### Services Page
| Filename | Where It Shows | Recommended Size | What to Shoot |
|----------|---------------|-----------------|---------------|
| `service-acupuncture.jpg` | Acupuncture section | 800x600px | Needles on patient's back, clean clinical setting |
| `service-cupping.jpg` | Cupping section | 800x600px | Cupping therapy in progress |
| `service-herbal.jpg` | Herbal Medicine section | 800x600px | Herbal dispensary / organized herb jars |

### Student Clinic Page
| Filename | Where It Shows | Recommended Size | What to Shoot |
|----------|---------------|-----------------|---------------|
| `intern-treatment.jpg` | How It Works section | 800x600px | Intern treating patient while OMD supervises |

## Photo Tips
- Shoot in landscape (4:3 ratio) for content sections, square for headshots
- Use natural lighting if possible — avoid harsh flash
- Keep backgrounds clean and uncluttered
- Get written patient consent for any photos showing patients
- Compress images before uploading (use tinypng.com or squoosh.app)
- Save as .jpg for photos, .png only if transparency is needed
- Aim for 100-300KB per image after compression for fast loading
