# Capital Wealth — Board One-Pager

**As of:** 2026-04-19 · Data pulled live from Salesforce prod · All figures SOQL-verified

---

## The 60-Second Story

> Through Q1 2026 we have closed **$11.7M of our $18M revenue goal (65%)** — down 16% YoY from $13.9M in the same window last year. Pipeline is healthy at **$62.9M open (10× coverage on the remaining $6.3M gap)**, but **$21.3M of it has been stale for 30+ days**. Retention is above target at **100% vs. 97%**. The Federal Seminar engine produced **37 accounts but only 1 opportunity (2.70% vs. 15% target)** — this single conversion step is the largest unlocked lever in the firm.
>
> **One ask:** Approve the 14-day follow-up cadence pilot on the 37 Federal accounts. Projected upside: $3.4M net-new pipeline in Q2.

---

## The 4 Key Results (live, auto-refreshed daily at 6 AM UTC)

| KR | Current | Target | Progress | Status |
|---|---|---|---|---|
| KR1 — 2026 Revenue | **$11.7M** | $18M | 65% | 🟡 At Risk |
| KR2 — Net New Assets (Bridge) | **$11.7M** | $25M | 47% | 🔴 Off Track |
| KR3 — Client Retention | **100%** | 97% | 103% | 🟢 On Track |
| KR4 — Federal Lead→Opp Conversion | **2.70%** | 15% | 18% | 🔴 Off Track |

*KR2 uses Won YTD as proxy until May AUM snapshot runs — at that point the bridge goes live as `(Current AUM − Apr Baseline) + Won Inflows`.*

---

## The Diagnostic Row — Why we are where we are

| Metric | Value | Board Reads |
|---|---|---|
| 2025 YTD same window | $13.9M / 77 deals | We are pacing **−16% vs. 2025** |
| Avg Days to Close (Won) | 20 days | Velocity is strong when we commit |
| Stale Pipeline (>30d no activity) | **$21.3M / 56 deals** | 34% of open pipe is at risk |
| Trailing-12-month Churn | 2 accounts | Retention is not the problem |

---

## Revenue Concentration

- **Mike Stevens** — $6.07M (52% of YTD revenue) — concentration risk
- **Chad Austin** — $3.27M (28%)
- **Brent Thompson** — $2.37M (20%)

Mike driving over half the firm's revenue is the single biggest people-risk on the dashboard.

---

## Federal Seminar Engine — Where It's Stuck

**37 federal accounts created, sorted by funnel stage:**

| Stage | Accounts | % |
|---|---|---|
| Prospect (cold) | 24 | 65% |
| (1.5) Initial Case Design | 8 | 22% |
| (1) Discovery Meeting | 4 | 11% |
| (2) Commitment Meeting | 1 | 3% |

**24 of 37 federal accounts still sit in Prospect.** That is the unlocked $3.4M.

---

## The Event That Just Happened — Weber State Federal Seminar (April 9, 2026)

| Signal | Value |
|---|---|
| Signups (CampaignMembers) | 30 |
| Responded / attended | 13 |
| Converted to Account | 1 (Christopher Lemay) |
| Opportunities created | 0 |
| Lead status: Nurturing | 15 |
| Lead status: Call 1/2 | 2 |
| Lead status: Converted | 9 |
| Lead status: Do Not Contact | 2 |
| **Activity recorded in 15 days** | **270 records** — 103 calls · 84 emails · 83 follow-up tasks |
| Leads with activity in last 5 days | 26 of 28 tracked |

**Read:** The leads are being worked — elite activity volume by Chad Austin. The conversion step from Account to Opportunity is where the leak is, not in the follow-up.

---

## Single Decision Requested

**Approve the 14-day follow-up cadence pilot for the 24 Prospect-stage Federal Seminar accounts.**

- Scope: 24 accounts
- Owner: Chad Austin (pilot) → scaled across advisors if successful
- Success metric: Move ≥4 accounts to Discovery Meeting stage within 30 days
- Projected pipeline unlock: ~$3.4M

---

## Where The Board Can Verify Each Number

| Claim | Dashboard | Component |
|---|---|---|
| $11.7M revenue | Executive Snapshot | KR1 gauge |
| −16% YoY | Executive Snapshot | YoY Reference tile |
| $21.3M stale pipe | Executive Snapshot | STALE Pipeline tile |
| 20-day velocity | Executive Snapshot | Velocity tile |
| 2 T12M churn | Executive Snapshot | Churn T12M tile |
| Mike 52% revenue | Executive Snapshot | Won by Advisor × Type bar |
| 37 Federal, 1 Opp | Event Success Scorecard | Federal Accounts Funnel bar |
| 270 activities on Weber leads | Event Success Scorecard | Weber State per-lead detail table |
| All event performance | Event Success Scorecard | Recent Events Scorecard table |

---

## System Readiness (verified today via Analytics REST API)

- **84/84 dashboard components rendering, 0 errors**
- **98 reports, all returning live data**
- **Apex `RefreshOKRProgress` scheduled daily 6 AM UTC** — next fire 2026-04-20
- **Lightning App:** CW Board Command Center (App Launcher)
- **6 dashboards:** Executive Snapshot (primary), OKR Command, One-Pager, Buyer Journey, Segment Deep Dive, Pipeline Detail, Event Success Scorecard

Data integrity enforced by validation rule requiring Terminated_Date on any account marked Inactive. NNA bridge infrastructure ready (259 April accounts snapshotted, $86.4M baseline captured).

---

## Dashboard URLs for the Board Packet

- Executive Snapshot (primary): https://capitalwealth.my.salesforce.com/lightning/r/Dashboard/01ZVS000002lCJ72AM/view
- Event Success Scorecard: https://capitalwealth.my.salesforce.com/lightning/r/Dashboard/01ZVS000002lFTt2AM/view
- OKR Command Center: https://capitalwealth.my.salesforce.com/lightning/r/Dashboard/01ZVS000002l93V2AQ/view

---

*Prepared for Capital Wealth Board of Directors · Head of Marketing, Josh Cohen*
