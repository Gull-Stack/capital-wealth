#!/usr/bin/env node

// Focused diagnostic on the May 14 Webinar campaign. The campaign is the
// hero of the account ($10.80 CPL, 516 leads, no SAC) — this script
// surfaces the few real optimization opportunities in its last 3 days.
//
// Pulls: lifetime, 7d, 3d, 1d at campaign/adset/ad level + hourly trend
// + frequency trend + per-ad-variant CPL.

const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotenv(path.join(__dirname, '..', '.env'));
const TOKEN = process.env.FB_ACCESS_TOKEN;
const BASE = 'https://graph.facebook.com/v19.0';
const ACCOUNT = `act_${process.env.FB_AD_ACCOUNT_ID}`;
const CAMPAIGN_ID = '120241615030540665';

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
    console.log('Webinar campaign diagnostic\n');

    // Campaign-level across windows
    const windows = ['maximum', 'last_7d', 'last_3d', 'today'];
    const campWindows = {};
    for (const w of windows) {
        const r = await getJson(`${BASE}/${CAMPAIGN_ID}/insights?fields=spend,impressions,reach,frequency,clicks,ctr,cpc,cpm,actions,cost_per_action_type&date_preset=${w}`);
        campWindows[w] = r.data?.[0] || {};
    }

    console.log('=== Campaign performance ===');
    for (const w of windows) {
        const d = campWindows[w];
        const spend = parseFloat(d.spend || 0);
        const leads = leadCount(d);
        const cpl = leads > 0 ? spend / leads : null;
        const freq = parseFloat(d.frequency || 0);
        const ctr = parseFloat(d.ctr || 0);
        console.log(`  ${w.padEnd(10)} spend=$${spend.toFixed(2).padStart(8)}  leads=${String(leads).padStart(4)}  CPL=${cpl !== null ? '$' + cpl.toFixed(2) : '—'}  freq=${freq.toFixed(2)}  CTR=${ctr.toFixed(2)}%  reach=${parseInt(d.reach||0).toLocaleString()}`);
    }

    // Ad-set level (last 7d)
    console.log('\n=== Ad sets (last 7d) ===');
    const adsetsResp = await getJson(`${BASE}/${CAMPAIGN_ID}/adsets?fields=id,name,status,effective_status,daily_budget,end_time,targeting{custom_audiences,age_min,age_max}`);
    const adsets = adsetsResp.data || [];
    for (const a of adsets) {
        const insR = await getJson(`${BASE}/${a.id}/insights?fields=spend,impressions,reach,frequency,clicks,ctr,actions&date_preset=last_7d`);
        const d = insR.data?.[0] || {};
        const spend = parseFloat(d.spend || 0);
        const leads = leadCount(d);
        const cpl = leads > 0 ? spend / leads : null;
        const aud = a.targeting?.custom_audiences?.[0]?.name || '(none)';
        console.log(`  ${a.id} ${a.effective_status}`);
        console.log(`    name: ${a.name}`);
        console.log(`    budget: $${(parseInt(a.daily_budget||0)/100).toFixed(2)}/day · ends ${a.end_time || '—'}`);
        console.log(`    audience: ${aud}  age ${a.targeting?.age_min || '?'}-${a.targeting?.age_max || '?'}`);
        console.log(`    7d: spend=$${spend.toFixed(2)} leads=${leads} CPL=${cpl !== null ? '$' + cpl.toFixed(2) : '—'} freq=${parseFloat(d.frequency || 0).toFixed(2)} CTR=${parseFloat(d.ctr || 0).toFixed(2)}%`);
    }

    // Ad-level (last 7d) — which creative variant wins
    console.log('\n=== Ads (last 7d) ===');
    const adsResp = await getJson(`${BASE}/${CAMPAIGN_ID}/ads?fields=id,name,effective_status&limit=50`);
    const ads = adsResp.data || [];
    const adRows = [];
    for (const ad of ads) {
        const r = await getJson(`${BASE}/${ad.id}/insights?fields=spend,impressions,clicks,ctr,actions&date_preset=last_7d`);
        const d = r.data?.[0] || {};
        const spend = parseFloat(d.spend || 0);
        const leads = leadCount(d);
        adRows.push({
            name: ad.name,
            status: ad.effective_status,
            spend,
            leads,
            cpl: leads > 0 ? spend / leads : null,
            ctr: parseFloat(d.ctr || 0),
            impressions: parseInt(d.impressions || 0),
        });
    }
    adRows.sort((a, b) => b.spend - a.spend);
    for (const r of adRows) {
        console.log(`  ${r.status.padEnd(10)} ${r.name.padEnd(48)} spend=$${r.spend.toFixed(2).padStart(8)} leads=${String(r.leads).padStart(4)} CPL=${r.cpl !== null ? '$' + r.cpl.toFixed(2).padStart(7) : '       —'} CTR=${r.ctr.toFixed(2)}%`);
    }

    // Hourly trend (last 24h) — pacing signal
    console.log('\n=== Hourly trend (today) ===');
    const hourlyR = await getJson(`${BASE}/${CAMPAIGN_ID}/insights?fields=spend,impressions,actions&date_preset=today&time_increment=hourly_stats_aggregated_by_advertiser_time_zone`);
    const hours = hourlyR.data || [];
    if (hours.length === 0) console.log('  (no hourly data for today yet)');
    for (const h of hours.slice(-8)) {
        const spend = parseFloat(h.spend || 0);
        const leads = leadCount(h);
        const cpl = leads > 0 ? spend / leads : null;
        console.log(`  ${h.hourly_stats_aggregated_by_advertiser_time_zone || h.date_start}  spend=$${spend.toFixed(2)} leads=${leads} CPL=${cpl !== null ? '$' + cpl.toFixed(2) : '—'}`);
    }

    // Findings
    const findings = [];
    const last7d = campWindows.last_7d;
    const last3d = campWindows.last_3d;
    const max = campWindows.maximum;
    const freq7d = parseFloat(last7d.frequency || 0);
    const freq3d = parseFloat(last3d.frequency || 0);
    const cpl7d = leadCount(last7d) > 0 ? parseFloat(last7d.spend) / leadCount(last7d) : null;
    const cpl3d = leadCount(last3d) > 0 ? parseFloat(last3d.spend) / leadCount(last3d) : null;
    const cplMax = leadCount(max) > 0 ? parseFloat(max.spend) / leadCount(max) : null;

    if (cpl3d !== null && cpl7d !== null && cpl3d > cpl7d * 1.25) {
        findings.push(`CPL trending UP: 7d $${cpl7d.toFixed(2)} → 3d $${cpl3d.toFixed(2)} (+${((cpl3d/cpl7d - 1) * 100).toFixed(0)}%). Possible early saturation.`);
    } else if (cpl3d !== null && cpl7d !== null) {
        findings.push(`CPL stable: 7d $${cpl7d.toFixed(2)} ≈ 3d $${cpl3d.toFixed(2)}. Healthy.`);
    }

    if (freq3d > 3.0) findings.push(`Frequency in last 3d is ${freq3d.toFixed(2)} — at or above fatigue threshold.`);
    else if (freq3d > 2.0) findings.push(`Frequency 3d=${freq3d.toFixed(2)} — climbing, watch closely.`);
    else findings.push(`Frequency 3d=${freq3d.toFixed(2)} — healthy.`);

    const zeroLeadAds = adRows.filter((a) => a.status === 'ACTIVE' && a.spend > 50 && a.leads === 0);
    if (zeroLeadAds.length > 0) findings.push(`${zeroLeadAds.length} active ad(s) with >$50 spend and 0 leads — consider pausing.`);

    const dominantAd = adRows[0];
    const totalSpend = adRows.reduce((s, a) => s + a.spend, 0);
    if (totalSpend > 0 && dominantAd.spend / totalSpend > 0.7) {
        findings.push(`Spend is concentrated on "${dominantAd.name}" (${(dominantAd.spend/totalSpend*100).toFixed(0)}% of 7d spend) — consider adding 1-2 fresh variants for fatigue protection.`);
    }

    const pausedAdsets = adsets.filter((a) => a.effective_status === 'PAUSED');
    if (pausedAdsets.length > 0) findings.push(`${pausedAdsets.length} paused ad set(s) in this campaign: ${pausedAdsets.map(a => a.name).join(', ')}`);

    console.log('\n=== Findings ===');
    findings.forEach((f) => console.log(`  • ${f}`));

    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/fb-diagnose-webinar.json', JSON.stringify({ campaign: campWindows, adsets, ads: adRows, hours, findings }, null, 2));
    console.log('\nWrote tmp/fb-diagnose-webinar.json');
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

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(`${url}${url.includes('?') ? '&' : '?'}access_token=${TOKEN}`, (res) => {
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
