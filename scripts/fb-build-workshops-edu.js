#!/usr/bin/env node

// Builds the new "Federal Workshops — Educational" campaign on Facebook,
// cloning the proven Webinar structure WITHOUT Special Ad Category.
// Creates everything in PAUSED state so the user can review before launch.
//
//   Campaign (PAUSED, SAC=none)
//   ├── AdSet: Ogden — Tue May 19 — LAL 1% Fed
//   ├── AdSet: SLC   — Wed May 20 — LAL 1% Fed
//   └── AdSet: Hill AFB — Thu May 21 — LAL 1% Fed
//        each with 3 ads (Authority / Five Systems / Decisions angles)
//
// Usage: node scripts/fb-build-workshops-edu.js [--dry-run]

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

loadDotenv(path.join(__dirname, '..', '.env'));
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const ACCOUNT = `act_${FB_AD_ACCOUNT_ID}`;

const DRY_RUN = process.argv.includes('--dry-run');
const REUSE_CAMPAIGN_IDX = process.argv.indexOf('--campaign-id');
const REUSE_CAMPAIGN_ID = REUSE_CAMPAIGN_IDX >= 0 ? process.argv[REUSE_CAMPAIGN_IDX + 1] : null;

// ===== Constants =====
const PAGE_ID = '1472234546327675';
const PIXEL_ID = '416279913963143';
const LAL_AUDIENCE_ID = '120241513320320665';        // Lookalike (1%) - Fed Employees - Source List
const SOURCE_AUDIENCE_ID = '120241512505020665';     // Fed Employees - Source List (exclude)
const CRM_AUDIENCE_ID = '120220522417480665';        // CRM List (exclude)
const PROVEN_IMAGE_HASH = 'e09210ed50e9005befa6f405790303b4';
const DAILY_BUDGET_CENTS = 35000; // $350/day

const WORKSHOPS = [
    {
        slug: 'ogden',
        name: 'AS1 — Ogden Tue May 19 — LAL 1% Fed',
        city_key: '2532136', city_name: 'Ogden', radius: 25,
        end_time: '2026-05-19T13:00:00-0600', // ad off 3.5 hrs before 4:30pm doors
        landing_url: 'https://www.capitalwealth.com/l/federal-benefits-workshop-ogden/',
        date_human: 'Tuesday, May 19',
        time_human: '4:30–6:30 PM',
        venue_human: 'Weber County Main Library, Ogden',
    },
    {
        slug: 'slc',
        name: 'AS2 — SLC Wed May 20 — LAL 1% Fed',
        city_key: '2532348', city_name: 'Salt Lake City', radius: 19,
        end_time: '2026-05-20T13:00:00-0600',
        landing_url: 'https://www.capitalwealth.com/l/federal-benefits-workshop-slc/',
        date_human: 'Wednesday, May 20',
        time_human: '4:30–6:30 PM',
        venue_human: 'University Guest House, Salt Lake City',
    },
    {
        slug: 'hill-afb',
        name: 'AS3 — Hill AFB Thu May 21 — LAL 1% Fed',
        city_key: '2531858', city_name: 'Layton', radius: 15,
        end_time: '2026-05-21T15:00:00-0600', // doors 6pm
        landing_url: 'https://www.capitalwealth.com/l/federal-benefits-workshop-hill-afb/',
        date_human: 'Thursday, May 21',
        time_human: '6:00–8:00 PM',
        venue_human: 'Weber State Davis Campus, Layton',
    },
];

const AD_ANGLES = [
    {
        slug: 'authority',
        headline_template: (w) => `Federal Benefits Workshop — ${cityShort(w.slug)} · ${w.date_human.split(',')[1].trim()}`,
        body_template: (w) => `${audienceLead(w.slug)}: a complimentary federal benefits workshop with Ann Werts — 25 years specializing in FERS, TSP, FEHB, FEGLI, and Social Security. Two hours that could shape how you think about the next thirty years.\n\n${w.date_human} · ${w.time_human} · ${w.venue_human} · Spouses welcome.`,
        cta_type: 'SIGN_UP',
    },
    {
        slug: 'five-systems',
        headline_template: () => 'Two Hours. Five Systems. One Retirement.',
        body_template: (w) => `Five federal benefit systems. One retirement. Decisions that could shape the next thirty years.\n\nJoin Ann Werts for a complimentary 2-hour workshop on FERS, TSP, FEHB, FEGLI, and Social Security — no products sold, no pitch, just open Q&A.\n\n${cityShort(w.slug)} · ${w.date_human} · ${w.time_human} · ${w.venue_human}.`,
        cta_type: 'LEARN_MORE',
    },
    {
        slug: 'decisions',
        headline_template: () => 'Decisions That Could Shape Thirty Years',
        body_template: (w) => `Federal employees within 10 years of retirement: a handful of decisions can shape the next 20+ years — and most of us only get one chance to make them right.\n\nAnn Werts is hosting a complimentary 2-hour workshop ${nearVenue(w.slug)} to walk through FERS, TSP, FEHB, FEGLI, and Social Security. No products. Open Q&A.\n\n${w.date_human} · ${w.time_human} · ${w.venue_human} · Spouses encouraged.`,
        cta_type: 'LEARN_MORE',
    },
];

function cityShort(slug) {
    return { 'ogden': 'Ogden', 'slc': 'Salt Lake City', 'hill-afb': 'Hill AFB' }[slug];
}
function audienceLead(slug) {
    return { 'ogden': 'Federal employees in Weber County', 'slc': 'Federal employees in Salt Lake County', 'hill-afb': 'Hill AFB civilians' }[slug];
}
function nearVenue(slug) {
    return { 'ogden': 'at the Weber County Main Library', 'slc': 'at the University Guest House in Salt Lake', 'hill-afb': 'near Hill AFB at Weber State Davis Campus' }[slug];
}

main().catch((e) => { console.error('\nFatal:', e.message); process.exit(1); });

async function main() {
    if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) { console.error('Missing FB env vars.'); process.exit(1); }
    if (DRY_RUN) console.log('=== DRY RUN — no API writes will occur ===\n');

    const created = { campaign: null, adsets: [], ads: [] };

    // 1) Campaign
    let campaign;
    if (REUSE_CAMPAIGN_ID) {
        console.log(`1) Reusing existing campaign ${REUSE_CAMPAIGN_ID}`);
        campaign = { id: REUSE_CAMPAIGN_ID };
        created.campaign = { id: REUSE_CAMPAIGN_ID, reused: true };
    } else {
        console.log('1) Creating campaign…');
        const campaignParams = {
            name: 'CW — Federal Workshops — Educational (May 19-21)',
            objective: 'OUTCOME_LEADS',
            status: 'PAUSED',
            buying_type: 'AUCTION',
            special_ad_categories: '[]',
            is_adset_budget_sharing_enabled: 'false',
        };
        campaign = await post(`${ACCOUNT}/campaigns`, campaignParams);
        console.log(`   ✓ campaign_id = ${campaign.id}`);
        created.campaign = { id: campaign.id, ...campaignParams };
    }

    // Pre-fetch existing ad sets so we don't duplicate on re-runs
    let existingAdsets = [];
    if (!DRY_RUN) {
        const r = await getJson(`${BASE}/${campaign.id}/adsets?fields=id,name&access_token=${FB_ACCESS_TOKEN}`);
        existingAdsets = r.data || [];
        if (existingAdsets.length > 0) console.log(`   (found ${existingAdsets.length} existing ad set(s) in campaign — will reuse by name)`);
    }
    const existingAds = {};
    if (!DRY_RUN && existingAdsets.length > 0) {
        for (const as of existingAdsets) {
            const adsResp = await getJson(`${BASE}/${as.id}/ads?fields=id,name&access_token=${FB_ACCESS_TOKEN}`);
            existingAds[as.id] = (adsResp.data || []).map((a) => a.name);
        }
    }

    // 2) Ad Sets
    for (const w of WORKSHOPS) {
        const reused = existingAdsets.find((a) => a.name === w.name);
        if (reused) {
            console.log(`\n2) Reusing existing ad set "${w.name}" (${reused.id})`);
            // Still need to create any missing ads under it
            await createAdsForAdset(reused.id, w, existingAds[reused.id] || [], created);
            continue;
        }
        console.log(`\n2) Creating ad set "${w.name}"…`);
        const targeting = {
            age_min: 25,
            age_max: 65,
            geo_locations: {
                cities: [{ key: w.city_key, radius: w.radius, distance_unit: 'mile' }],
                location_types: ['home', 'recent'],
            },
            custom_audiences: [{ id: LAL_AUDIENCE_ID }],
            excluded_custom_audiences: [
                { id: SOURCE_AUDIENCE_ID },
                { id: CRM_AUDIENCE_ID },
            ],
            targeting_automation: { advantage_audience: 1 },
            brand_safety_content_filter_levels: ['FACEBOOK_RELAXED', 'AN_RELAXED'],
        };
        const adsetParams = {
            name: w.name,
            campaign_id: campaign.id,
            status: 'PAUSED',
            optimization_goal: 'OFFSITE_CONVERSIONS',
            billing_event: 'IMPRESSIONS',
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
            daily_budget: String(DAILY_BUDGET_CENTS),
            end_time: w.end_time,
            promoted_object: JSON.stringify({ pixel_id: PIXEL_ID, custom_event_type: 'LEAD' }),
            targeting: JSON.stringify(targeting),
        };
        const adset = await post(`${ACCOUNT}/adsets`, adsetParams);
        console.log(`   ✓ adset_id = ${adset.id}`);
        created.adsets.push({ id: adset.id, slug: w.slug, ...adsetParams });

        await createAdsForAdset(adset.id, w, [], created);
    }

    // 4) Output
    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/fb-build-result.json', JSON.stringify(created, null, 2));
    console.log('\n=== DONE ===');
    console.log(`Campaign:  ${created.campaign.id}`);
    console.log(`Ad sets:   ${created.adsets.map((a) => a.id).join(', ')}`);
    console.log(`Ads:       ${created.ads.length}`);
    console.log(`Review:    https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${FB_AD_ACCOUNT_ID}&selected_campaign_ids=${created.campaign.id}`);
    console.log(`Result:    tmp/fb-build-result.json`);
}

function dayFromSlug(slug) {
    return { 'ogden': 19, 'slc': 20, 'hill-afb': 21 }[slug];
}

async function createAdsForAdset(adsetId, w, existingAdNames, created) {
    for (const angle of AD_ANGLES) {
        const adName = `${w.slug.toUpperCase()} — ${angle.slug.replace(/-/g, ' ')} — May ${dayFromSlug(w.slug)}`;
        if (existingAdNames.includes(adName)) {
            console.log(`   3) Ad "${adName}" already exists — skipping`);
            continue;
        }
        const headline = angle.headline_template(w);
        const body = angle.body_template(w);
        const link = `${w.landing_url}?utm_source=facebook&utm_medium=cpc&utm_campaign=fed-workshops-edu-may2026&utm_content=${w.slug}-${angle.slug}`;
        const creative = {
            object_story_spec: {
                page_id: PAGE_ID,
                link_data: {
                    message: body,
                    name: headline,
                    link: link,
                    image_hash: PROVEN_IMAGE_HASH,
                    call_to_action: {
                        type: angle.cta_type,
                        value: { link: link },
                    },
                },
            },
        };
        console.log(`   3) Creating ad "${adName}"…`);
        const adParams = {
            name: adName,
            adset_id: adsetId,
            status: 'PAUSED',
            creative: JSON.stringify(creative),
        };
        const ad = await post(`${ACCOUNT}/ads`, adParams);
        console.log(`      ✓ ad_id = ${ad.id}`);
        created.ads.push({ id: ad.id, name: adName, link, ...adParams });
    }
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let buf = '';
            res.on('data', (c) => { buf += c; });
            res.on('end', () => {
                try { const j = JSON.parse(buf); if (j.error) reject(new Error(j.error.message)); else resolve(j); }
                catch (e) { reject(new Error(`Non-JSON: ${buf.slice(0, 200)}`)); }
            });
        }).on('error', reject);
    });
}

async function post(endpoint, params) {
    if (DRY_RUN) {
        console.log(`     [dry-run] POST ${endpoint}`);
        console.log(`     params:`, JSON.stringify(params).slice(0, 400));
        return { id: `dryrun-${Math.random().toString(36).slice(2, 10)}` };
    }
    const url = `${BASE}/${endpoint}`;
    const body = new URLSearchParams({ ...params, access_token: FB_ACCESS_TOKEN });
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, (res) => {
            let buf = '';
            res.on('data', (c) => { buf += c; });
            res.on('end', () => {
                try {
                    const j = JSON.parse(buf);
                    if (j.error) return reject(new Error(`${endpoint}: ${j.error.message} | type=${j.error.type} code=${j.error.code} sub=${j.error.error_subcode} user_title=${j.error.error_user_title} user_msg=${j.error.error_user_msg} | params: ${JSON.stringify(params).slice(0, 800)}`));
                    resolve(j);
                } catch (e) { reject(new Error(`Non-JSON from ${endpoint}: ${buf.slice(0, 300)}`)); }
            });
        });
        req.on('error', reject);
        req.write(body.toString());
        req.end();
    });
}

function loadDotenv(filepath) {
    if (!fs.existsSync(filepath)) return;
    for (const line of fs.readFileSync(filepath, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('='); if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
        if (!(k in process.env)) process.env[k] = v;
    }
}
