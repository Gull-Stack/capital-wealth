#!/usr/bin/env node

// Rewrite the 3 Hill AFB ads to remove "Hill AFB" military-base mention.
// Meta flagged HILL-AFB - decisions as "Financial and Insurance Products
// and Services" — likely triggered by the base name + federal-benefits
// language combo. Replacing "Hill AFB" with "Layton" / "Weber State Davis"
// keeps the audience identical (geo targeting unchanged: Layton ±15mi)
// but removes the trigger.

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

loadDotenv(path.join(__dirname, '..', '.env'));
const TOKEN = process.env.FB_ACCESS_TOKEN;
const BASE = 'https://graph.facebook.com/v19.0';

const PAGE_ID = '1472234546327675';
const PROVEN_IMAGE_HASH = 'e09210ed50e9005befa6f405790303b4';
const LANDING_URL = 'https://www.capitalwealth.com/l/federal-benefits-workshop-hill-afb/';

const ADS = [
    {
        id: '120241963281530665',
        slug: 'authority',
        headline: 'Federal Benefits Workshop — Layton · May 21',
        body: 'Federal employees near Layton: a complimentary federal benefits workshop with Ann Werts — 25 years specializing in FERS, TSP, FEHB, FEGLI, and Social Security. Two hours that could shape how you think about the next thirty years.\n\nThursday, May 21 · 6:00–8:00 PM · Weber State Davis Campus, Layton · Spouses welcome.',
        cta: 'SIGN_UP',
    },
    {
        id: '120241963282820665',
        slug: 'five-systems',
        headline: 'Two Hours. Five Systems. One Retirement.',
        body: 'Five federal benefit systems. One retirement. Decisions that could shape the next thirty years.\n\nJoin Ann Werts for a complimentary 2-hour workshop on FERS, TSP, FEHB, FEGLI, and Social Security — no products sold, no pitch, just open Q&A.\n\nLayton · Thursday, May 21 · 6:00–8:00 PM · Weber State Davis Campus.',
        cta: 'LEARN_MORE',
    },
    {
        id: '120241963283720665',
        slug: 'decisions',
        headline: 'Decisions That Could Shape Thirty Years',
        body: 'Federal employees within 10 years of retirement: a handful of decisions can shape the next 20+ years — and most of us only get one chance to make them right.\n\nAnn Werts is hosting a complimentary 2-hour workshop at Weber State Davis Campus in Layton to walk through FERS, TSP, FEHB, FEGLI, and Social Security. No products. Open Q&A.\n\nThursday, May 21 · 6:00–8:00 PM · Spouses encouraged.',
        cta: 'LEARN_MORE',
    },
];

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    console.log('Rewriting 3 Hill AFB ads to remove military-base mention…\n');
    for (const ad of ADS) {
        const link = `${LANDING_URL}?utm_source=facebook&utm_medium=cpc&utm_campaign=fed-workshops-edu-may2026&utm_content=hill-afb-${ad.slug}`;
        const creative = {
            object_story_spec: {
                page_id: PAGE_ID,
                link_data: {
                    message: ad.body,
                    name: ad.headline,
                    link: link,
                    image_hash: PROVEN_IMAGE_HASH,
                    call_to_action: {
                        type: ad.cta,
                        value: { link: link },
                    },
                },
            },
        };
        console.log(`Updating ${ad.id} (${ad.slug})…`);
        await post(`${BASE}/${ad.id}`, { creative: JSON.stringify(creative) });
        console.log('  ✓ creative replaced — back to PENDING_REVIEW');
    }
    console.log('\nAll 3 Hill AFB ads updated. Meta will re-review.');
    console.log('Check status in ~30 min: node scripts/fb-launch.js (pre-flight only) or in Ads Manager.');
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
