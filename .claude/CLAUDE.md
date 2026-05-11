# Capital Wealth — Project Context

## About
Capital Wealth is a registered investment advisor in Utah doing $100M/year in revenue. We serve federal employees, retirees, and high-net-worth individuals with retirement planning, tax strategy, and wealth management.

## Brand
- **Colors:** Navy (#0f2742), Gold (#fdd25e), White, Light Gray (#f8fafc)
- **Fonts:** Arial/Helvetica (email), Proxima Nova (web)
- **Tone:** Professional but approachable. Direct, not salesy. Educational, not pushy. We talk like real people, not robots.
- **Logo:** White horizontal at `assets/images/logos/logo-horizontal-white.png`
- **Address:** 1850 W Ashton Blvd Suite 175, Lehi, UT 84043
- **Phone:** 801.210.2800
- **VIP Email:** vip@capitalwealth.com

## Compliance (MUST follow)
- Every client-facing email and page MUST include: "Advisory services offered through Capital Wealth, LLC, a State of Utah Registered Investment Advisor. Insurance services offered through CWA Insurance Services, LLC."
- Federal content MUST include: "Capital Wealth is not affiliated with or endorsed by the U.S. Government, Social Security Administration, Office of Personnel Management, or any federal agency."
- Never guarantee returns. Never promise specific outcomes. Use "may", "can", "designed to help" language.
- All emails must have an unsubscribe link and physical mailing address.

## Tech Stack
- **Site:** Eleventy (11ty) static site, deployed to Vercel via GitHub push to main
- **CRM:** Salesforce (org alias: `cw`, authenticated as jcohen@capitalwealth.com)
- **Task Management:** Asana (workspace: capitalwealth.com)
- **Communication:** Zoom (no Slack — never suggest Slack)
- **Email:** Microsoft 365 (not yet authenticated for CLI)
- **Marketing Automation:** Salesforce Apex batch jobs for email campaigns
- **Images:** Hosted at capitalwealth.com/assets/images/brand/

## Team
- Mike Stevens — CEO / Lead Advisor
- Josh Cohen — Director of Marketing
- Chad Austin — Lead Advisor (handles lead confirmation calls)
- Brent Thompson — Relationship Advisor
- Sam Rios-Lazo — Wealth Associate
- Lateesha Stevens — Operations Manager
- Kayden Hicken — Operations / Admin
- Teresa Phillips — Admin / Client Services
- Bryce Morgan — Admin / Marketing Support
- Ann Werts — Federal benefits expert (external, 25+ years)

## Salesforce Fields to Know
- **Lead Source:** Where the lead came from (Website Form, WFR April 2026, Federal Workshop, etc.)
- **Attendance:** Booked → Confirmed → Attended → Followed Up After
- **Email Opens:** Auto-tracked count of email opens
- **Conversations:** Auto-calculated count of two-way interactions (answered calls, email replies, text replies)
- **Activity Disposition:** REQUIRED on all calls/texts. Pick from: Answered, Left Voicemail, No Answer, Busy, Wrong Number, Disconnected, Scheduled Appointment, Confirmed Attendance, Not Interested, Requested Callback, Text Sent, Text Reply Received, Email Sent, Email Reply Received

## Email Template Standards
- Max width: 680px
- Force light mode: `<meta name="color-scheme" content="light only">`
- Use `<meta charset="UTF-8">` in head
- All special characters as HTML entities (no raw unicode dashes/quotes)
- CTA buttons: #fdd25e background, #0f2742 text, uppercase, bold
- Footer must include: compliance disclaimer, physical address, unsubscribe link
- Images hosted on capitalwealth.com (never Google Drive)
- Send from vip@capitalwealth.com via Salesforce OrgWideEmailAddress

## Git Workflow
- Push to `main` triggers Vercel deploy automatically
- Create feature branches for large changes, PR for review
- Small fixes can go direct to main
- Commit messages: short, descriptive, no emoji

## Session Log

### 2026-05-11 — utahfed.com / idahofed.com billboard hub → federal-workshops chooser page

- **What shipped (this PR on branch `claude/flamboyant-ishizaka-55885b`):** New hub landing page at [src/l/federal-workshops/index.njk](../src/l/federal-workshops/index.njk) that lists the three May 2026 federal workshops as clickable cards (Ogden 5/19, SLC 5/20, Hill AFB 5/21). Each card CTA points to its existing per-workshop landing page with `?lead_source=Billboard` appended. The three existing workshop pages ([src/l/federal-benefits-workshop-{ogden,slc,hill-afb}/index.njk](../src/l/)) gained a `<input type="hidden" name="lead_source" id="lead_source">` near line 944 and the inline submit handler's query-param copier now includes `'lead_source'` alongside the UTM keys, so the value flows through to `/api/submit-lead`. [api/submit-lead.js:146](../api/submit-lead.js:146) `ALLOWED_LEAD_SOURCES` set now includes `'Billboard'`. [vercel.json:24](../vercel.json) gained four host-based redirects (utahfed.com, www.utahfed.com, idahofed.com, www.idahofed.com → `https://www.capitalwealth.com/l/federal-workshops/?lead_source=Billboard`) modeled on the existing `retireutah.com` pattern.
- **Why the redirect carries `?lead_source=Billboard` itself:** Defense-in-depth. If a billboard visitor lands on the hub and shares the link with a friend, that friend's session may not have the query string when they click a workshop card — but the hub→workshop link bakes `?lead_source=Billboard` into the href, so attribution still survives the second hop.
- **Salesforce picklist note:** `Lead.LeadSource` is **not a restricted picklist** (`restrictedPicklist: false` per the SObject describe), so SF will happily accept `"Billboard"` even though it's not currently in the picklist values — leads will save fine the moment code deploys. **However**, until Josh adds `Billboard` to the picklist via SF Setup → Lead → Fields → LeadSource, it won't appear as a filter option in reports/dashboards. This is a 30-second admin task; not a blocker for shipping.
- **DNS / Vercel domains dependency (NOT a code task):** The four redirect rules only fire once `utahfed.com`, `www.utahfed.com`, `idahofed.com`, `www.idahofed.com` are attached to the Vercel project (Settings → Domains) AND DNS at the registrar points to Vercel (typically A record `76.76.21.21` for apex, CNAME `cname.vercel-dns.com` for www). Confirm with whoever holds the registrar logins for these two domains before announcing the billboards. Until then, the hub page at `/l/federal-workshops/` still works on capitalwealth.com directly.
- **Verification after merge → main → Vercel deploy:** (1) Visit `https://www.capitalwealth.com/l/federal-workshops/` — three cards render in date order, navy/gold + federal palette, compliance footer present. (2) Click any card → URL on destination should contain `?lead_source=Billboard`; complete the form with a test address like `brycedmorgan+billboard-test@gmail.com`; then `sf data query -o cw -q "SELECT Id, Email, LeadSource FROM Lead WHERE Email='brycedmorgan+billboard-test@gmail.com' ORDER BY CreatedDate DESC LIMIT 1"` — expect `LeadSource = 'Billboard'`. (3) Negative case: submit a fresh lead from a workshop page **without** the query string — `LeadSource` should fall back to `'Website Form'`. (4) Once DNS is live: `curl -sI https://utahfed.com/` and `curl -sI https://idahofed.com/` should both 308 to the hub URL with the query string.
- **What to pick up next:** (1) Open the PR for this branch and ship. (2) Confirm the DNS / Vercel domain attachment for both apex domains. (3) Have Josh add `Billboard` to the SF Lead.LeadSource picklist so it shows up cleanly in report filters. (4) (Carried forward) Send the 48 SendGrid backfill emails (script staged at `/tmp/send_backfill.py`). (5) (Carried forward) Rotate Zoom + Facebook secrets that were sent in plaintext during the previous session.

---

### 2026-05-11 — Federal Webinar registration pipeline: env fix, SF patch, 48-lead backfill, broken phone validation hotfix

- **Root cause of "Zoom Events count looks wrong" concern:** The Zoom Events count (161/165) was actually correct — the Webinar+ migration ported registrations cleanly. The real issue was that the website form's Zoom integration ([api/submit-lead.js](../api/submit-lead.js)) had been silently no-op'ing since it shipped May 5: all four `ZOOM_*` env vars in Vercel production were empty strings. Every website-form submission since May 5 created an SF Lead but no Zoom registrant.
- **Env vars set in Vercel production:** `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBINAR_ID=82502463485` (underlying webinar inside the migrated Zoom Events session — same numeric ID still works with legacy `/v2/webinars/{id}/registrants` API). Plus `FB_ACCESS_TOKEN` + `FB_AD_ACCOUNT_ID=956377226671159` for Facebook Ads spend pulls via [api/facebook-ads.js](../api/facebook-ads.js). Preview left empty intentionally.
- **Two real bugs patched in [PR #21](https://github.com/Gull-Stack/capital-wealth/pull/21):** (1) SF Lead update path was 400-ing because a validation rule now requires `How_did_you_hear_about_us__c` on update — patched to backfill `'Website'` when blank. (2) TY page `.ty-action-btn` CSS overrode the `[hidden]` HTML attribute, so the "Save Zoom Join Link" button rendered with `href="#"` even when no join URL was available — patched with `[hidden] !important` reset.
- **Urgent hotfix [PR #22](https://github.com/Gull-Stack/capital-wealth/pull/22) — phone validation broken site-wide:** [PR #20](https://github.com/Gull-Stack/capital-wealth/pull/20) moved phone validation into the shared `window.CWPhone` helper in [src/assets/js/main.js](../src/assets/js/main.js) but `base-finpay.njk` (the federal landing page layout) never loaded `main.js`. Result: `window.CWPhone` was `undefined`, every form submission rejected with "Please enter a valid US phone number." Fix: add `<script src="/assets/js/main.js">` before `</body>` in [src/_includes/layouts/base-finpay.njk](../src/_includes/layouts/base-finpay.njk).
- **Backfill completed:** 48 affected website-form leads (May 5–11 window) registered with Zoom via single-registrant API. Each SF Lead Description appended with `Zoom Registrant ID` + `Zoom Join URL`. Confirmation emails suppressed via webinar setting (`registrants_confirmation_email: false`) — Zoom Events' built-in reminder system will deliver join links pre-event. SendGrid follow-up email TO THE 48 still pending user OK.
- **All 253 webinar leads (LeadSource='Webinar' since May 5) marked `Are_You_Federal__c = 'Yes'`** via SF bulk update. Per Josh: "These are all federal leads."
- **SF Campaign work:** Added 203 missing Leads as CampaignMembers to `701VS00000eWrYVYA0` (Federal Benefits Workshop 5.14.26) — Campaign now has all 253. Created Salesforce Report **`Federal Webinar 5.14.26 — Members & $`** (Id `00OVS000008BqDB2A0`) showing registrants + Actual Cost. Set `Campaign.ActualCost = $5,153.37` from FB campaign `CW — Federal Webinar — May 14 — Leads` (id `120241615030540665`).
- **What to pick up next:** (1) Send the 48 SendGrid backfill emails (script staged at `/tmp/send_backfill.py` — needs user "send" confirmation). (2) Delete 3 synthetic Zoom registrants left from diagnosis: `claude-diag-probe-*@example.com`, `claude-probe2-*@example.com`, `brycedmorgan+webprobe1778514614@gmail.com` — easiest in the Zoom Events admin UI under registrant list. (3) **Rotate the Zoom Server-to-Server OAuth client secret** since it was sent in plaintext chat. (4) Rotate the Facebook system-user access token (also sent in plaintext). (5) Optionally wire a Vercel cron to refresh Campaign.ActualCost daily from Facebook spend.
- **Reference:** Zoom webinar host email is `bmorgan@capitalwealth.com` — Bryce can't self-test the registration form with his own email (Zoom rejects host as registrant). Webinar's `registrants_confirmation_email` is OFF — Zoom doesn't email registrants automatically; rely on Zoom Events reminders or our own SendGrid.
