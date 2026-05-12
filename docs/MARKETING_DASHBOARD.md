# Marketing Dashboard Build Guide

A live marketing dashboard for Mike (and anyone else) to see today's / this week's lead volume by channel, plus a brand-awareness pane linked from Google Analytics.

**Prerequisite:** [PR #28](https://github.com/Gull-Stack/capital-wealth/pull/28) must be merged + deployed to production. Without it, all federal-event leads continue to land in "Website Form 2026" and the per-channel reports will all show 0 except the catch-all.

## TL;DR

1. Merge & deploy [PR #28](https://github.com/Gull-Stack/capital-wealth/pull/28).
2. Run `node tmp/backfill-campaigns.js --dry-run`, then without the flag, to re-attach the past 30 days of leads to their correct Campaigns (≈ 265 leads).
3. In Salesforce: build 6 Reports in `4 - Marketing Reports` folder (specs below).
4. Build 1 Dashboard named **CW — Marketing Live** in same folder.
5. Build a Looker Studio dashboard against GA4 (specs below), link it from a Rich Text component at the top of the SF dashboard.
6. Add Mike (`mstevens@capitalwealth.com`) to the SF dashboard sharing AND the Looker Studio dashboard.

---

## The 5 channels we're tracking

| # | Channel | SF Campaign | Campaign Id |
|---|---|---|---|
| 1 | Federal Webinar (May 14) | Federal Benefits Workshop 5.14.26 | `701VS00000eWrYVYA0` |
| 2 | Workshop Ogden (May 19) | Federal Benefits Workshop 5.19.26 | `701VS00000eWgMsYAK` |
| 3 | Workshop SLC (May 20) | Federal Benefits Workshop 5.20.26 | `701VS00000eWe58YAC` |
| 4 | Workshop Hill AFB (May 21) | Federal Benefits Workshop 5.21.26 | `701VS00000eWqE8YAK` |
| 5 | General Contact (catch-all) | Website Form 2026 | `701VS00000dB91aYAC` |

---

## Reports

Build each report in **Lightning Report Builder** (`/lightning/o/Report/home` → New Report). Save each into folder **`4 - Marketing Reports`**. Report Type for all: **Leads**.

### R1 — Leads Today by Channel

- **Report Type:** Leads
- **Filters:**
  - `Created Date` equals `Today`
  - `Campaign` (i.e. `Campaign__c`) in (`701VS00000eWrYVYA0`, `701VS00000eWgMsYAK`, `701VS00000eWe58YAC`, `701VS00000eWqE8YAK`, `701VS00000dB91aYAC`)
- **Group By (row):** Campaign Name
- **Columns:** Record Count (only)
- **Format:** Summary
- **Save as:** `R1 — Leads Today by Channel`

### R2 — Leads This Week by Channel

- Same as R1, except **Filter** `Created Date` equals `This Week`.
- **Format:** Summary
- **Chart:** Horizontal bar chart, X-axis = Record Count, Y-axis = Campaign Name
- **Save as:** `R2 — Leads This Week by Channel`

### R3 — Lead Volume 30 Days (by Channel)

- **Filters:**
  - `Created Date` equals `Last 30 Days`
  - `Campaign` in (the 5 IDs above)
- **Group By (rows):** Created Date (group by Day)
- **Group By (columns):** Campaign Name
- **Columns:** Record Count
- **Format:** Matrix
- **Chart:** Stacked column chart (X-axis = Created Date by Day, segments = Campaign Name)
- **Save as:** `R3 — Lead Volume 30 Days`

### R4 — Federal vs General (30 days)

- **Filters:** `Created Date` equals `Last 30 Days`
- **Group By (row):** `Are You Federal?` (`Are_You_Federal__c`)
- **Format:** Summary
- **Chart:** Donut
- **Save as:** `R4 — Federal vs General 30d`

### R5 — Today's Leads (table)

- **Filters:** `Created Date` equals `Today`
- **Columns:** First Name, Last Name, Email, Phone, Lead Source, Campaign Name, Created Date
- **Group By:** none
- **Format:** Tabular
- **Sort:** Created Date descending
- **Save as:** `R5 — Today's Leads`

### R6 — Leads by Lead Source (90 days)

- **Filters:** `Created Date` equals `Last 90 Days`
- **Group By (row):** Lead Source
- **Format:** Summary
- **Chart:** Donut
- **Save as:** `R6 — LeadSource 90d`

---

## Dashboard — `CW — Marketing Live`

In SF: **Dashboards → New Dashboard** → folder `4 - Marketing Reports` → name `CW — Marketing Live`.

**Running User:** `jcohen@capitalwealth.com` (Josh — has full org sharing visibility so Mike sees all leads regardless of his sharing rules).

**Refresh:** Daily at 7am + on-open.

### Layout (6 rows)

```
ROW 1 — BRAND AWARENESS (GA4)
  [Rich Text component: link to Looker Studio dashboard — see Phase C below]

ROW 2 — TODAY (5 metric cards, equal width)
  C1a: Webinar today        (from R1, filter to Campaign = 701VS00000eWrYVYA0)
  C1b: SLC today            (from R1, filter to Campaign = 701VS00000eWe58YAC)
  C1c: Ogden today          (from R1, filter to Campaign = 701VS00000eWgMsYAK)
  C1d: Hill AFB today       (from R1, filter to Campaign = 701VS00000eWqE8YAK)
  C1e: General today        (from R1, filter to Campaign = 701VS00000dB91aYAC)

ROW 3 — THIS WEEK + 30-DAY TREND
  C2: This Week by Channel (bar)         ← R2
  C3: 30-Day Volume (stacked column)     ← R3

ROW 4 — SEGMENTATION
  C4: Federal vs General (donut)         ← R4
  C6: Lead Source 90d (donut)            ← R6

ROW 5 — TODAY'S LEADS TABLE
  C5: Today's Leads (table)              ← R5
```

### Creating the 5 KPI cards (Row 2)

For each card: **Add Component → Metric → Source = R1 — Leads Today by Channel → Add Filter `Campaign equals <campaign id>`**. Title each card with the channel name. Use navy (`#0f2742`) as the metric color.

### Mike's access

After saving the dashboard, click **Sharing → Add → User: Mike Stevens → View access**. Then in Dashboard Properties, set "Running User" to Josh so Mike sees full org-level data.

---

## Phase C — Looker Studio dashboard (GA4)

### One-time setup (≈ 30 minutes)

1. **Confirm Mike has GA4 viewer access.** GA → Admin → Property Access Management → add `mstevens@capitalwealth.com` if not already there.
2. **Go to** [lookerstudio.google.com](https://lookerstudio.google.com) → Create → Report → Add data → Google Analytics → select the Capital Wealth GA4 property.
3. **Name the report:** `CW — Brand Awareness (Live)`.
4. **Set date range default** to "Last 30 days" with comparison "Previous period".

### 3 widgets to build

**(a) Total Website Visits**
- Chart type: Scorecard
- Metric: `Sessions`
- Date range: Last 7 days
- Comparison: Previous period
- Add a second scorecard with Last 30 days for context.

**(b) Visits by Page**
- Chart type: Table
- Dimension: `Page path + query string` (or `Page title` for human-readable)
- Metric: `Sessions`, `Engaged sessions`
- Sort: Sessions descending
- Rows: 20
- Date range: Last 30 days

**(c) Referral Sources**
- Chart type: Donut chart
- Dimension: `Session source` (or `Session source / medium` for more detail)
- Metric: `Sessions`
- Filter (optional): `Sessions > 5` to suppress noise
- Date range: Last 30 days

### Share + link from Salesforce

1. In Looker Studio: **Share → Add people →** `mstevens@capitalwealth.com` (Viewer) + anyone else who needs it.
2. Copy the report URL (Looker Studio top-right "Share → Get link").
3. Back in Salesforce, edit `CW — Marketing Live` dashboard → Row 1 → Add Component → **Rich Text** → paste:
   ```html
   <h3 style="margin:0 0 8px;color:#0f2742">Top of Funnel — Brand Awareness</h3>
   <p>Live website visits, pages, and referral sources from Google Analytics.</p>
   <p><a href="<PASTE LOOKER STUDIO URL>" target="_blank" style="background:#fdd25e;color:#0f2742;padding:10px 18px;font-weight:bold;text-decoration:none;border-radius:4px;display:inline-block">View Live GA4 Dashboard ↗</a></p>
   ```

---

## Verification

Run after dashboard is built (and after PR #28 has shipped + backfill has been applied).

### Confirm per-channel today counts via SOQL

```bash
sf data query -o cw -q "SELECT Campaign.Name camp, COUNT(Id) cnt FROM Lead WHERE CreatedDate = TODAY AND Campaign__c IN ('701VS00000eWrYVYA0','701VS00000eWgMsYAK','701VS00000eWe58YAC','701VS00000eWqE8YAK','701VS00000dB91aYAC') GROUP BY Campaign.Name ORDER BY COUNT(Id) DESC"
```

The numbers from this query should match the 5 KPI cards (C1a–C1e) in the dashboard exactly.

### Submit a test lead from each page

After PR #28 is deployed, submit a test lead from each of the 4 event pages with these emails:

- `brycedmorgan+marketing-test-webinar@gmail.com` from `/l/federal-benefits-webinar/`
- `brycedmorgan+marketing-test-ogden@gmail.com` from `/l/federal-benefits-workshop-ogden/`
- `brycedmorgan+marketing-test-slc@gmail.com` from `/l/federal-benefits-workshop-slc/`
- `brycedmorgan+marketing-test-hillafb@gmail.com` from `/l/federal-benefits-workshop-hill-afb/`

Then confirm:

```bash
sf data query -o cw -q "SELECT Email, Campaign.Name, Are_You_Federal__c FROM Lead WHERE Email LIKE 'brycedmorgan+marketing-test-%' ORDER BY CreatedDate DESC"
```

Each test lead should appear under its expected Campaign with `Are_You_Federal__c='Yes'`.

### Refresh dashboard

Click **Refresh** on the dashboard top-right. All 5 KPI cards should update within seconds and reflect the new test leads + any organic traffic since the last refresh.

---

## Maintenance

- **When you add a new federal event:** create the new SF Campaign first, then add a `<input type="hidden" name="campaign_id" value="<new-id>">` to that event's landing page, then update R1/R2/R3 filter to include the new Campaign Id, and add a 6th KPI card to Row 2.
- **When an event ends:** the Campaign keeps its data forever; the corresponding card just stops incrementing. No cleanup needed.
- **For GA4 changes:** edit the Looker Studio report directly — no code or SF changes needed.
