#!/usr/bin/env node

// Pull city keys for Ogden, SLC, Layton from the existing SAC workshop adsets'
// targeting specs, plus search for missing ones via the targetingsearch API.

const https = require('https');
const fs = require('fs');
const path = require('path');

loadDotenv(path.join(__dirname, '..', '.env'));
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const BASE = 'https://graph.facebook.com/v19.0';
const SAC_WORKSHOP_CAMPAIGN_ID = '120241691882900665';

main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });

async function main() {
    const adsets = await getJson(`${BASE}/${SAC_WORKSHOP_CAMPAIGN_ID}/adsets?fields=id,name,targeting&access_token=${FB_ACCESS_TOKEN}`);
    const cityKeys = {};
    for (const a of adsets.data || []) {
        const cities = a.targeting?.geo_locations?.cities || [];
        for (const c of cities) {
            cityKeys[c.name || c.key] = { key: c.key, name: c.name, region: c.region, country: c.country, radius: c.radius, distance_unit: c.distance_unit };
        }
        console.log(`${a.name}:`, JSON.stringify(a.targeting?.geo_locations || {}));
    }
    console.log('\nCity keys found in SAC workshops:');
    console.log(JSON.stringify(cityKeys, null, 2));

    // Search for any missing cities
    const wanted = ['Ogden, Utah', 'Salt Lake City, Utah', 'Layton, Utah'];
    console.log('\nSearching targetingsearch for each:');
    for (const q of wanted) {
        const r = await getJson(`${BASE}/search?type=adgeolocation&location_types=["city"]&q=${encodeURIComponent(q)}&access_token=${FB_ACCESS_TOKEN}`);
        const match = (r.data || []).find((c) => c.region === 'Utah') || r.data?.[0];
        console.log(`  ${q} →`, match ? `key=${match.key} name="${match.name}, ${match.region}"` : 'no match');
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
