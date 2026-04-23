# Capital Wealth — Salesforce Metadata

Metadata source for the `cw` Salesforce production org (`jcohen@capitalwealth.com`). Mirrors what is currently deployed. Re-deploy any subtree with the Salesforce CLI:

```bash
cd salesforce
sf project deploy start -o cw -d force-app/main/default/<subdir>
```

## What's here (2026-04-23)

### Chad Austin's Prospecting tab
New 12th tab on the `Home_Chad` HomePage FlexiPage, with an embedded dashboard at top (3 gauges) and 3 table widgets below (10 rows each).

| File | Purpose |
|---|---|
| `flexipages/Home_Chad.flexipage-meta.xml` | Adds the **Prospecting** tab to Chad's home page (tab #12). |
| `dashboards/Chad/Leads_Chad.dashboard-meta.xml` | `Leads - Chad` dashboard: 3 gauges (Calls Made 50/day, Calls Connected 10/day, Meetings Created 2/day) + 3 FlexTables (Leads / Accounts / Opps). |
| `reports/Chad_Prospecting/Calls_Made_Today_Chad.report-meta.xml` | Chad's call-subtype tasks today. Feeds the Calls Made gauge. |
| `reports/Chad_Prospecting/Calls_Connected_Today_Chad.report-meta.xml` | Chad's call tasks today with `Status = Completed` (connected proxy). |
| `reports/Chad_Prospecting/Meetings_Created_Today_Chad.report-meta.xml` | `Meeting__c` records Chad owns created today. |
| `reports/Chad_Prospecting/Prospecting_Leads_Chad.report-meta.xml` | Leads feeding the first table — not converted, not DNC / Below Minimum, sort oldest created first. |
| `reports/Chad_Prospecting/Prospecting_Accounts_Chad.report-meta.xml` | Person accounts with `command__Account_Stage__c = Prospect`. |
| `reports/Chad_Prospecting/Prospecting_Opps_Chad.report-meta.xml` | Closed Lost / Decline opps on prospect accounts — revivable dead pipeline. |
| `objects/Lead/listViews/Prospecting_Fallen_Through_Cracks.listView-meta.xml` | Standard list view (retained for direct access from object tabs). |
| `objects/Account/listViews/Prospecting_Stale_Prospects.listView-meta.xml` | Person-Account prospect list view. |
| `objects/Opportunity/listViews/Prospecting_Dead_Pipeline.listView-meta.xml` | Closed Lost / Decline on non-clients list view. |

### Leadership Production page
Org-wide daily production dashboard at `/lightning/n/Leadership_Production`.

| File | Purpose |
|---|---|
| `flexipages/Leadership_Production.flexipage-meta.xml` | AppPage FlexiPage embedding the leadership dashboard. |
| `tabs/Leadership_Production.tab-meta.xml` | Custom tab exposing the page in the App Launcher. |
| `dashboards/Leadership/Leadership_Production.dashboard-meta.xml` | 9-gauge dashboard, running user = Josh (aggregates org-wide). |
| `reports/Leadership/Leadership_Calls_Made_Today.report-meta.xml` | All org `TaskSubtype=Call` today. Goal 200. |
| `reports/Leadership/Leadership_Calls_Connected_Today.report-meta.xml` | All org completed calls today. Goal 40. |
| `reports/Leadership/Leadership_Meetings_Created_Today.report-meta.xml` | All `Meeting__c` records created today. Goal 10 (≈ "green sheets today"). |
| `reports/Leadership/Leadership_1st_Meetings_Kept_Today.report-meta.xml` | Discovery meetings kept today. Goal 5. |
| `reports/Leadership/Leadership_2nd_Meetings_Kept_Today.report-meta.xml` | Commitment meetings kept today. Goal 3. |
| `reports/Leadership/Leadership_Meetings_Held_Today.report-meta.xml` | All `Meeting Kept` / `Rescheduled - Kept` records today (superseded by 1st/2nd but retained). |
| `reports/Leadership/Leadership_Opps_Created_Today.report-meta.xml` | All opportunities created today. Goal 5. |
| `reports/Leadership/Leadership_Deals_Won_Today.report-meta.xml` | Opportunities hitting stage `Complete` today. Goal 3. |
| `reports/Leadership/Leadership_Disqualified_Today.report-meta.xml` | Leads marked `Below Minimum` today (inverted gauge — low is good). |
| `reports/Leadership/Leadership_Asset_Value_Production_YTD.report-meta.xml` | SUM(Amount) of `Complete` opps this year. Goal $100M. |

### Folders
- `reports/Chad_Prospecting.reportFolder-meta.xml` (Report folder)
- `reports/Leadership.reportFolder-meta.xml` (Report folder)
- `dashboards/Chad.dashboardFolder-meta.xml` (Dashboard folder)
- `dashboards/Leadership.dashboardFolder-meta.xml` (Dashboard folder)

## Terminology (CW sales language)

- **Green Sheet** — when a prospect raises their hand and commits to a new meeting. Maps to a new `Meeting__c` record. If someone asks for "green sheets today," build against `Meeting__c.CreatedDate = TODAY` and confirm scope.
- **Disqualified** — prospect whose assets are below CW's minimum. Maps to `Lead.Status = 'Below Minimum'`. Distinct from DNC / opt-outs.
- **1st meeting / 2nd meeting** — Discovery Meeting, Commitment Meeting. Subsequent stages: Investment, Tax, Tax Outcome.

## Known pitfalls (save the next person some time)

1. **HomePage `flexipage:filterListCard` is hard-capped at 3 rows.** `numberOfRecords` and every other row-count property is rejected by the metadata API. If a user asks for ≥10 rows on a HomePage, use a dashboard FlexTable or pivot to an AppPage with the real List View component.
2. **Activity report type's `TYPE` column maps to Event.Type, not Task.Type.** For "calls" on Task, use `TASK_SUBTYPE = 'Call'`. Task-telephony columns (`CallType`, `CallDurationInSeconds`) are **not reachable** from the Activity report type — use `STATUS = Completed` as the "connected" proxy or build a custom report type.
3. **`FinServ__Status__c` is 100% null on CW person accounts.** The populated field is `command__Account_Stage__c` (values: Client, Prospect, Inactive, Terminated, Deceased, Client (Minor)). Always use this for prospect/client segmentation.
4. **Report column tokens differ by report type.** `Opportunity` uses unprefixed (`OPPORTUNITY_NAME`, `STAGE_NAME`, `AMOUNT`, `CLOSE_DATE`, `FULL_NAME`). `AccountList` is mixed — `ACCOUNT.NAME` works but `ACCOUNT.PHONE1` / `ACCOUNT.CREATED_DATE` don't (drop the prefix). Custom Account fields take the prefix: `ACCOUNT.command__Account_Stage__c`.
5. **Meeting__c report type is `CustomEntity$Meeting__c@Meeting__c.Account__c`.** Standard tokens are `CUST_OWNER_NAME`, `CUST_CREATED_DATE`. Meeting-specific custom fields keep the prefix: `Meeting__c.Meeting_Date__c`, `Meeting__c.Status__c`.
6. **`LAST_N_DAYS:90` is rejected inside `criteriaItems`.** Use `timeFrameFilter` for relative windows.
7. **Production Apex tests:** three pre-existing tests fail in `cw` (`MeetingsTodayController_Test.testMeetingsTodayQuery`, `ReminderWorkshopEmailBatchTest.testSchedulable`, `dlrs_OpportunityTest.testTrigger`). Blocks `deploy validate`; does not block `deploy start` for metadata-only changes.

## Terminology map (CW → SF fields)

| Business term | SF field | Today's TODAY filter |
|---|---|---|
| Calls made | `Task.TaskSubtype = 'Call'` | `ActivityDate = TODAY` |
| Calls connected | same + `Task.Status = 'Completed'` | `ActivityDate = TODAY` |
| Meetings created / green sheets | `Meeting__c` any | `CreatedDate = TODAY` |
| 1st meeting kept (Discovery) | `Meeting__c.Meeting_Type__c = 'Discovery Meeting'` + status in `Meeting Kept` / `Rescheduled - Kept` | `Meeting_Date__c = TODAY` |
| 2nd meeting kept (Commitment) | `Meeting__c.Meeting_Type__c = 'Commitment Meeting'` + same status filter | `Meeting_Date__c = TODAY` |
| Opps created | `Opportunity` any record type | `CreatedDate = TODAY` |
| Deals won | `Opportunity.StageName = 'Complete'` | `CloseDate = TODAY` |
| Disqualified | `Lead.Status = 'Below Minimum'` | `CreatedDate = TODAY` |
| Asset value production | SUM(`Opportunity.Amount`) where `StageName = 'Complete'` | `CloseDate THIS_YEAR` |

## Related memory / external refs

- Auto-memory: `project_cw_prospecting_leadership_sf_build.md`, `project_cw_sales_terminology.md`
- Dashboard folder `Chad` (existing) houses Chad-scoped dashboards: `Lead Advisor Stages (Chad)`, `Daily To-Dos (Chad)`, etc.
- Lightning App Page URL: https://capitalwealth.lightning.force.com/lightning/n/Leadership_Production
