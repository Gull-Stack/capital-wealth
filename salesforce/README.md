# Salesforce metadata

SFDX project for version-controlling Salesforce reports + dashboards deployed by Claude. Org alias: `cw`.

## Layout

```
salesforce/
├── sfdx-project.json
└── force-app/main/default/
    ├── reports/X4MarketingReportsMarketingReports/  ← reports in "4 - Marketing Reports" folder
    └── dashboards/X5MarketingMarketing/             ← dashboards in "4 - Marketing" folder
```

The two folders have different developer names because they're different folder types — one is a Report folder, one is a Dashboard folder. SF created the prefix `X4Marketing…` for the Report folder and `X5Marketing…` for the Dashboard folder.

## Deploying

From the repo root:

```bash
# Deploy everything
cd salesforce && sf project deploy start -o cw -d force-app

# Deploy just reports
cd salesforce && sf project deploy start -o cw -d force-app/main/default/reports

# Deploy just the dashboard
cd salesforce && sf project deploy start -o cw -d force-app/main/default/dashboards

# Dry-run before applying
cd salesforce && sf project deploy start -o cw -d force-app --dry-run --ignore-conflicts
```

## Retrieving changes made in the SF UI

If someone edits a report or dashboard via the SF Lightning UI and you want to capture it back:

```bash
cd salesforce && sf project retrieve start -o cw \
  --metadata "Dashboard:X5MarketingMarketing/CW_Marketing_Live" \
  --metadata "Report:X4MarketingReportsMarketingReports/CW_Marketing_R1_Leads_Today_by_Channel"
```

Then `git diff` to see what changed.

## What's currently here

- **CW — Marketing Live** dashboard ([01ZVS000002sdBJ2AY](https://capitalwealth.lightning.force.com/lightning/r/Dashboard/01ZVS000002sdBJ2AY/view)) — Mike's live marketing dashboard. 6 components: today/week by channel, 30-day trend, federal/general donut, lead source donut, today's leads table.
- **R1–R6 reports** that feed the dashboard.

The 5 channels tracked correspond to the 5 SF Campaigns wired up in [api/submit-lead.js](../api/submit-lead.js) + the four `<input type="hidden" name="campaign_id">` fields on the federal-event landing pages. See [docs/MARKETING_DASHBOARD.md](../docs/MARKETING_DASHBOARD.md).
