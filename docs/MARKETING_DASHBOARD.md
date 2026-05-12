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
