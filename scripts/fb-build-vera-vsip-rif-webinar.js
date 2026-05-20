#!/usr/bin/env node
// Builds the "CW — May 28 Webinar — VERA/VSIP/RIF — Leads" campaign on Facebook.
// No Special Ad Category. PAUSED on create — user reviews and flips on.
//
// Structure:
//   Campaign (PAUSED, no SAC)
//   ├── AS1 — Paid Social Converters LAL — US ex HI/CO/NM ($600/day)
//   └── AS2 — Fed Employees LAL — US ex HI/CO/NM ($400/day)
//        each ad set has 3 ads (VERA-Urgency / Early-Out-Math / 30-Years angles)
//
// Usage: node scripts/fb-build-vera-vsip-rif-webinar.js [--dry-run] [--campaign-id <id>]

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

function loadDotenv(p) {
  const env = fs.readFileSync(p, 'utf8');
  env.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  });
}
loadDotenv(path.join(__dirname, '..', '.env'));

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const ACCOUNT = `act_${FB_AD_ACCOUNT_ID}`;

const DRY_RUN = process.argv.includes('--dry-run');
const REUSE_IDX = process.argv.indexOf('--campaign-id');
const REUSE_CAMPAIGN_ID = REUSE_IDX >= 0 ? process.argv[REUSE_IDX + 1] : null;

// ===== Constants =====
const PAGE_ID = '1472234546327675';
const PIXEL_ID = '416279913963143';
const PROVEN_IMAGE_HASH = 'e09210ed50e9005befa6f405790303b4';
const LANDING_URL = 'https://www.capitalwealth.com/l/federal-benefits-webinar/';

// Audiences
const NEW_LAL_AUDIENCE_ID = '120242455388620665';      // CW LAL 1% US - Paid Social Converters (NEW)
const EXISTING_LAL_AUDIENCE_ID = '120241513320320665'; // Lookalike (1%) - Fed Employees - Source List
const PAID_SOCIAL_SOURCE_ID = '120242455383580665';    // CW Paid Social Converters source (exclude)
const FED_SOURCE_ID = '120241512505020665';            // Fed Employees - Source List source (exclude)
const CRM_AUDIENCE_ID = '120220522417480665';          // CRM List (exclude)

// Excluded states: Hawaii, Colorado, New Mexico
const EXCLUDED_REGION_KEYS = ['3854', '3848', '3874'];

// Webinar end-time: Thu May 28 2026, 5:00 PM MT (when webinar starts)
const AD_END_TIME = '2026-05-28T17:00:00-0600';

// Daily budgets (cents)
const NEW_LAL_BUDGET_CENTS = 60000;       // $600/day
const EXISTING_LAL_BUDGET_CENTS = 40000;  // $400/day

const AD_SETS = [
  {
    slug: 'paid-social-converters',
    name: 'AS1 — Paid Social Converters LAL — US ex HI/CO/NM',
    lal_id: NEW_LAL_AUDIENCE_ID,
    budget_cents: NEW_LAL_BUDGET_CENTS,
  },
  {
    slug: 'fed-employees-lal',
    name: 'AS2 — Fed Employees LAL — US ex HI/CO/NM',
    lal_id: EXISTING_LAL_AUDIENCE_ID,
    budget_cents: EXISTING_LAL_BUDGET_CENTS,
  },
];

const ANGLES = [
  {
    slug: 'vera-urgency',
    name: 'VERA/VSIP/RIF Urgency',
    body: "A VERA, VSIP, or RIF offer can reshape thirty years of your federal retirement — and the decision window is rarely longer than a few weeks. Thursday May 28 at 7 PM ET, Ann Werts walks federal employees through what each of those three offers actually means: who qualifies, the after-tax math, and what happens to your FEHB, FEGLI, and pension when you walk. Fee-based fiduciary, federal-focused — educational session, no high-pressure pitch.",
    headline: "A 30-Year Decision in 30 Days. Get the Numbers First.",
    description: "Live online · 1 hr + Q&A · Free to attend.",
  },
  {
    slug: 'early-out-math',
    name: 'Early-Out After-Tax Math',
    body: "A VSIP buyout looks great as a headline number — until you subtract the taxes. A VERA lets you retire early — until you see what it does to your pension multiplier. A RIF can cost you FEHB for life. The numbers in the offer packet aren't the numbers that hit your bank account. Thursday May 28 at 7 PM ET, Ann Werts walks federal employees through the after-tax math for each option, so the decision is yours to make on real numbers. Fee-based fiduciary specializing in federal benefits.",
    headline: "What That VSIP Offer Actually Pays You (After Taxes).",
    description: "Live, 1 hour + Q&A. Educational, no pitch.",
  },
  {
    slug: '30-years-on-line',
    name: 'Thirty Years On The Line',
    body: "Most federal employees spend years thinking about retirement and weeks deciding on an early-out offer. The offer packet doesn't tell you what your FERS pension drops to if you take VERA. It doesn't tell you which FEHB rule you trip if you separate before your 5-year window. It doesn't tell you what VSIP costs you in IRMAA later. Thursday May 28 at 7 PM ET, a federal benefits specialist walks through every one of those — live, with Q&A. Fee-based fiduciary, federal-focused.",
    headline: "Thirty Years of Federal Retirement, On the Line in 30 Days.",
    description: "Live webinar Thu May 28, 7 PM ET. Free + Q&A.",
  },
];

// ===== HTTP helpers =====
function httpJson(method, urlStr, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const headers = {};
    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method, headers }, res => {
      let buf = ''; res.on('data', d => buf += d);
      res.on('end', () => {
        try { const j = JSON.parse(buf); j.error ? reject(j) : resolve(j); }
        catch(e) { reject({error: {message: buf}}); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const get = (u) => httpJson('GET', u);
const post = (u, b) => httpJson('POST', u, b);

// ===== Builders =====
async function listExistingByName(endpoint, name, extraFields = '') {
  const fields = `id,name,status${extraFields ? ',' + extraFields : ''}`;
  const url = `${BASE}/${ACCOUNT}/${endpoint}?fields=${fields}&limit=200&access_token=${FB_ACCESS_TOKEN}`;
  const r = await get(url);
  return (r.data || []).find(x => x.name === name);
}

async function findOrCreateCampaign() {
  const NAME = 'CW — May 28 Webinar — VERA/VSIP/RIF — Leads';
  if (REUSE_CAMPAIGN_ID) {
    console.log(`Reusing campaign ${REUSE_CAMPAIGN_ID}`);
    return REUSE_CAMPAIGN_ID;
  }
  const existing = await listExistingByName('campaigns', NAME);
  if (existing) {
    console.log(`Found existing campaign: ${existing.id} (${existing.status})`);
    return existing.id;
  }
  console.log('Creating campaign...');
  if (DRY_RUN) return 'DRY_CAMPAIGN_ID';
  const r = await post(`${BASE}/${ACCOUNT}/campaigns?access_token=${FB_ACCESS_TOKEN}`, {
    name: NAME,
    objective: 'OUTCOME_LEADS',
    status: 'PAUSED',
    special_ad_categories: [],
    buying_type: 'AUCTION',
    is_adset_budget_sharing_enabled: false,
  });
  console.log(`  Campaign: ${r.id}`);
  return r.id;
}

async function findOrCreateAdSet(campaignId, adsetSpec) {
  const existing = await listExistingByName('adsets', adsetSpec.name);
  if (existing) {
    console.log(`Found existing ad set: ${existing.id} (${adsetSpec.name})`);
    return existing.id;
  }
  console.log(`Creating ad set: ${adsetSpec.name}...`);
  if (DRY_RUN) return `DRY_ADSET_${adsetSpec.slug}`;
  const targeting = {
    age_min: 25,
    age_max: 65,
    geo_locations: {
      countries: ['US'],
    },
    excluded_geo_locations: {
      regions: EXCLUDED_REGION_KEYS.map(k => ({ key: k })),
    },
    custom_audiences: [{ id: adsetSpec.lal_id }],
    excluded_custom_audiences: [
      { id: PAID_SOCIAL_SOURCE_ID },
      { id: FED_SOURCE_ID },
      { id: CRM_AUDIENCE_ID },
    ],
    targeting_automation: { advantage_audience: 0 },
  };
  const r = await post(`${BASE}/${ACCOUNT}/adsets?access_token=${FB_ACCESS_TOKEN}`, {
    name: adsetSpec.name,
    campaign_id: campaignId,
    daily_budget: adsetSpec.budget_cents,
    billing_event: 'IMPRESSIONS',
    optimization_goal: 'OFFSITE_CONVERSIONS',
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    promoted_object: { pixel_id: PIXEL_ID, custom_event_type: 'LEAD' },
    targeting,
    end_time: AD_END_TIME,
    status: 'PAUSED',
  });
  console.log(`  Ad set: ${r.id}`);
  return r.id;
}

async function findOrCreateAd(adsetId, adsetSlug, angle) {
  const adName = `Ad — ${angle.name} — ${adsetSlug}`;
  const existing = await listExistingByName('ads', adName);
  if (existing) {
    console.log(`Found existing ad: ${existing.id} (${adName})`);
    return existing.id;
  }
  console.log(`Creating ad: ${adName}...`);
  if (DRY_RUN) return `DRY_AD_${angle.slug}_${adsetSlug}`;
  const utm = new URLSearchParams({
    utm_source: 'facebook',
    utm_medium: 'paid_social',
    utm_campaign: 'vera-vsip-rif-may2026',
    utm_content: `${angle.slug}-${adsetSlug}`,
  }).toString();
  const link = `${LANDING_URL}?${utm}`;
  const creativeSpec = {
    name: `Creative — ${angle.name} — ${adsetSlug}`,
    object_story_spec: {
      page_id: PAGE_ID,
      link_data: {
        message: angle.body,
        link,
        name: angle.headline,
        description: angle.description,
        image_hash: PROVEN_IMAGE_HASH,
        call_to_action: { type: 'SIGN_UP', value: { link } },
      },
    },
  };
  const cr = await post(`${BASE}/${ACCOUNT}/adcreatives?access_token=${FB_ACCESS_TOKEN}`, creativeSpec);
  console.log(`  Creative: ${cr.id}`);
  const ad = await post(`${BASE}/${ACCOUNT}/ads?access_token=${FB_ACCESS_TOKEN}`, {
    name: adName,
    adset_id: adsetId,
    creative: { creative_id: cr.id },
    status: 'PAUSED',
  });
  console.log(`  Ad: ${ad.id}`);
  return ad.id;
}

// ===== Main =====
(async () => {
  if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID in .env');
    process.exit(1);
  }
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Account: ${ACCOUNT}`);
  console.log('');
  const campaignId = await findOrCreateCampaign();
  console.log(`\nCampaign ID: ${campaignId}\n`);
  const summary = [];
  for (const adset of AD_SETS) {
    const adsetId = await findOrCreateAdSet(campaignId, adset);
    const adIds = [];
    for (const angle of ANGLES) {
      const adId = await findOrCreateAd(adsetId, adset.slug, angle);
      adIds.push(adId);
    }
    summary.push({ adset: adset.name, adsetId, ads: adIds });
  }
  console.log('\n========== SUMMARY ==========');
  console.log(`Campaign: ${campaignId}`);
  summary.forEach(s => {
    console.log(`  ${s.adset} (${s.adsetId})`);
    s.ads.forEach(a => console.log(`    - ${a}`));
  });
  console.log('\nALL PAUSED. Review in Ads Manager, then launch via scripts/fb-launch.js or manually.');
})().catch(e => { console.error('ERROR', JSON.stringify(e, null, 2)); process.exit(1); });
