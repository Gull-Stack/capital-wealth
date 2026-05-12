#!/usr/bin/env node
// One-off backfill: re-attach the past 30 days of workshop/webinar leads
// to their correct Salesforce Campaigns. Run after the campaign_id wiring
// PR is merged + deployed. Has already run once (2026-05-12) — keep around
// as reference for future similar backfills.
//
// Usage:
//   node scripts/sf-backfill-campaigns.js --dry-run   # preview, no writes
//   node scripts/sf-backfill-campaigns.js             # apply
//
// Identifies leads currently in the catch-all "Website Form 2026" campaign
// (701VS00000dB91aYAC) and re-routes by:
//   - LeadSource='Webinar'                       → 701VS00000eWrYVYA0 (Webinar 5/14)
//   - Description includes "Event Date: 2026-05-19" → 701VS00000eWgMsYAK (Ogden)
//   - Description includes "Event Date: 2026-05-20" → 701VS00000eWe58YAC (SLC)
//   - Description includes "Event Date: 2026-05-21" → 701VS00000eWqE8YAK (Hill AFB)
//
// Updates Lead.Campaign__c AND creates CampaignMember if missing.

import { execSync } from 'node:child_process';

const DRY = process.argv.includes('--dry-run');
const ORG = 'cw';
const DEFAULT_CAMPAIGN = '701VS00000dB91aYAC';

const ROUTES = [
  { key: 'webinar',  campaignId: '701VS00000eWrYVYA0', match: (l) => l.LeadSource === 'Webinar' },
  { key: 'ogden',    campaignId: '701VS00000eWgMsYAK', match: (l) => (l.Description || '').includes('Event Date: 2026-05-19') },
  { key: 'slc',      campaignId: '701VS00000eWe58YAC', match: (l) => (l.Description || '').includes('Event Date: 2026-05-20') },
  { key: 'hill-afb', campaignId: '701VS00000eWqE8YAK', match: (l) => (l.Description || '').includes('Event Date: 2026-05-21') },
];

function sf(args) {
  return JSON.parse(execSync(`sf ${args} --json`, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }));
}

function queryAll(soql) {
  const res = sf(`data query -o ${ORG} -q "${soql.replace(/"/g, '\\"')}"`);
  return res.result.records;
}

console.log(`[backfill-campaigns] ${DRY ? 'DRY RUN' : 'APPLY'} — pulling candidates...`);
const candidates = queryAll(
  `SELECT Id, LeadSource, Description, Campaign__c FROM Lead ` +
  `WHERE CreatedDate = LAST_N_DAYS:30 AND Campaign__c = '${DEFAULT_CAMPAIGN}'`
);
console.log(`  ${candidates.length} leads currently in default catch-all (last 30d)`);

const buckets = Object.fromEntries(ROUTES.map((r) => [r.key, []]));
const skip = [];
for (const lead of candidates) {
  const route = ROUTES.find((r) => r.match(lead));
  if (route) buckets[route.key].push(lead.Id);
  else skip.push(lead.Id);
}
for (const route of ROUTES) {
  console.log(`  → ${route.key.padEnd(8)} (${route.campaignId}): ${buckets[route.key].length} leads`);
}
console.log(`  → skip (no match, stay in catch-all): ${skip.length}`);

if (DRY) {
  console.log('\n[dry-run] No writes performed. Re-run without --dry-run to apply.');
  process.exit(0);
}

let updates = 0;
let cmCreates = 0;
let cmSkips = 0;
for (const route of ROUTES) {
  for (const leadId of buckets[route.key]) {
    // 1. Update Lead.Campaign__c and Are_You_Federal__c (all 4 buckets are federal)
    try {
      execSync(
        `sf data update record -o ${ORG} -s Lead -i ${leadId} -v "Campaign__c=${route.campaignId} Are_You_Federal__c=Yes" --json`,
        { encoding: 'utf8' }
      );
      updates++;
    } catch (e) {
      console.error(`  ! Lead update failed ${leadId}: ${e.message.split('\n')[0]}`);
      continue;
    }
    // 2. Create CampaignMember if missing
    const existing = queryAll(
      `SELECT Id FROM CampaignMember WHERE LeadId = '${leadId}' AND CampaignId = '${route.campaignId}' LIMIT 1`
    );
    if (existing.length > 0) {
      cmSkips++;
      continue;
    }
    try {
      execSync(
        `sf data create record -o ${ORG} -s CampaignMember -v "LeadId=${leadId} CampaignId=${route.campaignId} Status=Responded" --json`,
        { encoding: 'utf8' }
      );
      cmCreates++;
    } catch (e) {
      console.error(`  ! CampaignMember create failed lead=${leadId} camp=${route.campaignId}: ${e.message.split('\n')[0]}`);
    }
  }
}

console.log(`\n[backfill-campaigns] done: ${updates} Lead updates, ${cmCreates} CampaignMember creates, ${cmSkips} CM already existed`);
