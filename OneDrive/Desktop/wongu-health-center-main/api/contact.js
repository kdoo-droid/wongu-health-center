export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    name,
    phone,
    email,
    patient_type,
    service,
    insurance,
    preferred_date,
    preferred_time,
    notes
  } = req.body;

  // Basic validation
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Name, phone, and email are required.' });
  }

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
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${patient_type || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Full Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${name}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${phone}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${email}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Service</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${service || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Insurance</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${insurance || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Preferred Date</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${preferred_date || 'Flexible'}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:0.9rem;">Preferred Time</td>
            <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">${preferred_time || 'Any time'}</td>
          </tr>
          ${notes ? `
          <tr>
            <td style="padding:10px 0;color:#6b7280;font-size:0.9rem;vertical-align:top;">Notes</td>
            <td style="padding:10px 0;color:#111827;">${notes}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px;">
          <p style="margin:0;font-size:0.85rem;color:#6b7280;">Reply directly to this email to respond to <strong>${name}</strong> at <a href="mailto:${email}" style="color:#7a9e7e;">${email}</a> or call <a href="tel:${phone}" style="color:#7a9e7e;">${phone}</a>.</p>
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wongu Health Center <onboarding@resend.dev>',
        to: ['clinic-office@wongu.edu'],
        reply_to: email,
        subject: `New Appointment Request — ${name} (${patient_type || 'Patient'})`,
        html
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await response.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email.' });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
