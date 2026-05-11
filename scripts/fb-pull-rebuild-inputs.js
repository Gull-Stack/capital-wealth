#!/usr/bin/env node

// Pull everything we need to clone the Webinar campaign as the new
// "Workshops — Educational" campaign without SAC:
//   - Page ID + Instagram ID from existing Webinar ad creative
//   - Pixel ID from Webinar adset's promoted_object
//   - LAL custom audience ID(s) — "Lookalike (1%) - Fed Employees - Source List"
//   - Source custom audience IDs for reference
//   - Existing Webinar ad creative bodies (for copy comparison)
//   - All available Custom Audiences (so we know what's there)
//
// Read-only. Writes tmp/fb-rebuild-inputs.json.

const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotenv(path.join(__dirname, '..', '.env'));
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const ACCOUNT = `act_${FB_AD_ACCOUNT_ID}`;

const WEBINAR_CAMPAIGN_ID = '120241615030540665';

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    const out = {};

    console.log('Pulling Webinar ad sets…');
    const adsetsResp = await getJson(`${BASE}/${WEBINAR_CAMPAIGN_ID}/adsets?fields=id,name,promoted_object,targeting,daily_budget,bid_strategy,optimization_goal,billing_event&access_token=${FB_ACCESS_TOKEN}`);
    out.webinar_adsets = adsetsResp.data || [];

    console.log('Pulling Webinar ads + creative…');
    const adsResp = await getJson(`${BASE}/${WEBINAR_CAMPAIGN_ID}/ads?fields=id,name,status,creative{title,body,image_url,object_story_spec,call_to_action_type,asset_feed_spec,effective_object_story_id,instagram_permalink_url}&access_token=${FB_ACCESS_TOKEN}`);
    out.webinar_ads = adsResp.data || [];

    console.log('Pulling Custom Audiences…');
    const caResp = await getJson(`${BASE}/${ACCOUNT}/customaudiences?fields=id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status,description&limit=200&access_token=${FB_ACCESS_TOKEN}`);
    out.custom_audiences = caResp.data || [];

    // promote_pages requires extra permissions; we already get page_id from ad creative

    // adspixels endpoint requires extra permissions; pixel_id is already in adset.promoted_object

    // Summarize what we found
    const summary = {};
    if (out.webinar_adsets[0]?.promoted_object) summary.pixel_id = out.webinar_adsets[0].promoted_object.pixel_id;
    if (out.webinar_adsets[0]?.promoted_object) summary.custom_event_type = out.webinar_adsets[0].promoted_object.custom_event_type;
    const oss = out.webinar_ads[0]?.creative?.object_story_spec;
    if (oss?.page_id) summary.page_id = oss.page_id;
    if (oss?.instagram_actor_id) summary.instagram_actor_id = oss.instagram_actor_id;

    const lalMatch = out.custom_audiences.find((a) => /lookalike.*1%.*fed.*employees.*source/i.test(a.name));
    if (lalMatch) summary.proven_lal_audience_id = lalMatch.id;
    const sourceMatch = out.custom_audiences.find((a) => /^fed employees - source list$/i.test(a.name) || /fed.*employees.*source list/i.test(a.name));
    if (sourceMatch) summary.source_audience_id = sourceMatch.id;

    out.summary = summary;

    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/fb-rebuild-inputs.json', JSON.stringify(out, null, 2));
    console.log('\nWrote tmp/fb-rebuild-inputs.json');
    console.log('\nSummary:');
    console.log(JSON.stringify(summary, null, 2));
    console.log('\nAll custom audiences:');
    for (const ca of out.custom_audiences) {
        const lo = ca.approximate_count_lower_bound || '?';
        const hi = ca.approximate_count_upper_bound || '?';
        console.log(`  ${ca.id}  ${ca.name}  [${ca.subtype}] ~${lo}-${hi}`);
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
