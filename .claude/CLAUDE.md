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

### 2026-05-11 — Phone number validation, site-wide

- **What shipped** (branch `claude/laughing-carson-c4a0c2`, not yet committed): one shared `window.CWPhone` helper in [src/assets/js/main.js](src/assets/js/main.js) (normalize/isValid/format) plus a capture-phase form-submit guard. The four event landing pages (webinar + SLC/Ogden/Hill AFB workshops) had their duplicated inline phone formatters removed and their validators switched to `CWPhone.isValid`. Server-side mirror added to [api/submit-lead.js](api/submit-lead.js) (`normalizePhone` + `isValidPhone` near `sfEscape`).
- **Policy change:** phone numbers are now stored as 10-digit digit-only strings (e.g. `8012102800`). The leading `1` country code is stripped on input. Numbers are rejected if the area code or exchange starts with `0` or `1`, if all digits are the same, if they're an obvious sequence (`1234567890` etc.), or if they fall in the `555-01XX` fictional block. The screenshot case `(141) 239-8060` is the canonical reject example.
- **Side benefit:** `tel:${leadData.phone}` links in admin notification emails now render as `tel:8012102800` and actually dial — previously they were `tel:(801) 210-2800` which most mail clients silently dropped.
- **Pending:** branch is not yet pushed. Verify locally with `npm run dev`, push to `main` (or open PR) to deploy. The webinar form is the easiest smoke test: try typing `1412398060` → should reject, `1 801 210 2800` → should display `(801) 210-2800` and submit cleanly.
- **Out of scope (next time):** historical Supabase / Salesforce records still have parens/dashes in the Phone field. No backfill done — new submissions are clean, old ones stay as-is. If we ever need uniform phones across the dataset, write a one-shot migration.
- **Plan file:** `~/.claude/plans/we-need-to-update-logical-karp.md`.
