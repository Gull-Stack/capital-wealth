// Capital Wealth Advisors - Lead Submission API
// Emails via SendGrid, stores in Supabase (if configured), syncs to Salesforce

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SALES_EMAIL = process.env.SITE_EMAIL || 'info@capitalwealth.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'leads@gullstack.com';

// Salesforce Web-to-Lead config
const SF_OID = process.env.SALESFORCE_OID || '00DDm0000011JUMMA2';

async function syncToSalesforce(leadData) {
  try {
    // Split name into first/last
    const nameParts = (leadData.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    // Build description from all extra fields
    const descParts = [];
    if (leadData.savings) descParts.push(`Savings: ${leadData.savings}`);
    if (leadData.retirement_timeline) descParts.push(`Timeline: ${leadData.retirement_timeline}`);
    if (leadData.message) descParts.push(`Questions: ${leadData.message}`);
    if (leadData.submitted_from) descParts.push(`Page: ${leadData.submitted_from}`);
    if (leadData.utm_source) descParts.push(`UTM Source: ${leadData.utm_source}`);
    if (leadData.utm_medium) descParts.push(`UTM Medium: ${leadData.utm_medium}`);
    if (leadData.utm_campaign) descParts.push(`UTM Campaign: ${leadData.utm_campaign}`);

    const params = new URLSearchParams();
    params.append('oid', SF_OID);
    params.append('retURL', 'https://capitalwealth.com/');
    params.append('first_name', firstName);
    params.append('last_name', lastName);
    params.append('email', leadData.email || '');
    params.append('phone', leadData.phone || '');
    params.append('lead_source', 'Website Form');
    // Campaign association — standard Web-to-Lead field
    params.append('Campaign_ID', '701VS00000dB91aYAC');
    // Also set as custom field in case Campaign__c is required on Lead object
    params.append('Campaign__c', '701VS00000dB91aYAC');
    params.append('description', descParts.join('\n'));
    // Debug: sends Salesforce error details to email (remove after verification)
    params.append('debug', '1');
    params.append('debugEmail', 'bryce@gullstack.com');

    const response = await fetch(
      'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      }
    );
    return response.ok;
  } catch (e) {
    console.error('Salesforce Web-to-Lead sync failed:', e.message);
    return false;
  }
}

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
      firstName, lastName, agency, source, workshop_date, lead_type,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      referrer, landing_page, submitted_from, website
    } = req.body;

    // Honeypot — hidden field that bots auto-fill
    if (website) {
      return res.status(200).json({ success: true, message: "Thank you!" });
    }

    // Handle both combined name and separate firstName/lastName
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');
    
    if (!fullName || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required.' });
    }

    // Bot pattern detection — known spam patterns
    const spamPatterns = [/^(moving_|vulkan_|true_|888starz)/i, /@igurant/i, /@cool-affiliates/i, /mailinator\.com/i];
    if (spamPatterns.some(p => p.test(name) || p.test(email))) {
      return res.status(200).json({ success: true, message: "Thank you!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const leadData = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      first_name: firstName || fullName.split(' ')[0] || '',
      last_name: lastName || fullName.split(' ').slice(1).join(' ') || '',
      agency: agency || null,
      savings: savings || null,
      retirement_timeline: retirementTimeline || null,
      message: questions?.trim() || null,
      source: source || 'capitalwealth.com',
      lead_type: lead_type || 'general',
      workshop_date: workshop_date || null,
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
    // Store ALL form data - known columns go direct, extras go in message as JSON
    let savedLead = null;
    if (SUPABASE_URL && SUPABASE_KEY) {
      // Fields that exist in the Supabase leads table
      const knownColumns = ['name','email','phone','interest','concern','service','location',
        'message','source','status','email_sent','created_at','savings','retirement_timeline',
        'utm_source','utm_medium','utm_campaign','referrer','landing_page','submitted_from'];
      
      const supabaseData = {};
      const extraData = {};
      
      // Split data into known columns vs extras
      for (const [key, value] of Object.entries(leadData)) {
        if (value == null || value === '') continue;
        if (knownColumns.includes(key)) {
          supabaseData[key] = value;
        } else {
          extraData[key] = value;
        }
      }
      
      // Append extra fields to message so NOTHING is lost
      if (Object.keys(extraData).length > 0) {
        const extraText = Object.entries(extraData).map(([k,v]) => `${k}: ${v}`).join(' | ');
        supabaseData.message = supabaseData.message 
          ? `${supabaseData.message}\n\n--- Additional Data ---\n${extraText}`
          : `--- Form Data ---\n${extraText}`;
      }
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(supabaseData),
      });
      if (response.ok) {
        savedLead = await response.json();
      }
    }

    // Sync to Salesforce Web-to-Lead (fire-and-forget, don't block on failure)
    syncToSalesforce(leadData).catch(err => console.error('Salesforce sync error:', err.message));

    if (SENDGRID_API_KEY) {
      // Federal Workshop specific email template
      const isFederalWorkshop = lead_type === 'federal-workshop-registration';
      
      let confirmationHtml, emailSubject;
      
      if (isFederalWorkshop) {
        emailSubject = 'Workshop Confirmed: April 9 Federal Benefits Workshop';
        confirmationHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #194F90 0%, #15437a 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">You're Registered!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px;">Federal Employee Benefits Workshop</p>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #F09F54;">
                <h2 style="color: #194F90; margin: 0 0 15px 0; font-size: 20px;">📅 Workshop Details</h2>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Date:</strong> Thursday, April 9, 2026</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Time:</strong> 9:00 AM - 11:00 AM</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Location:</strong> Weber State University - Davis Campus</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Address:</strong> 2750 University Park Blvd, Layton, UT 84041</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Arrival:</strong> Please arrive 10-15 minutes early</p>
              </div>
              
              <h3 style="color: #194F90; margin: 25px 0 15px 0;">Before the Workshop</h3>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px 0; color: #374151; font-weight: 600;">1. Request Official Time</p>
                <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Download and submit your SF-182 form to attend this professional development workshop.</p>
                
                <p style="margin: 15px 0 10px 0; color: #374151; font-weight: 600;">2. Add to Calendar</p>
                <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Block your calendar for April 9, 9:00-11:00 AM.</p>
                
                <p style="margin: 15px 0 10px 0; color: #374151; font-weight: 600;">3. Invite Colleagues</p>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Share this opportunity with fellow federal employees.</p>
              </div>
              
              <div style="background: #194F90; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 25px;">
                <h4 style="margin: 0 0 10px 0; color: white;">Questions?</h4>
                <p style="margin: 0; color: rgba(255,255,255,0.9);">Call us at <strong>(801) 210-2800</strong> or email info@capitalwealth.com</p>
              </div>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">Capital Wealth Advisors • Lehi, UT • (801) 210-2800</p>
            </div>
          </div>
        `;
      } else {
        emailSubject = 'Your Consultation Request — Capital Wealth Advisors';
        confirmationHtml = `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1a2332 0%, #2a3a4a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #c9a96e; margin: 0; font-size: 24px;">Thank You, ${fullName}</h1>
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
      }

      await sendEmail({
        to: email,
        from: FROM_EMAIL,
        subject: emailSubject,
        html: confirmationHtml,
      });

      // Send notification to Mike / sales team
      let notificationSubject, notificationHtml;
      
      if (isFederalWorkshop) {
        notificationSubject = `🎯 Federal Workshop Registration: ${leadData.name} — April 9, 2026`;
        notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #194F90; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎯 Federal Workshop Registration</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">April 9, 2026 Workshop</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: #F09F54; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">HIGH-VALUE FEDERAL EMPLOYEE LEAD</h2>
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Agency:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.agency || 'Not specified'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Workshop Date:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.workshop_date || 'April 9, 2026'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Lead Type:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">Federal Workshop Registration</td></tr>
              </table>
              
              <div style="background: #e6f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #194F90;">
                <h3 style="margin: 0 0 10px 0; color: #194F90;">👥 Workshop Action Items</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #374151;">
                  <li>Add to workshop attendance list (max 50 people)</li>
                  <li>Send SF-182 form for official time request</li>
                  <li>Follow up with federal benefits consultation offer</li>
                  <li>High conversion potential - federal employee with active interest</li>
                </ul>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; border: 1px solid #b3d9e6;">
                <h3 style="margin: 0 0 10px 0; color: #1a2332;">Lead Source</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 5px;"><strong>Source:</strong></td><td style="padding: 5px;">${leadData.source || 'Federal Workshop Landing Page'}</td></tr>
                  ${leadData.submitted_from ? `<tr><td style="padding: 5px;"><strong>Page:</strong></td><td style="padding: 5px;">${leadData.submitted_from}</td></tr>` : ''}
                  ${leadData.utm_source ? `<tr><td style="padding: 5px;"><strong>UTM Source:</strong></td><td style="padding: 5px;">${leadData.utm_source}</td></tr>` : ''}
                  ${leadData.utm_campaign ? `<tr><td style="padding: 5px;"><strong>UTM Campaign:</strong></td><td style="padding: 5px;">${leadData.utm_campaign}</td></tr>` : ''}
                </table>
              </div>
            </div>
            <div style="background: #194F90; padding: 15px; text-align: center;">
              <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">Federal Workshop Registration from capitalwealth.com</p>
            </div>
          </div>
        `;
      } else {
        notificationSubject = `New Consultation: ${leadData.name} — ${leadData.savings || 'General Inquiry'}`;
        notificationHtml = `
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
      }

      await sendEmail({
        to: SALES_EMAIL,
        from: FROM_EMAIL,
        fromName: `${leadData.name} via Capital Wealth`,
        subject: notificationSubject,
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
