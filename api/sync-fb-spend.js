// Scheduled sync: pull Facebook ad spend into Salesforce Campaign.ActualCost.
//
// Triggered daily by the Vercel cron defined in vercel.json. Each SF Campaign
// that runs FB ads stores its FB source id(s) in Platform_Spend_Source__c,
// comma-separated, e.g.:
//   facebook:campaign:120241615030540665
//   facebook:adset:120241962936030665,facebook:adset:120241693236520665
//
// ActualCost feeds the existing Cost_Per_Lead__c / Cost_Per_Won__c formulas
// and the MARKETING: Spend & ROI dashboard.
//
// GET /api/sync-fb-spend?dry=1  — preview, no writes (manual testing)
// GET /api/sync-fb-spend        — apply (cron default)

const SF_CLIENT_ID = process.env.SF_CLIENT_ID;
const SF_REFRESH_TOKEN = process.env.SF_REFRESH_TOKEN;
const SF_INSTANCE_URL = process.env.SF_INSTANCE_URL || 'https://capitalwealth.my.salesforce.com';
const SF_LOGIN_URL = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
const SF_API_VERSION = 'v62.0';

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const FB_API = 'https://graph.facebook.com/v19.0';

const CRON_SECRET = process.env.CRON_SECRET;

async function getSFAccessToken() {
  if (!SF_CLIENT_ID || !SF_REFRESH_TOKEN) {
    throw new Error('SF_CLIENT_ID or SF_REFRESH_TOKEN env var missing');
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('client_id', SF_CLIENT_ID);
  params.append('refresh_token', SF_REFRESH_TOKEN);
  const r = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!r.ok) throw new Error(`SF token refresh failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  return { accessToken: j.access_token, instanceUrl: j.instance_url || SF_INSTANCE_URL };
}

// Lifetime FB spend keyed by the given id field. Follows API paging.
async function fetchSpend(level, idField) {
  const out = {};
  let url =
    `${FB_API}/act_${FB_AD_ACCOUNT_ID}/insights` +
    `?fields=${idField},spend&level=${level}&date_preset=maximum&limit=200` +
    `&access_token=${encodeURIComponent(FB_ACCESS_TOKEN)}`;
  while (url) {
    const res = await fetch(url);
    const page = await res.json();
    if (page.error) throw new Error(`FB API: ${page.error.message}`);
    for (const row of page.data || []) {
      out[row[idField]] = (out[row[idField]] || 0) + Number(row.spend || 0);
    }
    url = page.paging && page.paging.next ? page.paging.next : null;
  }
  return out;
}

export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET> when CRON_SECRET is set.
  if (CRON_SECRET) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  const dry = req.query && (req.query.dry === '1' || req.query.dry === 'true');

  try {
    if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
      return res.status(500).json({ error: 'Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID' });
    }

    const [campaignSpend, adsetSpend] = await Promise.all([
      fetchSpend('campaign', 'campaign_id'),
      fetchSpend('adset', 'adset_id'),
    ]);

    const { accessToken, instanceUrl } = await getSFAccessToken();
    const SF = `${instanceUrl}/services/data/${SF_API_VERSION}`;
    const sfHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    const soql =
      'SELECT Id, Name, ActualCost, Platform_Spend_Source__c FROM Campaign ' +
      'WHERE Platform_Spend_Source__c != null';
    const qr = await fetch(`${SF}/query?q=${encodeURIComponent(soql)}`, { headers: sfHeaders });
    if (!qr.ok) throw new Error(`SF query failed: ${qr.status} ${await qr.text()}`);
    const campaigns = (await qr.json()).records || [];

    const results = [];
    let writes = 0;
    for (const c of campaigns) {
      const tokens = String(c.Platform_Spend_Source__c)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let total = 0;
      let resolved = 0;
      const warnings = [];
      for (const token of tokens) {
        const m = token.match(/^facebook:(campaign|adset):(\d+)$/);
        if (!m) {
          warnings.push(`unrecognized token "${token}"`);
          continue;
        }
        const [, level, id] = m;
        const spend = level === 'campaign' ? campaignSpend[id] : adsetSpend[id];
        if (spend === undefined) {
          warnings.push(`FB ${level} ${id} returned no spend`);
          continue;
        }
        total += spend;
        resolved++;
      }

      const current = Number(c.ActualCost || 0);
      const next = Math.round(total * 100) / 100;
      const entry = {
        campaign: c.Name,
        id: c.Id,
        currentActualCost: current,
        newActualCost: next,
        resolvedSources: resolved,
        warnings,
      };

      if (resolved > 0 && Math.abs(next - current) >= 0.005) {
        entry.changed = true;
        if (!dry) {
          const ur = await fetch(`${SF}/sobjects/Campaign/${c.Id}`, {
            method: 'PATCH',
            headers: sfHeaders,
            body: JSON.stringify({ ActualCost: next }),
          });
          if (!ur.ok) {
            entry.error = `SF update failed: ${ur.status} ${await ur.text()}`;
          } else {
            writes++;
          }
        }
      } else {
        entry.changed = false;
      }
      results.push(entry);
    }

    return res.status(200).json({
      success: true,
      mode: dry ? 'dry-run' : 'apply',
      fbCampaigns: Object.keys(campaignSpend).length,
      fbAdsets: Object.keys(adsetSpend).length,
      sfCampaignsMapped: campaigns.length,
      campaignsUpdated: dry ? 0 : writes,
      results,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
