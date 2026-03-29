// Capital Wealth - Leads Dashboard API
// Protected endpoint for viewing all leads

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const DASHBOARD_PASSWORD = process.env.DASHBOARD_API_KEY;

export default async function handler(req, res) {
  const ALLOWED_ORIGINS = ['https://www.capitalwealth.com', 'https://capitalwealth.com', 'https://capitalwealthfederal.com', 'https://www.capitalwealthfederal.com'];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Check password
    const key = req.query.key;
    if (key !== DASHBOARD_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query Supabase for all leads
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads?order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch leads from database');
    }

    const leads = await response.json();
    return res.status(200).json(leads);

  } catch (error) {
    console.error('Leads API error:', error);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
}
