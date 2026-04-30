// Capital Wealth - Lead Submission API
// Emails via SendGrid, stores in Supabase (if configured), syncs to Salesforce

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SALES_EMAIL = process.env.SITE_EMAIL || 'info@capitalwealth.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'leads@gullstack.com';

// Salesforce Web-to-Lead config
const SF_OID = process.env.SALESFORCE_OID || '00DDm0000011JUMMA2';
// Default Campaign ID used when the form does not send one.
const SF_DEFAULT_CAMPAIGN_ID = '701VS00000dB91aYAC'; // Website Form 2026

// Validate a Salesforce Campaign Id (15 or 18 chars, must start with "701").
function isValidCampaignId(id) {
  return typeof id === 'string' && /^701[A-Za-z0-9]{12}([A-Za-z0-9]{3})?$/.test(id);
}

// LeadSource picklist values the form is allowed to set. Anything else falls
// back to 'Website Form'. Keep in sync with the Lead.LeadSource picklist.
const ALLOWED_LEAD_SOURCES = new Set([
  'Website Form',
  'Client Ambassador Referral',
  'COI Referral',
  'Webinar',
]);

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
    if (leadData.utm_content) descParts.push(`UTM Content: ${leadData.utm_content}`);
    if (leadData.utm_term) descParts.push(`UTM Term: ${leadData.utm_term}`);
    if (leadData.referrer) descParts.push(`Referrer: ${leadData.referrer}`);
    // Federal webinar (May 14, 2026) extras — until custom Lead fields are
    // mapped in Web-to-Lead, dump these into description so nothing is lost.
    if (leadData.retirement_system) descParts.push(`Retirement System: ${leadData.retirement_system}`);
    if (leadData.years_to_retirement) descParts.push(`Years to Retirement: ${leadData.years_to_retirement}`);
    if (leadData.agency) descParts.push(`Federal Agency: ${leadData.agency}`);
    if (leadData.bringing_guest) descParts.push(`Bringing Guest: ${leadData.bringing_guest}`);
    if (leadData.guest_first_name || leadData.guest_last_name || leadData.guest_email) {
      const guestName = [leadData.guest_first_name, leadData.guest_last_name].filter(Boolean).join(' ');
      descParts.push(`Guest: ${guestName || '—'}${leadData.guest_email ? ` <${leadData.guest_email}>` : ''}`);
    }
    if (leadData.event_date) descParts.push(`Event Date: ${leadData.event_date}`);
    // Special category (6c / LEO / Firefighter / ATC). Once the
    // `special_category__c` custom field exists on the SF Lead object, swap this
    // to a real Web-to-Lead field POST instead of stuffing it into description.
    if (leadData.special_category === true) descParts.push(`Special Category (6c): YES`);

    // Campaign routing: form can pass `campaign_id` via hidden input; otherwise
    // fall back to the site-wide default. Invalid values are discarded.
    const campaignId = isValidCampaignId(leadData.campaign_id)
      ? leadData.campaign_id
      : SF_DEFAULT_CAMPAIGN_ID;

    // Federal webinar submissions always set LeadSource = 'Webinar' regardless
    // of what the form sends, per CMO requirement.
    const isWebinarLead = leadData.lead_type === 'federal-webinar-registration';
    const leadSource = isWebinarLead
      ? 'Webinar'
      : (ALLOWED_LEAD_SOURCES.has(leadData.lead_source) ? leadData.lead_source : 'Website Form');

    const params = new URLSearchParams();
    params.append('oid', SF_OID);
    params.append('retURL', 'https://capitalwealth.com/');
    params.append('first_name', firstName);
    params.append('last_name', lastName);
    params.append('email', leadData.email || '');
    params.append('phone', leadData.phone || '');
    params.append('lead_source', leadSource);
    params.append('Campaign_ID', campaignId);
    params.append('member_status', 'Responded');
    params.append('description', descParts.join('\n'));

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
      from: { email: from, name: fromName || 'Capital Wealth' },
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  return response.ok;
}

export default async function handler(req, res) {
  const ALLOWED_ORIGINS = ['https://www.capitalwealth.com', 'https://capitalwealth.com', 'https://capitalwealthfederal.com', 'https://www.capitalwealthfederal.com', 'https://gullstack.com', 'https://www.gullstack.com'];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      name, email, phone, savings, retirementTimeline, questions,
      firstName, lastName, agency, employer, source, workshop_date, lead_type,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      gclid, fbclid, state, variant, campaign_id, lead_source,
      referrer, landing_page, submitted_from, website,
      // Federal webinar (May 14, 2026) fields — additive, optional except
      // when lead_type === 'federal-webinar-registration'.
      retirement_system, years_to_retirement,
      bringing_guest, guest_first_name, guest_last_name, guest_email, guest_phone,
      event_date,
      // 6c / Special Category employee (LEO, FF, ATC) — federal events only.
      special_category,
    } = req.body;

    // Honeypot — hidden field that bots auto-fill
    if (website) {
      return res.status(200).json({ success: true, message: "Thank you!" });
    }

    // Handle both combined name and separate firstName/lastName
    const fullName = name || (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName || '');

    // The 10-Things checklist variant is email-only (no phone required).
    // Everything else still requires name/email/phone.
    const is10ThingsChecklist = lead_type === '10things-checklist' || variant === 'checklist';

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (!is10ThingsChecklist && !phone) {
      return res.status(400).json({ error: 'Phone is required.' });
    }

    // Federal webinar requires retirement_system + years_to_retirement server-side.
    const isFederalWebinar = lead_type === 'federal-webinar-registration';
    if (isFederalWebinar) {
      const allowedSystems = ['FERS', 'CSRS', 'CSRS-Offset', 'Unsure'];
      const allowedYears = ['lt-2', '2-5', '5-10', '10-plus', 'already-retired'];
      if (!retirement_system || !allowedSystems.includes(retirement_system)) {
        return res.status(400).json({ error: 'Retirement system is required.' });
      }
      if (!years_to_retirement || !allowedYears.includes(years_to_retirement)) {
        return res.status(400).json({ error: 'Years to retirement is required.' });
      }
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

    // 10-Things landing page: build a CRM-friendly tag like
    // LP-10Things-UT-Review or LP-10Things-OTHER-Checklist.
    const is10Things = landing_page === '10-things-federal-retirement'
      || (lead_type && lead_type.startsWith('10things-'));
    let tenThingsTag = null;
    if (is10Things) {
      const stateCode = (state || '').toUpperCase();
      const statePart = ['UT', 'WY', 'ID'].includes(stateCode) ? stateCode : 'OTHER';
      const variantPart = is10ThingsChecklist ? 'Checklist' : 'Review';
      tenThingsTag = `LP-10Things-${statePart}-${variantPart}`;
    }

    const leadData = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      first_name: firstName || fullName.split(' ')[0] || '',
      last_name: lastName || fullName.split(' ').slice(1).join(' ') || '',
      agency: agency || null,
      employer: employer || null,
      state: state || null,
      variant: variant || null,
      tag: tenThingsTag,
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
      gclid: gclid || null,
      fbclid: fbclid || null,
      campaign_id: campaign_id || null,
      lead_source: lead_source || null,
      referrer: referrer || null,
      landing_page: landing_page || null,
      submitted_from: submitted_from || null,
      // Federal webinar fields (null for non-webinar submissions)
      retirement_system: retirement_system || null,
      years_to_retirement: years_to_retirement || null,
      bringing_guest: bringing_guest || null,
      guest_first_name: guest_first_name || null,
      guest_last_name: guest_last_name || null,
      guest_email: guest_email || null,
      guest_phone: guest_phone || null,
      event_date: event_date || null,
      // Coerce common truthy form values ("true", true, "on") to a real boolean.
      special_category:
        special_category === true || special_category === 'true' || special_category === 'on'
          ? true
          : false,
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

      if (is10Things) {
        // 10 Things landing page — two flavors: review or checklist
        if (is10ThingsChecklist) {
          emailSubject = 'Your 10-Point Federal Retirement Checklist — Capital Wealth';
          confirmationHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A3161; padding: 32px; text-align: center; color: white;">
                <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 700;">Here's your 10-point checklist.</h1>
                <p style="color: rgba(255,255,255,0.88); margin: 12px 0 0 0; font-size: 16px;">Federal retirement moves most people miss — pulled from our Weber State workshop.</p>
              </div>
              <div style="padding: 32px; background: #ffffff;">
                <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65; margin: 0 0 20px;">Thanks for requesting the checklist, ${fullName.split(' ')[0]}. We're attaching the PDF — if you don't see it, reply and we'll resend.</p>
                <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65; margin: 0 0 24px;">Two reminders as you work through it:</p>
                <ul style="font-size: 15px; color: #1a1a1a; line-height: 1.6; padding-left: 20px;">
                  <li style="margin-bottom: 10px;"><strong>Item #1</strong> (download your eOPF) is the single highest-value 20 minutes you'll spend this month. Do it before you forget.</li>
                  <li style="margin-bottom: 10px;"><strong>Item #8</strong> (FEHB 5-year rule) is the one that wipes out coverage for life if you miss it. Don't skip it.</li>
                </ul>
                <div style="background: #f8f9fb; padding: 20px; border-left: 4px solid #B31942; border-radius: 4px; margin: 24px 0;">
                  <p style="margin: 0 0 12px 0; font-weight: 700; color: #0A3161;">Want these reviewed against your actual numbers?</p>
                  <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.55;">30 minutes. No products sold. No homework. We'll pull up your pension, TSP, FEHB, and Social Security numbers and walk through the moves.</p>
                  <a href="https://www.capitalwealth.com/l/10-things-federal-retirement/#book-review" style="display: inline-block; background: #B31942; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700;">Book my complimentary review →</a>
                </div>
                <p style="font-size: 14px; color: #4b5563; margin: 24px 0 0;">Questions? Call <a href="tel:8012102800" style="color: #0A3161; font-weight: 600;">801.210.2800</a> or just reply to this email.</p>
              </div>
              <div style="background: #081f3f; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">Capital Wealth · Lehi, UT · Fiduciary advice · Not affiliated with OPM or the U.S. government.</p>
              </div>
            </div>
          `;
        } else {
          // 10-Things review request
          emailSubject = 'Your Federal Benefits Review — we\'ll be in touch shortly';
          confirmationHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #0A3161; padding: 32px; text-align: center; color: white;">
                <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 700;">You're on the list, ${fullName.split(' ')[0]}.</h1>
                <p style="color: rgba(255,255,255,0.88); margin: 12px 0 0 0; font-size: 16px;">Complimentary federal benefits review — Capital Wealth.</p>
              </div>
              <div style="padding: 32px; background: #ffffff;">
                <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65; margin: 0 0 20px;">We've got your request. A member of our team will call or email within one business day to confirm your time.</p>
                <div style="background: #f8f9fb; padding: 20px; border-radius: 8px; border-left: 4px solid #B31942; margin: 24px 0;">
                  <h3 style="margin: 0 0 12px 0; color: #0A3161; font-size: 16px;">What we'll cover (60–90 min)</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #1a1a1a; font-size: 15px; line-height: 1.6;">
                    <li>FERS pension estimate vs. your high-3</li>
                    <li>TSP allocation + Roth catch-up rules for 2026</li>
                    <li>FEHB 5-year rule check</li>
                    <li>Social Security coordination timing</li>
                    <li>Survivor benefit and retirement date stacking</li>
                  </ul>
                </div>
                <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65;">In the meantime, you can reach us at <a href="tel:8012102800" style="color: #0A3161; font-weight: 600;">801.210.2800</a> or reply to this email with any questions.</p>
              </div>
              <div style="background: #081f3f; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px;">Capital Wealth · Lehi, UT · Fiduciary advice · Not affiliated with OPM or the U.S. government.</p>
              </div>
            </div>
          `;
        }
      } else if (isFederalWebinar) {
        emailSubject = 'You\'re Registered: Federal Benefits Webinar — May 14, 2026';
        confirmationHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #16253C 0%, #0f2b4a 100%); padding: 32px; text-align: center; color: white;">
              <h1 style="color: #FDD25E; margin: 0; font-size: 28px; font-weight: 700;">You're Registered.</h1>
              <p style="color: rgba(255,255,255,0.92); margin: 12px 0 0 0; font-size: 16px;">Federal Benefits Webinar — Live Online Masterclass</p>
            </div>
            <div style="padding: 32px; background: #ffffff;">
              <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65; margin: 0 0 16px;">Thanks ${fullName.split(' ')[0]} — your seat is reserved.</p>
              <div style="background: #f8f9fb; padding: 20px; border-radius: 8px; border-left: 4px solid #C4A82A; margin: 16px 0 24px;">
                <h3 style="margin: 0 0 12px 0; color: #16253C; font-size: 16px;">Event Details</h3>
                <p style="margin: 6px 0; font-size: 15px; color: #1a1a1a;"><strong>Date:</strong> Thursday, May 14, 2026</p>
                <p style="margin: 6px 0; font-size: 15px; color: #1a1a1a;"><strong>Time:</strong> 6:00 PM – 8:00 PM Mountain (8 PM ET / 5 PM PT)</p>
                <p style="margin: 6px 0; font-size: 15px; color: #1a1a1a;"><strong>Platform:</strong> Zoom Webinars (no Zoom account required)</p>
                <p style="margin: 6px 0; font-size: 15px; color: #1a1a1a;"><strong>Instructor:</strong> Ann Werts</p>
              </div>
              <p style="font-size: 15px; color: #4b5563; line-height: 1.65;">We'll send a reminder 3 days out and your unique Zoom join link the morning of May 14. If you can't attend live, the full replay will be emailed to you within 48 hours.</p>
              <div style="background: #16253C; color: #fff; padding: 18px 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
                <p style="margin: 0 0 12px 0; color: #FDD25E; font-size: 13px; letter-spacing: 0.05em; text-transform: uppercase;">Optional Next Step</p>
                <p style="margin: 0 0 14px 0; color: #fff; font-size: 15px; line-height: 1.5;">Want Ann's team to apply this to your specific FERS / TSP / FEHB numbers? Book a complimentary Federal Retirement Money Map.</p>
                <a href="https://www.capitalwealth.com/contact/" style="display: inline-block; background: #FDD25E; color: #0F1A2A; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700;">Schedule My Money Map →</a>
              </div>
              <p style="font-size: 14px; color: #4b5563; margin: 24px 0 0;">Questions? Call <a href="tel:8012102800" style="color: #16253C; font-weight: 600;">801.210.2800</a> or just reply to this email.</p>
            </div>
            <div style="background: #0F1A2A; padding: 18px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px; line-height: 1.55;">Capital Wealth · Lehi, UT · Fiduciary advice · Not affiliated with OPM or the U.S. government.</p>
            </div>
          </div>
        `;
      } else if (isFederalWorkshop) {
        // Per-event venue / date / parking. Add a new event by adding a new
        // entry keyed by `source` (matches the hidden form field on each landing).
        // Fallback covers legacy / April 9 Weber State submissions.
        const SITE = 'https://www.capitalwealth.com';
        const WORKSHOP_EVENTS = {
          'federal-benefits-workshop-ogden': {
            heading: 'Federal Benefits Workshop — Ogden',
            dateLabel: 'Tuesday, May 19, 2026',
            time: '4:30 PM – 6:30 PM Mountain',
            venue: 'Weber County Main Library',
            address: '2464 Jefferson Ave, Ogden, UT 84401',
            parkingHtml: '<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Parking:</strong> Free on-site parking — no permit required.</p>',
            extraSectionHtml: '',
            icsUrl: SITE + '/assets/webinars/federal-benefits-workshop-ogden-2026-05-19.ics',
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Weber+County+Main+Library+2464+Jefferson+Ave+Ogden+UT',
            subjectDate: 'May 19'
          },
          'federal-benefits-workshop-slc': {
            heading: 'Federal Benefits Workshop — Salt Lake City',
            dateLabel: 'Wednesday, May 20, 2026',
            time: '4:00 PM – 6:00 PM Mountain',
            venue: 'University Guest House (University of Utah)',
            address: '110 S Fort Douglas Blvd, Salt Lake City, UT 84113',
            parkingHtml: '<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Parking:</strong> Visitor parking available on-site at the Guest House.</p>',
            extraSectionHtml: '',
            icsUrl: SITE + '/assets/webinars/federal-benefits-workshop-slc-2026-05-20.ics',
            mapsUrl: 'https://www.google.com/maps/search/?api=1&query=University+Guest+House+110+S+Fort+Douglas+Blvd+Salt+Lake+City+UT',
            subjectDate: 'May 20'
          },
          'federal-benefits-workshop-hill-afb': {
            heading: 'Federal Benefits Workshop — Hill AFB / Weber State Davis Campus',
            dateLabel: 'Thursday, May 21, 2026',
            time: '6:00 PM – 8:00 PM Mountain',
            venue: 'Weber State University — Davis Campus, D2 Building, Room 117',
            address: '2750 University Park Blvd, Layton, UT 84041',
            parkingHtml: '<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Parking:</strong> Permit covered by Capital Wealth — must be PRINTED and placed on driver\'s side dashboard. Digital phone display will not work. Valid in DAVIS W LOTS ONLY.</p>',
            // Hill AFB attendees need the Weber State printable parking permit
            // featured prominently in the email body.
            extraSectionHtml: `
              <div style="background: #fff8dc; border-left: 4px solid #C4A82A; padding: 18px 20px; border-radius: 6px; margin-top: 20px;">
                <h3 style="margin: 0 0 8px 0; color: #16253C; font-size: 16px;">Action required: print your parking permit</h3>
                <p style="margin: 0 0 12px 0; color: #4b5563; font-size: 14px; line-height: 1.55;">Weber State requires a printed parking permit on the dashboard. Please print this before the event:</p>
                <a href="${SITE}/assets/parking/weber-state-davis-parking-permit.pdf" style="display: inline-block; background: #16253C; color: #fff; padding: 12px 22px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Download &amp; Print Parking Permit (PDF)</a>
              </div>
            `,
            icsUrl: SITE + '/assets/webinars/federal-benefits-workshop-hill-afb-2026-05-21.ics',
            mapsUrl: 'https://www.weber.edu/maps/davis-campus.html',
            subjectDate: 'May 21'
          }
        };
        const fallbackEvent = {
          heading: 'Federal Benefits Workshop',
          dateLabel: 'Thursday, April 9, 2026',
          time: '9:00 AM – 11:00 AM Mountain',
          venue: 'Weber State University — Davis Campus',
          address: '2750 University Park Blvd, Layton, UT 84041',
          parkingHtml: '<p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Parking:</strong> Permit covered by Capital Wealth — must be printed.</p>',
          extraSectionHtml: '',
          icsUrl: '',
          mapsUrl: '',
          subjectDate: 'April 9'
        };
        const evt = WORKSHOP_EVENTS[source] || fallbackEvent;

        emailSubject = `Workshop Confirmed: ${evt.heading} — ${evt.subjectDate}`;
        confirmationHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #16253C 0%, #0f2b4a 100%); padding: 30px; text-align: center; color: white;">
              <h1 style="color: #FDD25E; margin: 0; font-size: 28px; font-weight: 700;">You're Registered!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">${evt.heading}</p>
            </div>
            <div style="padding: 30px; background: #ffffff;">
              <p style="font-size: 16px; color: #1a1a1a; line-height: 1.65; margin: 0 0 16px;">Thanks ${fullName.split(' ')[0]} — your seat is reserved.</p>
              <div style="background: #f8fafc; padding: 22px; border-radius: 12px; margin-bottom: 22px; border-left: 4px solid #C4A82A;">
                <h2 style="color: #16253C; margin: 0 0 14px 0; font-size: 18px;">Event Details</h2>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Date:</strong> ${evt.dateLabel}</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Time:</strong> ${evt.time}</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Venue:</strong> ${evt.venue}</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Address:</strong> ${evt.address}</p>
                ${evt.parkingHtml}
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Arrival:</strong> Please arrive 10–15 minutes early.</p>
                <p style="margin: 8px 0; font-size: 16px; color: #374151;"><strong>Instructor:</strong> Ann Werts</p>
                ${evt.icsUrl ? `<p style="margin: 14px 0 0 0;"><a href="${evt.icsUrl}" style="display: inline-block; background: #FDD25E; color: #0F1A2A; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Add to Calendar (.ics)</a>${evt.mapsUrl ? ` &nbsp;<a href="${evt.mapsUrl}" style="display: inline-block; background: #16253C; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">Get Directions</a>` : ''}</p>` : ''}
              </div>
              ${evt.extraSectionHtml}
              <div style="background: #16253C; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #FDD25E;">Questions?</h4>
                <p style="margin: 0; color: rgba(255,255,255,0.9);">Call <strong>(801) 210-2800</strong> or just reply to this email.</p>
              </div>
            </div>
            <div style="background: #0F1A2A; padding: 18px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px; line-height: 1.55;">Capital Wealth · Lehi, UT · Fiduciary advice · Not affiliated with OPM or the U.S. government.</p>
            </div>
          </div>
        `;
      } else {
        emailSubject = 'Your Consultation Request — Capital Wealth';
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
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 14px;">Capital Wealth &bull; Lehi, UT &bull; 801.210.2800</p>
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

      if (is10Things) {
        const variantLabel = is10ThingsChecklist ? 'Checklist Download' : 'Benefits Review Request';
        const priority = is10ThingsChecklist ? '📬 Checklist Lead' : '🎯 Review Request';
        notificationSubject = `${priority} — ${leadData.name}${leadData.state ? ` (${leadData.state})` : ''} · ${tenThingsTag}`;
        notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #0A3161; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 22px;">${priority}</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0;">10 Things Federal Retirement — ${variantLabel}</p>
            </div>
            <div style="padding: 28px; background: #f9f9f9;">
              <div style="background: ${is10ThingsChecklist ? '#0A3161' : '#B31942'}; color: #fff; padding: 14px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 700;">
                CRM Tag: ${tenThingsTag}
              </div>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                ${leadData.phone ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>` : ''}
                ${leadData.agency ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Agency:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.agency}</td></tr>` : ''}
                ${leadData.state ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>State:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.state}</td></tr>` : ''}
                ${leadData.retirement_timeline ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Timeline:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.retirement_timeline}</td></tr>` : ''}
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Variant:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${variantLabel}</td></tr>
              </table>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-top: 20px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 12px 0; color: #0A3161; font-size: 14px;">Attribution</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  ${leadData.utm_source ? `<tr><td style="padding: 4px;"><strong>UTM Source:</strong></td><td style="padding: 4px;">${leadData.utm_source}</td></tr>` : ''}
                  ${leadData.utm_medium ? `<tr><td style="padding: 4px;"><strong>UTM Medium:</strong></td><td style="padding: 4px;">${leadData.utm_medium}</td></tr>` : ''}
                  ${leadData.utm_campaign ? `<tr><td style="padding: 4px;"><strong>UTM Campaign:</strong></td><td style="padding: 4px;">${leadData.utm_campaign}</td></tr>` : ''}
                  ${leadData.utm_content ? `<tr><td style="padding: 4px;"><strong>UTM Content:</strong></td><td style="padding: 4px;">${leadData.utm_content}</td></tr>` : ''}
                  ${leadData.utm_term ? `<tr><td style="padding: 4px;"><strong>UTM Term:</strong></td><td style="padding: 4px;">${leadData.utm_term}</td></tr>` : ''}
                  ${leadData.gclid ? `<tr><td style="padding: 4px;"><strong>gclid:</strong></td><td style="padding: 4px; font-family: monospace; font-size: 11px; word-break: break-all;">${leadData.gclid}</td></tr>` : ''}
                  ${leadData.fbclid ? `<tr><td style="padding: 4px;"><strong>fbclid:</strong></td><td style="padding: 4px; font-family: monospace; font-size: 11px; word-break: break-all;">${leadData.fbclid}</td></tr>` : ''}
                  ${leadData.referrer ? `<tr><td style="padding: 4px;"><strong>Referrer:</strong></td><td style="padding: 4px; font-size: 12px;">${leadData.referrer}</td></tr>` : ''}
                </table>
              </div>
              ${is10ThingsChecklist ? `
                <div style="background: #fff8dc; padding: 14px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #B31942; font-size: 13px;">
                  <strong>Next:</strong> Checklist PDF not yet attached to email. Add to 5-email nurture sequence in ESP once wired up.
                </div>
              ` : `
                <div style="background: #e8f4f8; padding: 14px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #0A3161; font-size: 13px;">
                  <strong>Next:</strong> Call within 1 business day to confirm intro-call time. Review: 20 min intro → 60–90 min full review → written action plan.
                </div>
              `}
            </div>
            <div style="background: #081f3f; padding: 14px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 11px;">10 Things Federal Retirement · capitalwealth.com/l/10-things-federal-retirement/</p>
            </div>
          </div>
        `;
      } else if (isFederalWebinar) {
        const yearsLabel = {
          'lt-2': '<2 yrs',
          '2-5': '2–5 yrs',
          '5-10': '5–10 yrs',
          '10-plus': '10+ yrs',
          'already-retired': 'Already retired'
        }[leadData.years_to_retirement] || leadData.years_to_retirement || '—';
        const guestRow = leadData.bringing_guest === 'yes'
          ? `<tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Guest:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${[leadData.guest_first_name, leadData.guest_last_name].filter(Boolean).join(' ') || '—'}${leadData.guest_email ? ` &lt;${leadData.guest_email}&gt;` : ''}</td></tr>`
          : '';
        const isHotLead = ['lt-2', '2-5'].includes(leadData.years_to_retirement);
        notificationSubject = `${isHotLead ? '🔥' : '🎯'} Federal Webinar Registration: ${leadData.name} — May 14, 2026 (${yearsLabel})`;
        notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #16253C; padding: 20px; text-align: center;">
              <h1 style="color: #FDD25E; margin: 0; font-size: 22px;">Federal Webinar Registration</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0;">May 14, 2026 — Live Online Masterclass</p>
            </div>
            <div style="padding: 28px; background: #f9f9f9;">
              ${isHotLead ? `<div style="background: #B31942; color: #fff; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 700;">HOT LEAD — ${yearsLabel} to retirement, call within 1 business day</div>` : ''}
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Retirement System:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.retirement_system || '—'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Years to Retirement:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${yearsLabel}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Federal Agency:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.agency || '—'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Special Category (6c):</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.special_category ? '<strong>YES — LEO / FF / ATC</strong>' : 'No'}</td></tr>
                ${guestRow}
              </table>
              <div style="background: #fff; padding: 16px; border-radius: 8px; margin-top: 20px; border: 1px solid #ddd;">
                <h3 style="margin: 0 0 12px 0; color: #16253C; font-size: 14px;">Attribution</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  ${leadData.utm_source ? `<tr><td style="padding: 4px;"><strong>UTM Source:</strong></td><td style="padding: 4px;">${leadData.utm_source}</td></tr>` : ''}
                  ${leadData.utm_medium ? `<tr><td style="padding: 4px;"><strong>UTM Medium:</strong></td><td style="padding: 4px;">${leadData.utm_medium}</td></tr>` : ''}
                  ${leadData.utm_campaign ? `<tr><td style="padding: 4px;"><strong>UTM Campaign:</strong></td><td style="padding: 4px;">${leadData.utm_campaign}</td></tr>` : ''}
                  ${leadData.utm_content ? `<tr><td style="padding: 4px;"><strong>UTM Content:</strong></td><td style="padding: 4px;">${leadData.utm_content}</td></tr>` : ''}
                  ${leadData.utm_term ? `<tr><td style="padding: 4px;"><strong>UTM Term:</strong></td><td style="padding: 4px;">${leadData.utm_term}</td></tr>` : ''}
                  ${leadData.referrer ? `<tr><td style="padding: 4px;"><strong>Referrer:</strong></td><td style="padding: 4px; font-size: 12px;">${leadData.referrer}</td></tr>` : ''}
                </table>
              </div>
            </div>
            <div style="background: #0F1A2A; padding: 14px; text-align: center;">
              <p style="color: rgba(255,255,255,0.6); margin: 0; font-size: 11px;">Federal Webinar Registration · capitalwealth.com/l/federal-benefits-webinar/</p>
            </div>
          </div>
        `;
      } else if (isFederalWorkshop) {
        const eventLabel = leadData.workshop_date || 'Federal Workshop';
        const sourceLabel = (source || '').replace(/^federal-benefits-workshop-?/, '').toUpperCase() || 'WEBER STATE';
        const specialCatBadge = leadData.special_category
          ? `<div style="background: #C4A82A; color: #0F1A2A; padding: 12px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: 700;">⭐ 6c / Special Category Employee (LEO / FF / ATC)</div>`
          : '';
        notificationSubject = `🎯 Federal Workshop Registration: ${leadData.name} — ${sourceLabel} (${eventLabel})`;
        notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #194F90; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎯 Federal Workshop Registration</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${eventLabel} · ${sourceLabel}</p>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <div style="background: #F09F54; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 18px;">HIGH-VALUE FEDERAL EMPLOYEE LEAD</h2>
              </div>
              ${specialCatBadge}
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Agency:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.agency || 'Not specified'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Workshop:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.workshop_date || 'Not specified'} · ${sourceLabel}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Special Category (6c):</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.special_category ? '<strong>YES — LEO / FF / ATC</strong>' : 'No'}</td></tr>
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
        // Detect SDBA leads by source / lead_type / utm_campaign
        const isSdba = (leadData.source && leadData.source.includes('sdba'))
          || (leadData.lead_type && leadData.lead_type.includes('sdba'))
          || (leadData.utm_campaign && leadData.utm_campaign.includes('sdba'));

        // Build the fields row — SDBA gets Employer, general keeps Savings/Timeline
        const fieldsRows = isSdba
          ? `
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Employer:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.employer || 'Not specified'}</td></tr>`
          : `
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.name}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="mailto:${leadData.email}">${leadData.email}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;"><a href="tel:${leadData.phone}">${leadData.phone}</a></td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Savings:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.savings || 'Not specified'}</td></tr>
                <tr><td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Timeline:</strong></td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${leadData.retirement_timeline || 'Not specified'}</td></tr>`;

        // Subject: SDBA gets branded LinkedIn briefcase + employer tag; general keeps legacy format
        notificationSubject = isSdba
          ? `💼 New SDBA Consultation Request: ${leadData.name}${leadData.employer ? ` — ${leadData.employer}` : ''}`
          : `New Consultation: ${leadData.name} — ${leadData.savings || 'General Inquiry'}`;

        const headerTitle = isSdba ? 'New SDBA Consultation Request' : 'New Consultation Request';

        notificationHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a2332; padding: 20px; text-align: center;">
              <h1 style="color: #c9a96e; margin: 0;">${headerTitle}</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <table style="width: 100%; border-collapse: collapse;">${fieldsRows}
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

      // SDBA leads: CC Bryce for CMO visibility during campaign launch
      const salesCc = (source && source.includes('sdba')) ? 'bryce@gullstack.com' : undefined;
      await sendEmail({
        to: SALES_EMAIL,
        cc: salesCc,
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
