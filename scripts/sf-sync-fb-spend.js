#!/usr/bin/env node

// Sync Facebook ad spend into Salesforce Campaign.ActualCost.
//
// Each SF Campaign that runs FB ads carries its FB source id(s) in the
// Platform_Spend_Source__c text field, comma-separated, e.g.:
//   facebook:campaign:120241615030540665
//   facebook:adset:120241962936030665,facebook:adset:120241693236520665
//
// This script pulls lifetime spend at both campaign and ad-set level, sums
// the spend for each SF Campaign's mapped FB ids, and writes the total to
// Campaign.ActualCost. ActualCost feeds the existing Cost_Per_Lead__c /
// Cost_Per_Won__c formulas and the MARKETING: Spend & ROI dashboard.
//
// Usage:
//   node scripts/sf-sync-fb-spend.js --dry-run   # preview, no writes
//   node scripts/sf-sync-fb-spend.js             # apply
//
// Reads FB_ACCESS_TOKEN / FB_AD_ACCOUNT_ID from .env at repo root.
// Salesforce writes go through the `sf` CLI (org alias `cw`).

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

loadDotenv(path.join(__dirname, '..', '.env'));

const DRY = process.argv.includes('--dry-run');
const ORG = 'cw';
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID;
const API = 'https://graph.facebook.com/v19.0';

if (!FB_ACCESS_TOKEN || !FB_AD_ACCOUNT_ID) {
  console.error('Missing FB_ACCESS_TOKEN or FB_AD_ACCOUNT_ID. Check .env at repo root.');
  process.exit(1);
}

main().catch((e) => {
  console.error('sync failed:', e.message);
  process.exit(1);
});

async function main() {
  console.log(`[sync-fb-spend] ${DRY ? 'DRY RUN' : 'APPLY'} — pulling FB insights (lifetime)...`);

  // 1. Lifetime spend by FB campaign id and by FB ad-set id.
  const campaignSpend = await fetchSpend('campaign', 'campaign_id');
  const adsetSpend = await fetchSpend('adset', 'adset_id');
  console.log(`  FB: ${Object.keys(campaignSpend).length} campaigns, ${Object.keys(adsetSpend).length} ad sets`);

  // 2. SF campaigns that declare a FB spend source.
  const mapped = sfQuery(
    "SELECT Id, Name, ActualCost, Platform_Spend_Source__c FROM Campaign " +
    "WHERE Platform_Spend_Source__c != null"
  );
  console.log(`  SF: ${mapped.length} campaigns with Platform_Spend_Source__c set\n`);

  if (mapped.length === 0) {
    console.log('  Nothing to sync. Populate Platform_Spend_Source__c on FB-funded campaigns first.');
    console.log('  Token format: facebook:campaign:<id> or facebook:adset:<id>, comma-separated.');
    return;
  }

  // 3. Compute new ActualCost per SF campaign.
  let writes = 0;
  let unchanged = 0;
  for (const c of mapped) {
    const tokens = String(c.Platform_Spend_Source__c)
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    let total = 0;
    const parts = [];
    let bad = false;
    for (const token of tokens) {
      const m = token.match(/^facebook:(campaign|adset):(\d+)$/);
      if (!m) {
        console.warn(`  ! ${c.Name}: unrecognized token "${token}" — skipped`);
        bad = true;
        continue;
      }
      const [, level, id] = m;
      const spend = level === 'campaign' ? campaignSpend[id] : adsetSpend[id];
      if (spend === undefined) {
        console.warn(`  ! ${c.Name}: FB ${level} ${id} returned no spend (check id / token validity)`);
        bad = true;
        continue;
      }
      total += spend;
      parts.push(`${level}:${id}=$${spend.toFixed(2)}`);
    }

    const current = Number(c.ActualCost || 0);
    const next = Math.round(total * 100) / 100;
    const delta = Math.abs(next - current);

    if (parts.length === 0) {
      console.log(`  - ${c.Name}: no resolvable FB spend, left at $${current.toFixed(2)}`);
      continue;
    }

    console.log(`  ${c.Name}`);
    console.log(`      ${parts.join('  ')}`);
    console.log(`      ActualCost $${current.toFixed(2)} -> $${next.toFixed(2)}${bad ? '  (partial — see warnings)' : ''}`);

    if (delta < 0.005) {
      unchanged++;
      continue;
    }
    if (!DRY) {
      execSync(
        `sf data update record -o ${ORG} -s Campaign -i ${c.Id} -v "ActualCost=${next}" --json`,
        { encoding: 'utf8' }
      );
    }
    writes++;
  }

  console.log(
    `\n[sync-fb-spend] ${DRY ? 'would update' : 'updated'} ${writes} campaign(s); ` +
    `${unchanged} already current.`
  );
  if (DRY) console.log('Re-run without --dry-run to apply.');
}

// Pull lifetime spend keyed by the given id field. Follows API paging.
async function fetchSpend(level, idField) {
  const out = {};
  let url =
    `${API}/act_${FB_AD_ACCOUNT_ID}/insights` +
    `?fields=${idField},spend&level=${level}&date_preset=maximum&limit=200` +
    `&access_token=${encodeURIComponent(FB_ACCESS_TOKEN)}`;
  while (url) {
    const page = await getJson(url);
    if (page.error) throw new Error(`FB API: ${page.error.message}`);
    for (const row of page.data || []) {
      out[row[idField]] = (out[row[idField]] || 0) + Number(row.spend || 0);
    }
    url = page.paging && page.paging.next ? page.paging.next : null;
  }
  return out;
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`bad JSON from FB (${res.statusCode})`));
          }
        });
      })
      .on('error', reject);
  });
}

function sfQuery(soql) {
  const res = JSON.parse(
    execSync(`sf data query -o ${ORG} -q "${soql.replace(/"/g, '\\"')}" --json`, {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    })
  );
  return res.result.records;
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
