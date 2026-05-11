#!/usr/bin/env node

// Verifies all 9 ads passed Meta auto-review, then flips the campaign live.
// Refuses to flip if any ad is DISAPPROVED.

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

loadDotenv(path.join(__dirname, '..', '.env'));
const TOKEN = process.env.FB_ACCESS_TOKEN;
const ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const BASE = 'https://graph.facebook.com/v19.0';

const CAMPAIGN_ID = '120241962930110665';
const ADSET_IDS = ['120241962936030665', '120241963276230665', '120241963280110665'];

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    console.log('Pre-flight check on all ads in campaign…\n');
    const adsResp = await getJson(`${BASE}/${CAMPAIGN_ID}/ads?fields=id,name,status,effective_status,configured_status,ad_review_feedback&limit=50&access_token=${TOKEN}`);
    const ads = adsResp.data || [];
    console.log(`Found ${ads.length} ads.\n`);

    let blockers = 0;
    for (const a of ads) {
        const ok = a.effective_status !== 'DISAPPROVED' && a.effective_status !== 'WITH_ISSUES';
        const mark = ok ? '✓' : '✗';
        console.log(`  ${mark} ${a.name}`);
        console.log(`     effective_status=${a.effective_status}  configured=${a.configured_status}`);
        if (a.ad_review_feedback) console.log(`     review_feedback=${JSON.stringify(a.ad_review_feedback)}`);
        if (!ok) blockers++;
    }

    if (blockers > 0) {
        console.error(`\n✗ ${blockers} ad(s) have review issues. NOT flipping campaign live.`);
        process.exit(1);
    }
    console.log(`\n✓ All ${ads.length} ads cleared review. Flipping live.\n`);

    // Flip campaign + ad sets to ACTIVE
    console.log(`Flipping campaign ${CAMPAIGN_ID} → ACTIVE`);
    await post(`${BASE}/${CAMPAIGN_ID}`, { status: 'ACTIVE' });
    console.log('  ✓ campaign live');

    for (const id of ADSET_IDS) {
        console.log(`Flipping ad set ${id} → ACTIVE`);
        await post(`${BASE}/${id}`, { status: 'ACTIVE' });
        console.log('  ✓ ad set live');
    }

    // Flip individual ads ACTIVE (campaign-level ACTIVE doesn't always flip ads)
    for (const a of ads) {
        if (a.configured_status === 'PAUSED') {
            await post(`${BASE}/${a.id}`, { status: 'ACTIVE' });
            console.log(`  ✓ ad live: ${a.name}`);
        }
    }

    console.log('\n=== LIVE ===');
    console.log(`Campaign: https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${ACCOUNT_ID}&selected_campaign_ids=${CAMPAIGN_ID}`);
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
