# Marketing Dashboard

Live marketing dashboard for Mike: see today's / this week's lead volume by channel, plus a brand-awareness pane linked to Google Analytics 4.

## Live URLs

- **Marketing Hub (one-pager):** [CW — Marketing Hub](https://capitalwealth.lightning.force.com/lightning/n/CW_Marketing_Hub) — Looker Studio GA4 embed + link to the dashboard. **This is the URL to give Mike.**
- **SF Dashboard alone:** [CW — Marketing Live](https://capitalwealth.lightning.force.com/lightning/r/Dashboard/01ZVS000002sdBJ2AY/view)
- **Looker Studio direct:** [CW Brand Awareness Live](https://lookerstudio.google.com/reporting/f08fd886-91f2-4c0f-a28b-179a3dba0dfb)
- **Folder:** `4 - Marketing` (dashboards) / `4 - Marketing Reports` (reports)
- **Running user:** `jcohen@capitalwealth.com` (so all viewers see full-org lead data)
- **Folder access:** All Internal Users (Mike included)

## Adding the Marketing Hub to the nav bar

The tab is already accessible via the **App Launcher** (9-dot grid icon, top-left) → search "Marketing Hub". To pin it to the top nav alongside Dashboards/Leads/etc:

1. Open any page in the Capital Wealth app.
2. Click the **pencil icon** at the right end of the nav bar ("Edit Capital Wealth navigation items").
3. Click **+ Add More Items**, search for **Marketing Hub**, add it, click **Save**.

This is a per-user setting (each user does it once for their own nav). To make it appear by default for everyone, edit the app via Setup → App Manager → Capital Wealth → Edit → Navigation Items → add Marketing Hub → Save.

## What's on it

| Row | Component | Source report |
|-----|-----------|---------------|
| 1 | Leads Today by Channel — bar | R1 |
| 1 | Leads This Week by Channel — bar | R2 |
| 2 | Lead Volume — Last 30 Days — column | R3 |
| 3 | Federal vs General (30 days) — donut | R4 |
| 3 | Lead Source (90 days) — donut | R6 |
| 4 | Today's Leads — table | R5 |

> **TODO (one-time):** Add a Rich Text component at the top of the dashboard pointing to the Looker Studio GA4 dashboard. See [Looker Studio setup](#looker-studio-setup) below — must be done via SF UI because the metadata API doesn't support `RichText` component XML.

## The 5 channels we're tracking

| Channel | SF Campaign | Campaign Id |
|---|---|---|
| Federal Webinar (May 14) | Federal Benefits Workshop 5.14.26 | `701VS00000eWrYVYA0` |
| Workshop Ogden (May 19) | Federal Benefits Workshop 5.19.26 | `701VS00000eWgMsYAK` |
| Workshop SLC (May 20) | Federal Benefits Workshop 5.20.26 | `701VS00000eWe58YAC` |
| Workshop Hill AFB (May 21) | Federal Benefits Workshop 5.21.26 | `701VS00000eWqE8YAK` |
| General Contact | Website Form 2026 | `701VS00000dB91aYAC` |

Channel attribution comes from `Lead.Campaign__c`, populated automatically by [api/submit-lead.js](../api/submit-lead.js) based on the `campaign_id` hidden input on each landing page.

## Source metadata

All reports + the dashboard are version-controlled at [salesforce/force-app/main/default/](../salesforce/). To redeploy:

```bash
cd salesforce && sf project deploy start -o cw -d force-app/main/default
```

To retrieve UI-side edits back into the repo:

```bash
cd salesforce && sf project retrieve start -o cw \
  --metadata "Dashboard:X5MarketingMarketing/CW_Marketing_Live"
```

## Looker Studio setup

**GA4 Property ID:** `375072851`

### One-time setup (≈ 5 min of clicks)

1. **Open this Linking-API URL** (signs you in via your Google account, pre-connects the GA4 data source):

   [Open Looker Studio with GA4 pre-connected →](https://lookerstudio.google.com/reporting/create?c.reportName=CW%20Brand%20Awareness%20Live&ds.ds0.connector=googleAnalytics&ds.ds0.propertyId=375072851)

2. Approve the Google Analytics access prompt. A blank canvas opens.

3. Set the **report date range** to "Last 30 days" with comparison "Previous period" (top right of the canvas).

4. **Add three charts** (each is one click → one drag):

   **(a) Total Website Visits** — `Add a chart` → `Scorecard` → metric: `Sessions`. Duplicate this scorecard and change the second one's date range to "Last 7 days" so you have both windows visible.

   **(b) Visits by Page** — `Add a chart` → `Table` → dimension: `Page path + query string`, metrics: `Sessions`, `Engaged sessions`. Sort by Sessions descending. Rows: 20.

   **(c) Referral Sources** — `Add a chart` → `Donut` → dimension: `Session source / medium`, metric: `Sessions`. Hide the rows where Sessions < 5 (Filter → metric → Sessions > 5) so the donut isn't cluttered.

5. **Share with Mike:** Share button (top right) → enter `mstevens@capitalwealth.com` → Viewer.

6. **Copy the report URL** (Share → Get link → Copy).

### Linking it from the Salesforce dashboard

1. Open [CW — Marketing Live](https://capitalwealth.lightning.force.com/lightning/r/Dashboard/01ZVS000002sdBJ2AY/view).
2. Click **Edit** (top-right pencil icon).
3. **+ Component** → **Rich Text** → drag to the top row, full width.
4. Title: `Brand Awareness — Google Analytics`
5. Paste this HTML (already wired to the live Looker Studio report):
   ```html
   <h3 style="margin:0 0 8px;color:#0f2742;font-family:Arial,sans-serif">Top of Funnel — Brand Awareness</h3>
   <p style="margin:0 0 12px;color:#475569">Live website visits, pages, and referral sources from Google Analytics.</p>
   <p style="margin:0"><a href="https://lookerstudio.google.com/reporting/f08fd886-91f2-4c0f-a28b-179a3dba0dfb" target="_blank" rel="noopener" style="background:#fdd25e;color:#0f2742;padding:10px 18px;font-weight:bold;text-decoration:none;border-radius:4px;display:inline-block;font-family:Arial,sans-serif">View Live GA4 Dashboard ↗</a></p>
   ```
6. **Save** the dashboard.

## Backfill script

[scripts/sf-backfill-campaigns.js](../scripts/sf-backfill-campaigns.js) is a one-off that already ran during the dashboard rollout. It re-attached the past 30 days of leads to their correct Campaigns and set `Are_You_Federal__c='Yes'` on all federal-event leads.

Re-run only if a similar bulk re-attribution is needed. Always run with `--dry-run` first.

## Verification

```bash
# Today's leads per channel (should match the dashboard's "Today" bar chart exactly)
sf data query -o cw -q "SELECT Campaign__c, COUNT(Id) cnt FROM Lead WHERE CreatedDate=TODAY AND Campaign__c IN ('701VS00000eWrYVYA0','701VS00000eWgMsYAK','701VS00000eWe58YAC','701VS00000eWqE8YAK','701VS00000dB91aYAC') GROUP BY Campaign__c"

# This week's leads per channel
sf data query -o cw -q "SELECT Campaign__c, COUNT(Id) cnt FROM Lead WHERE CreatedDate=THIS_WEEK AND Campaign__c IN ('701VS00000eWrYVYA0','701VS00000eWgMsYAK','701VS00000eWe58YAC','701VS00000eWqE8YAK','701VS00000dB91aYAC') GROUP BY Campaign__c"

# All 5 channels lifetime (sanity check)
sf data query -o cw -q "SELECT Campaign__c, COUNT(Id) cnt FROM Lead WHERE Campaign__c IN ('701VS00000eWrYVYA0','701VS00000eWgMsYAK','701VS00000eWe58YAC','701VS00000eWqE8YAK','701VS00000dB91aYAC') GROUP BY Campaign__c"
```

After PR #28 was deployed (May 11, 2026), all new federal-event leads automatically route to their correct Campaigns. Webinar leads also auto-set `Are_You_Federal__c='Yes'`.

## Maintenance

- **Adding a new federal event:** create the SF Campaign in the Lightning UI, then add a `<input type="hidden" name="campaign_id" value="<new-id>">` to that event's landing page (model after [src/l/federal-benefits-workshop-ogden/index.njk:939](../src/l/federal-benefits-workshop-ogden/index.njk)). Update the R1/R2/R3 reports' filter to include the new Campaign Id by editing the report XML in this repo and redeploying.
- **When an event ends:** the Campaign keeps its data forever; remove the Campaign Id from the R1–R3 report filter values if you want the dashboard to stop showing it.
- **For GA4 changes:** edit the Looker Studio report directly — no code or SF changes needed.

---

# MARKETING: Spend & ROI Dashboard

A second, separate marketing dashboard — Dashboard 3 of the SF Dashboard Overhaul.
"CW — Marketing Live" (above) answers *how many leads, by channel*. **Spend & ROI**
answers *was the spend worth it* — cost per lead / appointment / meeting / closed won,
total spend, channel mix, and funnel-by-channel.

- **Dashboard:** [MARKETING: Spend & ROI](https://capitalwealth.lightning.force.com/lightning/r/Dashboard/01ZVS000002uXhh2AE/view) — id `01ZVS000002uXhh2AE`, folder `4 - Marketing`.
- **Reports:** `M1`–`M9` in the `4 - Marketing Reports` folder, version-controlled at [salesforce/force-app/main/default/reports/](../salesforce/).
- **Running user:** `jcohen@capitalwealth.com`.

## Tiles

| Tile | Report | How it is computed |
|------|--------|--------------------|
| Total Marketing Spend | M3 | SUM `ActualCost`, campaigns with `Is_Bottom_Campaign__c`, `StartDate` this quarter |
| Cost Per Lead | M1 | `ActualCost ÷ NumberOfLeads` (report summary formula) |
| Cost Per Closed Won | M2 | existing `Cost_Per_Won__c` field (`ActualCost ÷ NumberOfWonOpportunities`) |
| Cost Per Appointment Requested | M6 | `ActualCost ÷ X1st_Sets__c` (first discovery booked) |
| Cost Per Discovery Held | M7 | `ActualCost ÷ X1st_Kepts__c` (first discovery kept) |
| Cost Per Investment Held | M8 | `ActualCost ÷ X3rd_Kepts__c` (investment meeting kept) |
| Channel Mix Trend | M5 | Lead count by `LeadSource` per month, last 6 months |
| Funnel by Channel | M9 | Leads → Attended → Sets → Kepts → Onboarded, by campaign type |
| Lead Source Within Campaign | M4 | Lead `LeadSource` × `Campaign__c` matrix, last 6 months |

All cost tiles read `Campaign.ActualCost`. Cost-per-stage denominators map to CW's
funnel terms: "Appointment Requested" = 1st Set, "Discovery Held" = 1st Kept,
"Investment Held" = 3rd Kept. **Confirm this funnel mapping with Josh.**

## Cost data — where it comes from

`ActualCost` is the single cost source for every tile. Today ~34% of campaigns
(147 / 430) have it populated; seminars/radio were entered manually. Facebook ad
spend is synced automatically (below). Google Ads and radio invoices still need
manual entry on the Campaign record.

> **Known divergence (flag for the team):** `ActualCost` and the itemized
> `Total_Campaign_Cost__c` (Mailer + Venue + Food + Advertisement + Social +
> Speaker) are two parallel totals. The Marketing dashboard standardizes on
> `ActualCost`. Pick one canonical source so the Marketing, Campaigns and
> Operations dashboards agree.

## Facebook ad-spend sync

FB spend flows into `Campaign.ActualCost` automatically. Each FB-funded SF
Campaign stores its FB source id(s) in the `Platform_Spend_Source__c` text field,
comma-separated. Token format: `facebook:campaign:<id>` or `facebook:adset:<id>`.

Current mapping (set once on these campaigns):

| SF Campaign | Id | Platform_Spend_Source__c |
|---|---|---|
| Federal Benefits Webinar 5.14.26 | `701VS00000eWrYVYA0` | `facebook:campaign:120241615030540665` |
| Federal Benefits Workshop 5.19.26 | `701VS00000eWgMsYAK` | `facebook:adset:120241962936030665,facebook:adset:120241693236520665` |
| Federal Benefits Workshop 5.20.26 | `701VS00000eWe58YAC` | `facebook:adset:120241963276230665,facebook:adset:120241692540170665` |
| Federal Benefits Workshop 5.21.26 | `701VS00000eWqE8YAK` | `facebook:adset:120241963280110665,facebook:adset:120241692632300665` |
| Facebook Ads - Federal | `701VS00000dT09RYAS` | `facebook:campaign:120239341718590665` |
| Facebook Ads - CW | `701VS00000dSmACYA0` | `facebook:campaign:120242226310950665` |

Workshop SF campaigns map to FB **ad sets** (one per city) because the FB
workshop campaigns cover all three events — ad-set granularity keeps each event's
cost accurate.

**Manual sync** ([scripts/sf-sync-fb-spend.js](../scripts/sf-sync-fb-spend.js)):

```bash
node scripts/sf-sync-fb-spend.js --dry-run   # preview, no writes
node scripts/sf-sync-fb-spend.js             # apply
```

Reads `FB_ACCESS_TOKEN` / `FB_AD_ACCOUNT_ID` from `.env`; writes via the `sf` CLI.

**Scheduled sync** ([api/sync-fb-spend.js](../api/sync-fb-spend.js)): a Vercel
cron (`vercel.json` → `crons`, daily 07:00 UTC) hits `/api/sync-fb-spend`, which
refreshes `ActualCost` for every campaign with a `Platform_Spend_Source__c`. Test
it live with `/api/sync-fb-spend?dry=1`. Requires `SF_CLIENT_ID`,
`SF_REFRESH_TOKEN`, `FB_ACCESS_TOKEN`, `FB_AD_ACCOUNT_ID` (and optionally
`CRON_SECRET`) in Vercel env — all already set except `CRON_SECRET`.

## Adding a new FB-funded campaign

Set `Platform_Spend_Source__c` on the SF Campaign to the FB campaign or ad-set
id(s) (`node scripts/fb-report.js this_year` lists them). The next sync run picks
it up — no code change.

## Not yet automated

- **Google Ads / radio / email spend** — manual entry on `Campaign.ActualCost`.
- **"vs. prior period" arrows** — Salesforce dashboards don't support
  period-comparison indicators on all component types; revisit per tile.
