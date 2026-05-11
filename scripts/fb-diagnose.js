#!/usr/bin/env node

// Facebook Ads diagnosis pass for Capital Wealth.
// Pulls campaign / adset / ad level insights across 7d, 30d, 90d windows,
// then drills into breakdowns + creative for the worst offenders.
// Read-only. Writes JSON + a prioritized markdown summary to tmp/.
//
// Usage: node scripts/fb-diagnose.js

const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotenv(path.join(__dirname, '..', '.env'));

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API_VERSION = 'v19.0';

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
    console.error('Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID. Check .env at repo root.');
    process.exit(1);
}

const ACCOUNT = `act_${FB_AD_ACCOUNT_ID}`;
const BASE = `https://graph.facebook.com/${API_VERSION}`;

const WINDOWS = ['last_7d', 'last_30d', 'last_90d'];

const INSIGHT_FIELDS = [
    'spend', 'impressions', 'reach', 'frequency',
    'clicks', 'ctr', 'cpc', 'cpm',
    'actions', 'cost_per_action_type', 'action_values',
];

const LEAD_ACTION_TYPES = new Set([
    'lead',
    'offsite_conversion.fb_pixel_lead',
    'onsite_conversion.lead_grouped',
    'leadgen.other',
]);

main().catch((err) => {
    console.error('Fatal:', err.message);
    process.exit(1);
});

async function main() {
    console.log('Capital Wealth FB ads diagnosis');
    console.log(`Account: ${ACCOUNT}`);
    console.log(`Windows: ${WINDOWS.join(', ')}`);
    console.log('');

    const data = { account: ACCOUNT, generated_at: new Date().toISOString(), windows: {} };

    for (const win of WINDOWS) {
        process.stdout.write(`  ${win}: campaigns…`);
        const campaigns = await insights('campaign', win, ['campaign_id', 'campaign_name', 'objective']);
        process.stdout.write(' adsets…');
        const adsets = await insights('adset', win, ['adset_id', 'adset_name', 'campaign_id', 'campaign_name']);
        process.stdout.write(' ads…');
        const ads = await insights('ad', win, ['ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name']);
        process.stdout.write(' done\n');
        data.windows[win] = { campaigns, adsets, ads };
    }

    // Drill into breakdowns + creative based on the 30d window.
    const ads30 = data.windows.last_30d.ads;
    const adsets30 = data.windows.last_30d.adsets;

    // Top 3 spending adsets get demographic + placement breakdowns
    const topSpenders = [...adsets30]
        .sort((a, b) => parseFloat(b.spend || 0) - parseFloat(a.spend || 0))
        .slice(0, 3);

    data.breakdowns = {};
    for (const adset of topSpenders) {
        process.stdout.write(`  breakdowns for adset ${adset.adset_name}: age…`);
        const byAge = await insights('adset', 'last_30d', [], { breakdown: 'age', adset_id: adset.adset_id });
        process.stdout.write(' gender…');
        const byGender = await insights('adset', 'last_30d', [], { breakdown: 'gender', adset_id: adset.adset_id });
        process.stdout.write(' placement…');
        const byPlacement = await insights('adset', 'last_30d', [], { breakdown: 'publisher_platform', adset_id: adset.adset_id });
        process.stdout.write(' done\n');
        data.breakdowns[adset.adset_id] = {
            adset_name: adset.adset_name,
            spend: adset.spend,
            by_age: byAge,
            by_gender: byGender,
            by_placement: byPlacement,
        };
    }

    // Inspect creative on the worst ad-level performers
    const worstAds = pickWorstAds(ads30);
    data.creative_inspection = {};
    if (worstAds.length > 0) {
        process.stdout.write(`  creative for ${worstAds.length} worst ads…`);
        for (const ad of worstAds) {
            const creative = await getAdCreative(ad.ad_id);
            data.creative_inspection[ad.ad_id] = {
                ad_name: ad.ad_name,
                spend: ad.spend,
                ctr: ad.ctr,
                leads: leadCount(ad),
                cpl: leadCost(ad),
                creative,
            };
        }
        process.stdout.write(' done\n');
    }

    // Generate findings
    data.findings = generateFindings(data);

    // Write outputs
    fs.mkdirSync('tmp', { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const jsonPath = `tmp/fb-diagnose-${ts}.json`;
    const mdPath = `tmp/fb-diagnose-${ts}.md`;
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(mdPath, renderMarkdown(data));

    console.log('');
    console.log(`Wrote ${jsonPath}`);
    console.log(`Wrote ${mdPath}`);
    console.log('');
    console.log(`Findings: ${data.findings.length}`);
}

// ---------- Graph API helpers ----------

async function insights(level, datePreset, extraFields = [], opts = {}) {
    const fields = [...INSIGHT_FIELDS, ...extraFields].join(',');
    const target = opts.adset_id ? opts.adset_id : ACCOUNT;
    const params = new URLSearchParams({
        fields,
        level,
        date_preset: datePreset,
        limit: '500',
        access_token: FB_ACCESS_TOKEN,
    });
    if (opts.breakdown) params.set('breakdowns', opts.breakdown);
    const url = `${BASE}/${target}/insights?${params.toString()}`;
    const body = await getJson(url);
    if (body.error) throw new Error(`insights ${level} ${datePreset}${opts.breakdown ? ' [' + opts.breakdown + ']' : ''}: ${body.error.message}`);
    return body.data || [];
}

async function getAdCreative(adId) {
    const fields = 'creative{title,body,image_url,thumbnail_url,video_id,call_to_action_type,object_story_spec}';
    const url = `${BASE}/${adId}?fields=${encodeURIComponent(fields)}&access_token=${FB_ACCESS_TOKEN}`;
    const body = await getJson(url);
    if (body.error) return { error: body.error.message };
    return body.creative || {};
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let buf = '';
            res.on('data', (chunk) => { buf += chunk; });
            res.on('end', () => {
                try { resolve(JSON.parse(buf)); }
                catch (e) { reject(new Error(`Non-JSON response: ${buf.slice(0, 200)}`)); }
            });
        }).on('error', reject);
    });
}

// ---------- Metric helpers ----------

function leadCount(row) {
    if (!row.actions) return 0;
    return row.actions
        .filter((a) => LEAD_ACTION_TYPES.has(a.action_type))
        .reduce((sum, a) => sum + parseFloat(a.value || 0), 0);
}

function leadCost(row) {
    const leads = leadCount(row);
    const spend = parseFloat(row.spend || 0);
    if (leads <= 0) return null;
    return spend / leads;
}

function pickWorstAds(ads) {
    // Worst = high spend + zero leads, OR high spend + CTR < 0.5%, OR highest CPL
    const candidates = ads.filter((a) => parseFloat(a.spend || 0) >= 50);
    const tagged = candidates.map((a) => ({
        ad: a,
        score: 0,
        reasons: [],
    }));
    for (const t of tagged) {
        const spend = parseFloat(t.ad.spend || 0);
        const leads = leadCount(t.ad);
        const ctr = parseFloat(t.ad.ctr || 0);
        if (spend >= 100 && leads === 0) {
            t.score += 3;
            t.reasons.push(`$${spend.toFixed(0)} spent, 0 leads`);
        }
        if (ctr > 0 && ctr < 0.5 && spend >= 50) {
            t.score += 2;
            t.reasons.push(`CTR ${ctr.toFixed(2)}% (< 0.5%)`);
        }
        const cpl = leadCost(t.ad);
        if (cpl !== null && cpl >= 150) {
            t.score += 2;
            t.reasons.push(`CPL $${cpl.toFixed(0)}`);
        }
    }
    return tagged
        .filter((t) => t.score >= 2)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map((t) => t.ad);
}

// ---------- Findings ----------

function generateFindings(data) {
    const findings = [];
    const ads30 = data.windows.last_30d.ads;
    const adsets30 = data.windows.last_30d.adsets;
    const campaigns30 = data.windows.last_30d.campaigns;
    const campaigns7 = data.windows.last_7d.campaigns;
    const campaigns90 = data.windows.last_90d.campaigns;

    // Dead ads: >= $100 spend AND 0 leads
    for (const ad of ads30) {
        const spend = parseFloat(ad.spend || 0);
        const leads = leadCount(ad);
        if (spend >= 100 && leads === 0) {
            findings.push({
                severity: 'high',
                kind: 'dead-ad',
                ad_id: ad.ad_id,
                ad_name: ad.ad_name,
                campaign_name: ad.campaign_name,
                spend,
                leads: 0,
                reason: `Spent $${spend.toFixed(2)} over 30d with 0 leads.`,
                manager_url: adManagerUrl(ad.ad_id),
            });
        }
    }

    // Fatigue: adsets with frequency > 3.0 and spend > $50 in last 7d
    const adsets7 = data.windows.last_7d.adsets;
    for (const as of adsets7) {
        const freq = parseFloat(as.frequency || 0);
        const spend = parseFloat(as.spend || 0);
        if (freq > 3.0 && spend > 50) {
            findings.push({
                severity: 'medium',
                kind: 'fatigue',
                adset_id: as.adset_id,
                adset_name: as.adset_name,
                campaign_name: as.campaign_name,
                spend,
                frequency: freq,
                reason: `Frequency ${freq.toFixed(2)} over 7d ($${spend.toFixed(2)} spent) — audience exhausted.`,
                manager_url: adsetManagerUrl(as.adset_id),
            });
        }
    }

    // Inefficient leads: ads with CPL > 2x median (over 30d, only ads with leads)
    const cpls = ads30.map(leadCost).filter((c) => c !== null);
    if (cpls.length > 3) {
        const sorted = [...cpls].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        for (const ad of ads30) {
            const cpl = leadCost(ad);
            if (cpl !== null && cpl > median * 2 && parseFloat(ad.spend || 0) > 50) {
                findings.push({
                    severity: 'medium',
                    kind: 'inefficient-lead',
                    ad_id: ad.ad_id,
                    ad_name: ad.ad_name,
                    campaign_name: ad.campaign_name,
                    spend: parseFloat(ad.spend),
                    leads: leadCount(ad),
                    cpl,
                    median_cpl: median,
                    reason: `CPL $${cpl.toFixed(2)} vs account median $${median.toFixed(2)} (>2x).`,
                    manager_url: adManagerUrl(ad.ad_id),
                });
            }
        }
    }

    // Bad creative signal: CTR < 0.5% AND spend > $50
    for (const ad of ads30) {
        const ctr = parseFloat(ad.ctr || 0);
        const spend = parseFloat(ad.spend || 0);
        if (ctr > 0 && ctr < 0.5 && spend > 50) {
            findings.push({
                severity: 'medium',
                kind: 'low-ctr',
                ad_id: ad.ad_id,
                ad_name: ad.ad_name,
                campaign_name: ad.campaign_name,
                spend,
                ctr,
                reason: `CTR ${ctr.toFixed(2)}% (below 0.5% threshold) — creative isn't resonating.`,
                manager_url: adManagerUrl(ad.ad_id),
            });
        }
    }

    // Trend deltas: campaigns where CPL is getting worse over time
    const cplBy = (rows) => {
        const m = new Map();
        for (const c of rows) {
            const leads = leadCount(c);
            const spend = parseFloat(c.spend || 0);
            if (leads > 0) m.set(c.campaign_id, { cpl: spend / leads, name: c.campaign_name, spend, leads });
        }
        return m;
    };
    const m7 = cplBy(campaigns7);
    const m30 = cplBy(campaigns30);
    const m90 = cplBy(campaigns90);
    for (const [cid, c7] of m7) {
        const c30 = m30.get(cid);
        const c90 = m90.get(cid);
        if (c30 && c90 && c7.cpl > c30.cpl * 1.3 && c30.cpl > c90.cpl * 1.15 && c7.spend > 100) {
            findings.push({
                severity: 'medium',
                kind: 'cpl-decay',
                campaign_id: cid,
                campaign_name: c7.name,
                spend_7d: c7.spend,
                cpl_7d: c7.cpl,
                cpl_30d: c30.cpl,
                cpl_90d: c90.cpl,
                reason: `CPL trending up: 90d $${c90.cpl.toFixed(0)} → 30d $${c30.cpl.toFixed(0)} → 7d $${c7.cpl.toFixed(0)}.`,
                manager_url: campaignManagerUrl(cid),
            });
        }
    }

    // Demographic leaks (from breakdowns)
    for (const adsetId of Object.keys(data.breakdowns || {})) {
        const b = data.breakdowns[adsetId];
        const findLeak = (rows, dimensionName) => {
            const totalSpend = rows.reduce((s, r) => s + parseFloat(r.spend || 0), 0);
            const totalLeads = rows.reduce((s, r) => s + leadCount(r), 0);
            if (totalSpend < 100 || totalLeads === 0) return;
            for (const r of rows) {
                const spend = parseFloat(r.spend || 0);
                const leads = leadCount(r);
                const spendShare = spend / totalSpend;
                const leadShare = leads / totalLeads;
                if (spendShare > 0.25 && leadShare < 0.05) {
                    const segment = r.age || r.gender || r.publisher_platform || 'unknown';
                    findings.push({
                        severity: 'low',
                        kind: 'demographic-leak',
                        adset_id: adsetId,
                        adset_name: b.adset_name,
                        segment: `${dimensionName}=${segment}`,
                        spend,
                        leads,
                        spend_share: spendShare,
                        lead_share: leadShare,
                        reason: `${dimensionName} segment "${segment}" took ${(spendShare * 100).toFixed(0)}% of spend but produced ${(leadShare * 100).toFixed(0)}% of leads.`,
                        manager_url: adsetManagerUrl(adsetId),
                    });
                }
            }
        };
        findLeak(b.by_age, 'age');
        findLeak(b.by_gender, 'gender');
        findLeak(b.by_placement, 'placement');
    }

    // Sort: severity desc, then spend desc
    const order = { high: 3, medium: 2, low: 1 };
    findings.sort((a, b) => {
        const sd = order[b.severity] - order[a.severity];
        if (sd !== 0) return sd;
        return (b.spend || 0) - (a.spend || 0);
    });

    return findings;
}

// ---------- URLs ----------

function adManagerUrl(adId) {
    return `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${FB_AD_ACCOUNT_ID}&selected_ad_ids=${adId}`;
}
function adsetManagerUrl(adsetId) {
    return `https://adsmanager.facebook.com/adsmanager/manage/adsets?act=${FB_AD_ACCOUNT_ID}&selected_adset_ids=${adsetId}`;
}
function campaignManagerUrl(campaignId) {
    return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${FB_AD_ACCOUNT_ID}&selected_campaign_ids=${campaignId}`;
}

// ---------- Markdown rendering ----------

function renderMarkdown(data) {
    const lines = [];
    lines.push(`# Facebook Ads Diagnosis — Capital Wealth`);
    lines.push('');
    lines.push(`**Account:** \`${data.account}\`  `);
    lines.push(`**Generated:** ${data.generated_at}  `);
    lines.push(`**Windows:** ${WINDOWS.join(', ')}`);
    lines.push('');

    lines.push(`## Account totals`);
    lines.push('');
    lines.push('| Window | Spend | Impressions | Reach | Clicks | CTR | Leads | CPL |');
    lines.push('|--------|------:|------------:|------:|-------:|----:|------:|----:|');
    for (const win of WINDOWS) {
        const camps = data.windows[win].campaigns;
        const spend = sum(camps, 'spend');
        const impressions = sum(camps, 'impressions');
        const reach = sum(camps, 'reach');
        const clicks = sum(camps, 'clicks');
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const leads = camps.reduce((s, c) => s + leadCount(c), 0);
        const cpl = leads > 0 ? spend / leads : null;
        lines.push(`| ${win} | $${spend.toFixed(2)} | ${fmt(impressions)} | ${fmt(reach)} | ${fmt(clicks)} | ${ctr.toFixed(2)}% | ${leads} | ${cpl !== null ? '$' + cpl.toFixed(2) : '—'} |`);
    }
    lines.push('');

    lines.push(`## Findings (${data.findings.length})`);
    lines.push('');
    if (data.findings.length === 0) {
        lines.push('_No issues exceeded the diagnostic thresholds. Nice._');
    } else {
        for (const f of data.findings) {
            const sevTag = f.severity.toUpperCase();
            const name = f.ad_name || f.adset_name || f.campaign_name || 'unknown';
            lines.push(`### [${sevTag}] ${f.kind} — ${name}`);
            lines.push('');
            lines.push(`- **Reason:** ${f.reason}`);
            if (f.campaign_name && f.ad_name) lines.push(`- **Campaign:** ${f.campaign_name}`);
            if (f.spend !== undefined) lines.push(`- **Spend:** $${(f.spend || 0).toFixed(2)}`);
            if (f.leads !== undefined) lines.push(`- **Leads:** ${f.leads}`);
            if (f.cpl !== undefined && f.cpl !== null) lines.push(`- **CPL:** $${f.cpl.toFixed(2)}${f.median_cpl ? ` (account median $${f.median_cpl.toFixed(2)})` : ''}`);
            if (f.ctr !== undefined) lines.push(`- **CTR:** ${f.ctr.toFixed(2)}%`);
            if (f.frequency !== undefined) lines.push(`- **Frequency:** ${f.frequency.toFixed(2)}`);
            if (f.manager_url) lines.push(`- **Open in Ads Manager:** ${f.manager_url}`);
            lines.push('');
        }
    }

    lines.push(`## Campaign breakdown (last 30d)`);
    lines.push('');
    lines.push('| Campaign | Status/Obj | Spend | Impr | CTR | Leads | CPL |');
    lines.push('|----------|------------|------:|-----:|----:|------:|----:|');
    const camps30 = [...data.windows.last_30d.campaigns].sort((a, b) => parseFloat(b.spend || 0) - parseFloat(a.spend || 0));
    for (const c of camps30) {
        const spend = parseFloat(c.spend || 0);
        const impressions = parseInt(c.impressions || 0);
        const ctr = parseFloat(c.ctr || 0);
        const leads = leadCount(c);
        const cpl = leads > 0 ? spend / leads : null;
        lines.push(`| ${c.campaign_name || '(unnamed)'} | ${c.objective || '—'} | $${spend.toFixed(2)} | ${fmt(impressions)} | ${ctr.toFixed(2)}% | ${leads} | ${cpl !== null ? '$' + cpl.toFixed(2) : '—'} |`);
    }
    lines.push('');

    // Worst ads inspection
    if (Object.keys(data.creative_inspection || {}).length > 0) {
        lines.push(`## Worst ad creative (30d)`);
        lines.push('');
        for (const adId of Object.keys(data.creative_inspection)) {
            const c = data.creative_inspection[adId];
            lines.push(`### ${c.ad_name}`);
            lines.push('');
            lines.push(`- Spend: $${parseFloat(c.spend || 0).toFixed(2)} | CTR: ${parseFloat(c.ctr || 0).toFixed(2)}% | Leads: ${c.leads} | CPL: ${c.cpl !== null ? '$' + c.cpl.toFixed(2) : '—'}`);
            if (c.creative.title) lines.push(`- **Title:** ${c.creative.title}`);
            if (c.creative.body) lines.push(`- **Body:** ${c.creative.body.replace(/\n+/g, ' ').slice(0, 280)}${c.creative.body.length > 280 ? '…' : ''}`);
            if (c.creative.call_to_action_type) lines.push(`- **CTA:** ${c.creative.call_to_action_type}`);
            if (c.creative.image_url) lines.push(`- Image: ${c.creative.image_url}`);
            if (c.creative.video_id) lines.push(`- Video id: ${c.creative.video_id}`);
            lines.push(`- ${adManagerUrl(adId)}`);
            lines.push('');
        }
    }

    return lines.join('\n');
}

function sum(rows, field) { return rows.reduce((s, r) => s + parseFloat(r[field] || 0), 0); }
function fmt(n) { return Number(n || 0).toLocaleString(); }

// ---------- .env loader (no dependencies) ----------

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
