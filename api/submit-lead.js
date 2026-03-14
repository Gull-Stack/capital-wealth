// Capital Wealth Advisors - Lead Submission API
// Emails via SendGrid, stores in Supabase (if configured)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SALES_EMAIL = process.env.SITE_EMAIL || 'info@capitalwealth.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'leads@gullstack.com';

async function sendEmail({ to, from, fromName, subject, html, replyTo, cc }) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], ...(cc ? { cc: [{ email: cc }] } : {}) }],
      from: { email: from, name: fromName || 'Capital Wealth Advisors' },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      name, email, phone, savings, retirementTimeline, questions,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer, landing_page, submitted_from
    } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      savings: savings || null,
      retirement_timeline: retirementTimeline || null,
      message: questions?.trim() || null,
      source: 'capitalwealth.com',
      status: 'new',
      email_sent: false,
      created_at: new Date().toISOString(),
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      referrer: referrer || null,
      landing_page: landing_page || null,
      submitted_from: submitted_from || null,
    };

    // Insert into Supabase (if configured)
    let savedLead = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(leadData),
      });
      if (response.ok) {
        savedLead = await response.json();
      }
    }

    if (SENDGRID_API_KEY) {
      // Send confirmation to the prospect
      const confirmationHtml = `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a2332 0%, #2a3a4a 100%); padding: 30px; text-align: center;">
            <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">Thank You, ${name}</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">We've received your consultation request</p>
          </div>
          <div style="padding: 30px; background: #faf9f7;">
            <p style="font-size: 16px; color: #333; line-height: 1.7;">Our team will contact you within one business day to schedule your complimentary consultation.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e5e5; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Savings Range:</strong> ${savings || 'Not specified'}</p>
              <p style="margin: 5px 0;"><strong>Timeline:</strong> ${retirementTimeline || 'Not specified'}</p>
              ${questions ? `<p style="margin: 5px 0;"><strong>Questions:</strong> ${questions}</p>` : ''}
            </div>
            <p style="font-size: 16px; color: #333;">In the meantime, feel free to call us at <strong>801.210.2800</strong> if you have any questions.</p>
          </div>
          <div style="background: #1a2332; padding: 20px; text-align: center;">
            <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Capital Wealth Advisors &bull; Lehi, UT &bull; 801.210.2800</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: email,
        from: FROM_EMAIL,
        subject: 'Your Consultation Request — Capital Wealth Advisors',
        html: confirmationHtml,
      });

      // Send notification to Mike / sales team
      const notificationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a2332; padding: 20px; text-align: center;">
            <h1 style="color: #c9a96e; margin: 0;">New Consultation Request</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Savings:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.savings || 'Not specified'}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Timeline:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.retirement_timeline || 'Not specified'}</td></tr>
            </table>
            ${leadData.message ? `<div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px; border: 1px solid #ddd;"><strong>Questions/Comments:</strong><br/><p style="margin: 10px 0 0 0;">${leadData.message}</p></div>` : ''}
            <div style="margin-top: 20px; padding: 15px; background: #e8f4f8; border-radius: 8px; border: 1px solid #b3d9e6;">
              <h3 style="margin: 0 0 10px 0; color: #1a2332;">Lead Source</h3>
              <table style="width: 100%; border-collapse: collapse;">
                ${leadData.utm_source ? `<tr><td style="padding: 5px;"><strong>UTM Source:</strong></td><td style="padding: 5px;">${leadData.utm_source}</td></tr>` : ''}
                ${leadData.utm_medium ? `<tr><td style="padding: 5px;"><strong>UTM Medium:</strong></td><td style="padding: 5px;">${leadData.utm_medium}</td></tr>` : ''}
                ${leadData.utm_campaign ? `<tr><td style="padding: 5px;"><strong>UTM Campaign:</strong></td><td style="padding: 5px;">${leadData.utm_campaign}</td></tr>` : ''}
                ${leadData.referrer ? `<tr><td style="padding: 5px;"><strong>Referrer:</strong></td><td style="padding: 5px;">${leadData.referrer}</td></tr>` : ''}
                ${leadData.landing_page ? `<tr><td style="padding: 5px;"><strong>Landing Page:</strong></td><td style="padding: 5px;"><a href="${leadData.landing_page}">${leadData.landing_page}</a></td></tr>` : ''}
                ${leadData.submitted_from ? `<tr><td style="padding: 5px;"><strong>Submitted From:</strong></td><td style="padding: 5px;">${leadData.submitted_from}</td></tr>` : ''}
              </table>
            </div>
          </div>
          <div style="background: #1a2332; padding: 15px; text-align: center;">
            <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 12px;">Lead from capitalwealth.com</p>
          </div>
        </div>
      `;

      await sendEmail({
        to: SALES_EMAIL,
        from: FROM_EMAIL,
        fromName: `${leadData.name} via Capital Wealth`,
        subject: `New Consultation: ${leadData.name} — ${leadData.savings || 'General Inquiry'}`,
        html: notificationHtml,
        replyTo: leadData.email,
        cc: 'bryce@gullstack.com',
      });

      // Mark email as sent
      if (savedLead?.[0]?.id && SUPABASE_URL && SUPABASE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${savedLead[0].id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
          body: JSON.stringify({ email_sent: true }),
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Thank you! We'll contact you within one business day to schedule your consultation.",
    });

  } catch (error) {
    console.error('Lead submission error:', error);
    return res.status(500).json({
      error: 'Something went wrong. Please try again or call us at 801.210.2800.',
    });
  }
}
