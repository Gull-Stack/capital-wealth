#!/usr/bin/env node

// One-off: compare the historical "Federal Seminar Event" campaign(s) vs the
// current "Federal Workshops" campaign(s) on:
//   - special_ad_categories  (the big one)
//   - status / objective / buying_type
//   - per-adset targeting spec (LAL sources, age range, custom audiences,
//     detailed_targeting, geo radius)
//   - lifetime spend, leads, CPL
//
// Read-only. Writes tmp/fb-compare-events.md + .json.

const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotenv(path.join(__dirname, '..', '.env'));

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE = `https://graph.facebook.com/${API_VERSION}`;
const ACCOUNT = `act_${FB_AD_ACCOUNT_ID}`;

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('Missing FB env vars.');
    process.exit(1);
}

// Meta's API reports the same Lead event under multiple action_type aliases
// (all with identical values). Take MAX across them, never SUM.
const LEAD_ACTION_TYPES = [
    'offsite_conversion.fb_pixel_lead',
    'lead',
    'onsite_conversion.lead_grouped',
    'leadgen.other',
];

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    console.log('Pulling all campaigns lifetime…');
    const campaigns = await listAllCampaigns();
    console.log(`Found ${campaigns.length} campaigns total.`);

    // Bucket by name
    const seminar = campaigns.filter((c) => /seminar/i.test(c.name));
    const workshop = campaigns.filter((c) => /workshop/i.test(c.name));
    const webinar = campaigns.filter((c) => /webinar/i.test(c.name));

    console.log(`Seminar: ${seminar.length}, Workshop: ${workshop.length}, Webinar: ${webinar.length}`);

    const buckets = {
        seminar: await enrich(seminar),
        workshop: await enrich(workshop),
        webinar: await enrich(webinar),
    };

    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/fb-compare-events.json', JSON.stringify(buckets, null, 2));
    fs.writeFileSync('tmp/fb-compare-events.md', renderMarkdown(buckets));
    console.log('Wrote tmp/fb-compare-events.md and .json');
}

async function listAllCampaigns() {
    // Pull every campaign on the account with the fields we care about.
    const fields = [
        'id', 'name', 'status', 'effective_status', 'objective',
        'buying_type', 'special_ad_categories', 'special_ad_category_country',
        'created_time', 'start_time', 'stop_time', 'lifetime_budget', 'daily_budget',
    ].join(',');
    const url = `${BASE}/${ACCOUNT}/campaigns?fields=${fields}&limit=200&access_token=${FB_ACCESS_TOKEN}`;
    return paginate(url);
}

async function enrich(campaigns) {
    const out = [];
    for (const c of campaigns) {
        process.stdout.write(`  ${c.name.slice(0, 60)}…`);
        const insights = await getInsights(c.id, 'maximum');
        const adsets = await getAdsets(c.id);
        process.stdout.write(` ${adsets.length} adsets\n`);
        out.push({ campaign: c, insights, adsets });
    }
    return out;
}

async function getInsights(campaignId, datePreset) {
    const fields = ['spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'actions'].join(',');
    const url = `${BASE}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${FB_ACCESS_TOKEN}`;
    const body = await getJson(url);
    if (body.error) return { error: body.error.message };
    return body.data?.[0] || {};
}

async function getAdsets(campaignId) {
    const fields = [
        'id', 'name', 'status', 'effective_status', 'optimization_goal',
        'billing_event', 'bid_strategy', 'targeting',
    ].join(',');
    const url = `${BASE}/${campaignId}/adsets?fields=${fields}&limit=100&access_token=${FB_ACCESS_TOKEN}`;
    const adsets = await paginate(url);
    // Enrich each adset with lifetime insights
    for (const a of adsets) {
        a.insights = await getAdsetInsights(a.id);
    }
    return adsets;
}

async function getAdsetInsights(adsetId) {
    const fields = ['spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'actions'].join(',');
    const url = `${BASE}/${adsetId}/insights?fields=${fields}&date_preset=maximum&access_token=${FB_ACCESS_TOKEN}`;
    const body = await getJson(url);
    if (body.error) return { error: body.error.message };
    return body.data?.[0] || {};
}

async function paginate(initialUrl) {
    const out = [];
    let url = initialUrl;
    while (url) {
        const body = await getJson(url);
        if (body.error) throw new Error(body.error.message);
        if (body.data) out.push(...body.data);
        url = body.paging?.next || null;
    }
    return out;
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let buf = '';
            res.on('data', (c) => { buf += c; });
            res.on('end', () => {
                try { resolve(JSON.parse(buf)); }
                catch (e) { reject(new Error(`Non-JSON: ${buf.slice(0, 200)}`)); }
            });
        }).on('error', reject);
    });
}

function leadCount(row) {
    if (!row || !row.actions) return 0;
    let max = 0;
    for (const t of LEAD_ACTION_TYPES) {
        const action = row.actions.find((a) => a.action_type === t);
        if (action) max = Math.max(max, parseFloat(action.value || 0));
    }
    return max;
}

function renderMarkdown(buckets) {
    const lines = [];
    lines.push('# Federal Seminar vs Workshop vs Webinar — campaign comparison');
    lines.push('');
    lines.push(`Account \`${ACCOUNT}\` · Generated ${new Date().toISOString()}`);
    lines.push('');

    for (const bucketName of ['seminar', 'workshop', 'webinar']) {
        const items = buckets[bucketName];
        if (items.length === 0) continue;
        lines.push(`## ${bucketName.toUpperCase()} campaigns (${items.length})`);
        lines.push('');
        for (const item of items) {
            const c = item.campaign;
            const ins = item.insights;
            const spend = parseFloat(ins.spend || 0);
            const leads = leadCount(ins);
            const cpl = leads > 0 ? spend / leads : null;
            lines.push(`### ${c.name}`);
            lines.push('');
            lines.push(`- **ID:** \`${c.id}\``);
            lines.push(`- **Status:** ${c.effective_status} | **Objective:** ${c.objective} | **Buying type:** ${c.buying_type}`);
            const sac = Array.isArray(c.special_ad_categories) ? c.special_ad_categories : [];
            lines.push(`- **Special Ad Categories:** ${sac.length > 0 ? '⚠️ ' + sac.join(', ') : '✅ NONE'}`);
            if (c.special_ad_category_country) lines.push(`- **SAC country:** ${c.special_ad_category_country}`);
            lines.push(`- **Created:** ${c.created_time} | **Started:** ${c.start_time || '—'} | **Stopped:** ${c.stop_time || '—'}`);
            lines.push(`- **Lifetime budget:** ${c.lifetime_budget ? '$' + (c.lifetime_budget / 100).toFixed(2) : '—'} | **Daily:** ${c.daily_budget ? '$' + (c.daily_budget / 100).toFixed(2) : '—'}`);
            lines.push(`- **Spent:** $${spend.toFixed(2)} | **Leads:** ${leads} | **CPL:** ${cpl !== null ? '$' + cpl.toFixed(2) : '—'}`);
            lines.push(`- **CTR:** ${parseFloat(ins.ctr || 0).toFixed(2)}% | **Reach:** ${parseInt(ins.reach || 0).toLocaleString()} | **Frequency:** ${parseFloat(ins.frequency || 0).toFixed(2)}`);
            lines.push('');
            lines.push(`#### Ad sets`);
            for (const a of item.adsets) {
                const t = a.targeting || {};
                const aSpend = parseFloat(a.insights?.spend || 0);
                const aLeads = leadCount(a.insights);
                const aCpl = aLeads > 0 ? aSpend / aLeads : null;
                lines.push(`- **${a.name}** — ${a.effective_status}, opt=\`${a.optimization_goal}\``);
                lines.push(`  - Spend $${aSpend.toFixed(2)} · Leads ${aLeads} · CPL ${aCpl !== null ? '$' + aCpl.toFixed(2) : '—'}`);
                lines.push(`  - Age: ${t.age_min || '?'}–${t.age_max || '?'} · Genders: ${describeGenders(t.genders)} · Locales: ${(t.locales || []).join(',') || '—'}`);
                const geo = describeGeo(t.geo_locations);
                lines.push(`  - Geo: ${geo}`);
                const customAud = describeAudList(t.custom_audiences, 'custom_audiences');
                const excludeAud = describeAudList(t.excluded_custom_audiences, 'excluded');
                lines.push(`  - Custom audiences: ${customAud}`);
                lines.push(`  - Excluded: ${excludeAud}`);
                const dt = describeDetailed(t.flexible_spec || t.detailed_targeting_categories || []);
                lines.push(`  - Detailed targeting: ${dt}`);
                lines.push(`  - Placements: ${describePlacements(t)}`);
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}

function describeGenders(g) {
    if (!g) return 'all';
    if (Array.isArray(g)) {
        if (g.length === 0 || (g.includes(1) && g.includes(2))) return 'all';
        return g.map((v) => v === 1 ? 'male' : v === 2 ? 'female' : v).join(', ');
    }
    return String(g);
}

function describeGeo(geo) {
    if (!geo) return 'none';
    const parts = [];
    if (geo.countries) parts.push(`countries=${geo.countries.join(',')}`);
    if (geo.regions) parts.push(`regions=${geo.regions.map((r) => r.name || r.key).join(',')}`);
    if (geo.cities) parts.push(`cities=${geo.cities.map((c) => `${c.name || c.key}${c.radius ? ` ±${c.radius}${c.distance_unit || 'mi'}` : ''}`).join('; ')}`);
    if (geo.zips) parts.push(`zips=${geo.zips.map((z) => z.name || z.key).join(',')}`);
    if (geo.custom_locations) parts.push(`pins=${geo.custom_locations.map((c) => `${c.name || c.key}±${c.radius}${c.distance_unit || 'mi'}`).join('; ')}`);
    return parts.join(' | ') || JSON.stringify(geo).slice(0, 100);
}

function describeAudList(list, label) {
    if (!list || list.length === 0) return 'none';
    return list.map((a) => a.name || a.id || JSON.stringify(a)).join(', ');
}

function describeDetailed(spec) {
    if (!spec || spec.length === 0) return 'none';
    const parts = [];
    for (const block of spec) {
        const inner = [];
        for (const key of ['interests', 'behaviors', 'demographics', 'work_employers', 'work_positions', 'industries', 'income', 'education_statuses', 'family_statuses', 'life_events']) {
            if (block[key]) inner.push(`${key}=[${block[key].map((x) => x.name || x.id).join(', ')}]`);
        }
        if (inner.length > 0) parts.push(inner.join('; '));
    }
    return parts.join(' OR ') || JSON.stringify(spec).slice(0, 200);
}

function describePlacements(t) {
    if (t.publisher_platforms || t.facebook_positions || t.instagram_positions || t.audience_network_positions || t.messenger_positions) {
        const parts = [];
        if (t.publisher_platforms) parts.push(`platforms=[${t.publisher_platforms.join(',')}]`);
        if (t.facebook_positions) parts.push(`fb=[${t.facebook_positions.join(',')}]`);
        if (t.instagram_positions) parts.push(`ig=[${t.instagram_positions.join(',')}]`);
        return parts.join(' ') || 'manual';
    }
    return 'automatic (Advantage+)';
}

function loadDotenv(filepath) {
    if (!fs.existsSync(filepath)) return;
    const content = fs.readFileSync(filepath, 'utf8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = value;
    }
}
