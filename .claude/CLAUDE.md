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

### 2026-05-11 — Federal Webinar registration pipeline: env fix, SF patch, 48-lead backfill

- **Root cause of "Zoom Events count looks wrong" concern:** The Zoom Events count (161/165) was actually correct — the Webinar+ migration ported registrations cleanly. The real issue was that the website form's Zoom integration ([api/submit-lead.js](../api/submit-lead.js)) had been silently no-op'ing since it shipped May 5: all four `ZOOM_*` env vars in Vercel production were empty strings. Every website-form submission since May 5 created an SF Lead but no Zoom registrant.
- **Env vars set in Vercel production:** `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBINAR_ID=82502463485` (underlying webinar inside the migrated Zoom Events session — same numeric ID still works with legacy `/v2/webinars/{id}/registrants` API). Preview left empty intentionally. Production redeployed `dpl_65Yc9eoiN66Ma8z49NRcm2hxwMY2`.
- **Two real bugs discovered + patched in [PR #21](https://github.com/Gull-Stack/capital-wealth/pull/21):** (1) SF Lead update path was 400-ing because a validation rule now requires `How_did_you_hear_about_us__c` on update — patched to backfill `'Website'` when blank. (2) TY page `.ty-action-btn` CSS overrode the `[hidden]` HTML attribute, so the "Save Zoom Join Link" button rendered with `href="#"` even when no join URL was available — patched with `[hidden] !important` reset.
- **Backfill completed:** 48 affected website-form leads (May 5–11 window) registered with Zoom via single-registrant API. Each SF Lead Description appended with `Zoom Registrant ID` + `Zoom Join URL`. Confirmation emails suppressed via webinar setting (`registrants_confirmation_email: false`) — Zoom Events' built-in reminder system will deliver join links pre-event.
- **All 253 webinar leads (LeadSource='Webinar' since May 5) marked `Are_You_Federal__c = 'Yes'`** via SF bulk update. Per Josh: "These are all federal leads."
- **What to pick up next:** (1) Merge [PR #21](https://github.com/Gull-Stack/capital-wealth/pull/21) so the SF + TY page patches go live. (2) Delete 3 synthetic Zoom registrants left from diagnosis: `claude-diag-probe-*@example.com`, `claude-probe2-*@example.com`, `brycedmorgan+webprobe1778514614@gmail.com` — easiest in the Zoom Events admin UI under registrant list, or add `webinar:delete:registrant:admin` scope to the OAuth app and run a delete script. (3) **Rotate the Zoom Server-to-Server OAuth client secret** since it was sent in plaintext chat during this session.
- **Reference:** Zoom webinar host email is `bmorgan@capitalwealth.com` — Bryce can't self-test the registration form with his own email (Zoom rejects host as registrant).
