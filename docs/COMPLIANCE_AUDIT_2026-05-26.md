# Capital Wealth — Website Compliance Audit

**Date:** 2026-05-26
**Reviewed against:** SEC Marketing Rule (Investment Advisers Act, 17 CFR 275.206(4)-1), Utah/NASAA RIA advertising rules, and NAIC insurance-advertising/suitability model regs (#570 life & annuity advertising, #275 annuity best-interest, #30 A&S advertising).
**Method:** Every source file under `src/` (all top-level pages, 13 service pages, 12 landing pages, federal pages, 72 blog posts, 2 email templates, the 53-slide `/workshop/` deck, shared layouts/includes) reviewed against the rubric in `.claude/skills/compliance-reviewer/`. Audit covers SOURCE (`src/`); the generated `_site/` mirrors it and is fixed on rebuild.
**Posture:** Conservative — flag anything a securities OR insurance regulator could call misleading, unbalanced, unsubstantiated, a guarantee, or an implied government/SEC endorsement.

> This is a findings report for review. **No site files were changed.** Fixes are recommended below; nothing is edited until approved.

---

## TL;DR — what matters most

The site has **systemic** compliance gaps, but they cluster into a handful of root causes. Fixing the shared templates + running a few targeted sweeps resolves the large majority. In priority order:

1. **DECISION NEEDED (cannot be auto-fixed): SEC vs. State-of-Utah registration.** The live footer says **"SEC Registered Investment Advisor."** The project compliance policy says **"State of Utah Registered Investment Advisor."** These are mutually exclusive (driven by the ~$100M AUM line). The site also mixes the entity names **"Capital Wealth, LLC"** and **"Capital Wealth Advisors, LLC."** Confirm the true status from Form ADV with the compliance attorney, then state it **identically** everywhere. → Theme A.
2. **"Fee-only / no commissions / no products" false claims still on the site.** PR #44 (May 19) was supposed to remove these but missed the disclosures page, several guides, geo pages, the `/start` and `/about` pages, multiple homepage variants, an email, and dozens of blog posts. The firm is **fee-based** (insurance commissions via CWA Insurance Services, LLC). → Theme B.
3. **Required disclosures missing at the template level** — the shared footers omit the CWA Insurance line and (on the standard footer) the registration + risk language; federal pages and ~65 of 72 blog posts lack the federal non-affiliation disclaimer. Fix the shared includes + one blog-layout footer and most of this clears at once. → Theme C.
4. **"Official Government Registered Contractor" + U.S. flag** on federal pages reads as government endorsement — the exact thing the firm's own disclaimer denies. → Theme D.
5. **Guarantees, "never lose," "0% floor," and specific dollar/return outcomes** across annuity content, the homepage, calculators, and most blog posts. → Themes E & F.

**Highest-leverage edits (fix once, clears many pages):**
- `src/_includes/components/footer.njk` and `footer-mm.njk` (registration text, CWA Insurance line, risk language) — sitewide.
- The federal-page footer block in `base-finpay.njk` + footers (add federal disclaimer; neutralize the "Official Government Contractor" banner) — all federal pages.
- The blog layout (`src/_includes/layouts/blog-post.njk`) — add the standard disclaimer footer so all 72 posts inherit it.
- A repo-wide sweep for the forbidden firm-claims ("fee-only", "no commissions", "no product").

---

## Severity counts (deduplicated themes)

| Severity | Theme |
|---|---|
| **Critical** | A registration, B false fee/commission claims, C missing required disclosures, D government-endorsement signaling, E unqualified guarantees/annuity, F specific dollar/performance claims |
| **High** | G undisclosed testimonials/ratings, H unqualified "tax-free", + several items within A–F |
| **Medium** | I disparagement of competitors/products, unlabeled hypothetical case studies, soft promissory language |
| **Low** | J factual inconsistencies (founding year, client count, phone, tax rate), K indexable internal pages / `.backup` files / fake-scarcity counters |

---

## A. Registration status & entity identity — CRITICAL (needs human decision)

Do **not** auto-resolve — confirm against Form ADV with compliance, then make identical everywhere.

- `src/_includes/components/footer-mm.njk:111` — "SEC Registered Investment Advisor"
- `src/_includes/components/footer-mm.njk:114` — "Capital Wealth **Advisors**, LLC is a Registered Investment Advisor registered with the U.S. Securities and Exchange Commission."
- `src/guides/fiduciary-vs-commission-advisor/index.md:~366` — "SEC-Registered Investment Advisor" / "SEC registration and oversight"
- Entity-name mismatch: "Capital Wealth, LLC" (policy, disclosures) vs "Capital Wealth Advisors, LLC" (mm footer, legal line).
- Required policy text (per compliance standard): *"Advisory services offered through Capital Wealth, LLC, a State of Utah Registered Investment Advisor. Insurance services offered through CWA Insurance Services, LLC."*
- **Action:** Compliance confirms SEC vs Utah and the correct legal entity name; then a sitewide find/replace to one consistent statement + the "registration does not imply skill or training" line wherever registration is mentioned.

## B. "Fee-only / no commissions / no products" false claims — CRITICAL

The firm is **fee-based** (earns advisory fees AND insurance commissions via CWA Insurance Services, LLC). These all imply otherwise. PR #44 missed them:

- `src/disclosures/index.njk:25` — "We do not receive commissions from the sale of financial products." *(directly contradicts the fee-based correction)*
- `src/guides/fiduciary-vs-commission-advisor/index.md:270-290` — "**Fee-Only Structure**", "No proprietary products or hidden fees", "No sales quotas or product pressures"
- `src/financial-advisor-utah/index.njk:10,16,479,524-525` — "We don't earn commissions on product sales" (incl. FAQ **schema** → shows in Google rich results), "No commission conflicts" card
- `src/retirement-planning/index.njk:16,1147` & `src/retirement-planning-lehi-utah/index.njk:14` — "we don't earn commissions on product sales" / "no commission conflicts"
- `src/about/index.njk:62` — "No product pushing."
- `src/start/index.njk:389` — "No products, no pitch" *(the `/start` "No Sales Pitch" card at :435 was already fixed; this line was missed)*
- `src/index-finpay.njk`, `src/index-original.njk`, `src/index-finpay-complete.njk` — live (noindex) homepage variants repeating "we don't earn hidden commissions" / "your interests always come first". **Likely dead duplicates — recommend deleting** (they still build to public URLs).
- `emails/fers-webinar-recap-2026-05.html:234` — "No products, no pitch"
- Blog (recurring): `three-pillars-financial-stability-jun-14-2025.md:403` ("No product sales"), `active-vs-passive-investing-may-25-2025.md:653-654`, `four-retirement-unknowns-aug-23-2025.md:596,247,608`, `fers-pension-explained/index.njk:444`, plus many "no sales pitch / not a sales presentation / focus on people not products" instances across the radio-recap posts.
- `src/services/portfolio-management/index.njk.backup:17,313` — stale `.backup` artifact with "no commissions" (delete `.backup` files from `src/`).
- **Approved replacement:** "We are a fee-based fiduciary. Any insurance recommendation is offered through our affiliate CWA Insurance Services, LLC, and any commission is separately disclosed in writing."

## C. Missing required disclosures — CRITICAL / HIGH (mostly template-level)

**Sitewide template gaps:**
- `src/_includes/components/footer.njk:91-93` — standard footer (renders on all `base-finpay` pages: every service page, about, faq, start, reviews, case-studies, book, who-we-serve, guides, tools, geo pages) has **no** RIA registration statement, no CWA Insurance line, no risk/past-performance language.
- `src/_includes/components/footer-mm.njk:114` — homepage footer omits the CWA Insurance Services line.
- **Fix once:** add the full advisory+insurance disclaimer (Theme A text) + "All investments involve risk, including loss of principal. Past performance is not a guarantee of future results." to both footers.

**Federal non-affiliation disclaimer missing** (required: *"Capital Wealth is not affiliated with or endorsed by the U.S. Government, the Social Security Administration, the Office of Personnel Management, the Thrift Savings Plan, or any federal agency."*):
- All `src/services/federal-benefits/*` pages (`grep` returns 0 hits for "not affiliated").
- `src/l/federal/index.njk` — **zero disclaimers of any kind** (footer is just "© 2025 Capital Wealth").
- `src/fers-retirement-planning-utah/`, `src/fers-retirement-planning-idaho/`, `src/federal-resources/`, `src/federal-workshop-april-9/` (the SF-182 / "official time" framing makes the gap acute), `src/l/retire-utah/`, `src/l/retire-idaho/`, and the many `/ty/` thank-you pages.
- Variant disclaimer on `src/l/federal-review/index.njk:826`, `src/l/federal-checklist/index.njk:835`, `src/_data/landing_pages/10-things.json:200` **omits SSA and TSP** — use full wording.
- Blog federal posts with no federal disclaimer: `fers-high-3-salary-apr-24-2026.md`, `fers-multiplier-1-1-apr-24-2026.md`, `fers-pension-calculation-guide-apr-24-2026.md`, `mike-stevens-faq-sept-18-2024.md`, `mike-stevens-full-blog-sept-14-2024.md`, `mike-stevens-key-takeaways-sept-16-2024.md`, `retirement-tightrope-mar-28-2026.md`.

**Blog disclosures (systemic):** ~65 of 72 posts carry **no** advisory / risk / tax-legal disclaimer. The compliant model is `src/blog/new-retirement-reality-apr-25-2026.md` (full footer). **Fix:** add the standard disclaimer block to the blog layout (`src/_includes/layouts/blog-post.njk`) so every post inherits it.

**Workshop deck:** `src/workshop/index.html` — 53 slides, closes with a "book a call" CTA (so it IS an advertisement), with **no** federal/advisory/CWA/risk disclaimer anywhere. Add a disclosure slide or persistent footer.

**Email:** `emails/fers-webinar-recap-2026-05.html:293` uses a `mailto:` unsubscribe rather than a functional one-click list-unsubscribe (the invite email does this correctly).

## D. Government-endorsement signaling — CRITICAL

"**An Official Government Registered Contractor**" + waving U.S. flag + CAGE/UEI, presented to a federal-employee audience, implies government sanction/endorsement and undercuts the firm's own non-affiliation disclaimer. (SAM.gov registration is factually true but must be stated neutrally and not as a credential.)
- `src/_includes/components/footer.njk:84-88`, `src/_includes/components/footer-mm.njk:85`, `src/_includes/layouts/base-finpay.njk:~597`
- `src/l/federal-benefits-webinar/index.njk:850-858`, `src/l/federal-benefits-workshop-ogden/index.njk:859`, `…-slc:859`, `…-hill-afb:859`, `src/l/federal-workshops/index.njk:262`
- `src/l/federal-review/index.njk:731` (UEI as a "credential" badge), `src/l/federal-checklist/index.njk:835`, `src/_data/landing_pages/10-things.json:24`, `src/tools/calculator.njk:562`, `src/tools/calculator-ty.njk:224`
- **Fix:** remove "Official" + the flag adjacency; if the UEI must appear, state it neutrally ("Registered in SAM.gov · UEI L63FVVWAKXA8 — a vendor registration that does not indicate any government endorsement") and keep it separate from credentials.

## E. Unqualified guarantees & annuity claims — CRITICAL

Guarantees must rest on the **issuing insurer's claims-paying ability**, disclose limitations (surrender charges, fees), and identify the product as insurance (via CWA Insurance Services, LLC). Recurring violations:
- `src/services/annuities/index.njk:922` — hero "Guaranteed Income for Life." (body is otherwise well-balanced; hero needs the carrier disclosure).
- `src/services/federal-benefits/tsp-planning/index.njk:952,1021` — "Risk-free", "guaranteed returns" (G Fund).
- `src/l/federal/index.njk:1110` — private life policy "premiums that never increase" + FEGLI disparagement, no carrier/conflict disclosure.
- `src/retirement-income-planning/index.njk:13,18,1050,1143` — "guaranteed income floor" with no annuity disclosure.
- `src/workshop/index.html:1763` — "Lifetime annuity — Guaranteed income stream."
- **Blog (pervasive):** "0% floor / never lose money / guaranteed principal protection / zero market risk / can't lose a penny" in `four-retirement-unknowns-*`, `dependable-retirement-income-apr-12-2025.md`, `make-money-work-*`, `make-your-money-work-*` (`jan-3-2026:47` "Guaranteed monthly cash flow that lasts to age 100"), `protected-income-feb-8-2025.md:186`, `new-retirement-reality-nov-1-2025.md:221`, `maximize-retirement-income-jul-5-2025.md:151` ("70% of income now guaranteed regardless of market performance"), `twin-threats-taxes-inflation-feb-1-2025.md`, and others.
- **IUL — particularly aggressive:** `preserving-retirement-from-taxes-apr-26-2025.md:201` — "tax-free loan … 0% loan provision … doesn't cost you one cent in tax" and "tax-free growth/legacy". IUL loans accrue, reduce the death benefit, and can lapse the policy (triggering tax). Needs full carrier/limitation disclosure or removal. Also `planning-large-iras-aug-2-2025.md:48,161` ("unlimited contributions, no caps, tax-free generational wealth").
- **Model footer to replicate:** `src/blog/new-retirement-reality-apr-25-2026.md:325`.

## F. Specific dollar / performance-outcome claims — CRITICAL / HIGH

Quantified returns, projected dollar savings, and outperformance figures on public marketing pages are textbook Marketing-Rule problems (substantiation + fair-and-balanced + hypothetical-performance rules).
- `src/index.njk:1363-1372` — "~1% median annual return uplift", "$312K median lifetime tax reduction"; plan mockup `:1142` "Projected lifetime tax reduction $312,000".
- `src/l/federal/index.njk:1088` — "can cost the average federal employee over $240,000 in lifetime income."
- `src/l/sdba/index.njk:1316,1900,1984` — calculator projects "+1% advised" managed outperformance the firm "routinely targets."
- `src/_data/calculator_tools.json:36-38,81-83,126-128` — buyback/sick-leave/multiplier dollar projections ("$18,750", "pays for itself in year one", "$56,250") rendered on the public tool stubs.
- `src/blog/social-security-privatization-sep-13-2025.md:45` — "managed accounts historically outperform by 1.5-3% annually."
- **Pervasive:** nearly every blog post has named "case studies" with specific dollar savings ($34K, $89K, $240K, $750K, $800K…), success-probability jumps ("67%→94%"), and stats ("300%", "2.9% annually") presented as results, **unlabeled as hypothetical**. Add the §8 illustrative disclaimer or strip the figures.

## G. Testimonials, reviews & ratings — HIGH

Testimonials/endorsements require clear & prominent disclosure of client status, (non-)compensation, and conflicts; third-party ratings require date/source/compensation disclosure. The correct model exists at `src/reviews/index.njk:43`.
- `src/index.njk:1384-1417` — homepage testimonials (incl. "saved us $180K in taxes") with no disclosure.
- `src/l/federal-review/index.njk:792`, `src/l/federal-checklist/index.njk:801`, `src/l/10-things-federal-retirement/index.njk:1374` — "Verified Client" quotes + "5.0 ★ on Google" with no disclosures.
- `src/_includes/layouts/base-finpay.njk:167-218` — JSON-LD `aggregateRating` hardcoded 5.0/5 (5 reviews) conflicts with the homepage's displayed "4.9/5 · 236 reviews"; reconcile + add source/date.
- `src/refer-a-friend/index.njk:115-137` — "Client Ambassador Club" gives non-cash perks for referrals = compensated endorsements; needs promoter disclosure + written agreement, or redesign.

## H. Unqualified "tax-free" — HIGH / MEDIUM

Roth/HSA/muni/IUL "tax-free" benefits are conditional (5-year rule, age 59½, qualified distributions); state as "potentially tax-free if requirements are met" + add the tax/legal disclaimer.
- Factually wrong: `src/financial-advisor-idaho/index.njk:134` "tax-free Social Security benefits"; `src/blog/retire-idaho/…` "Social Security Is Tax-Free" (up to 85% can be federally taxable).
- `src/services/roth-conversions/index.njk:922-965,1013` — "Pay Taxes Now, Never Pay Again", "Tax-Free Forever".
- `src/services/tax-planning/index.njk`, `src/retirement-tax-strategies/index.njk`, `src/roth-conversion-strategies-utah/index.njk`, `src/services/federal-benefits/federal-retirement-taxes/`, and ~most Roth/tax blog posts.
- Tax/legal disclaimer ("Capital Wealth does not provide tax or legal advice…") is **absent** on essentially all of these.

## I. Disparagement of competitors / products — MEDIUM

NAIC prohibits disparagement; it's especially risky because CW itself sells insurance.
- `src/blog/planning-large-iras-jul-12-2025.md:387` ("Annuity pushers … Insurance salespeople … Product peddlers"), `protected-income-feb-8-2025.md:330` ("The Dinner Seminar Problem"), `retirement-income-blueprint-may-17-2025.md:465` ("Wall Street has gotten exceptionally good at hiding fees"), `taking-control-retirement-jun-28-2025.md:104` ("High-Commission … Variable Annuities").
- `src/l/sdba/index.njk:1444` ("…Over Big-Name Firms").

## J. Factual inconsistencies — LOW (but fix; substantiation matters)

- **Founding year** varies: 2006 / 2008 / 2009 / 2010 / 2012 across blog posts and pages.
- **Client count:** 500+ vs 650+ vs "3,200+ Money Maps"; **AUM** "$500M+"; team size "2" (brand-facts.json) vs 7+ shown.
- **Phone number:** blog posts list **801-210-5500**; the firm number of record is **801.210.2800**. If 5500 is wrong, every blog CTA misdirects prospects — verify urgently.
- **Utah income-tax rate:** 4.55% vs 4.85% across pages.
- `src/l/federal/index.njk:1138` — "© 2025" on a 2026 page.
- **Unsubstantiated superlatives:** `src/about/index.njk:62` "Utah's #1 retirement radio show"; `make-your-money-work-jan-3-2026.md:3,26` "Utah's leading / Most Trusted"; geo-page "trusted".

## K. Hygiene / exposure — LOW

- Indexable internal pages (add `noindex` + `excludeFromSitemap`, ideally auth): `src/facebook-report.html`, `src/leads/index.njk` (Leads Dashboard), `src/dedication-preview.html`.
- Stale `.backup` files in `src/` (`*.njk.backup`) — delete.
- Hardcoded fake-scarcity seat counters: `src/l/federal-benefits-workshop-ogden/index.njk:917` ("17 seats remaining"), `…hill-afb:917` ("7 seats remaining") — drive from real data or remove.

---

## Recommended remediation order

1. **Resolve Theme A** (registration/entity) with compliance — blocks the correct wording for B & C.
2. **Template fixes (Themes C, D):** both footers + the federal disclaimer block + the blog-post layout footer. One PR clears the majority of missing-disclosure and gov-endorsement findings sitewide.
3. **Forbidden-claims sweep (Theme B):** repo-wide replace of "fee-only", "no commissions", "no product(s)" firm claims; delete dead homepage variants + `.backup` files.
4. **Guarantees & dollar-figure sweep (Themes E, F, H):** annuity carrier/limitation disclosures, qualify "tax-free", label/strip case-study figures and projected returns, remove the SDBA "+1%" and calculator dollar projections.
5. **Testimonials/ratings (G), disparagement (I), factual cleanup (J), hygiene (K).**
6. Have the compliance attorney review the remediated site before re-publishing the highest-risk pages (federal landing pages, annuities, the workshop deck).

## Notes
- The reusable reviewer skill lives at `.claude/skills/compliance-reviewer/` — use it going forward when building any new page, email, or ad so this content ships compliant.
- Cleanest existing models to copy: `src/reviews/index.njk` (testimonial disclosure), `src/blog/new-retirement-reality-apr-25-2026.md` (full blog footer), `src/services/annuities/index.njk` body (balanced annuity treatment), both email templates (advisory+federal+unsubscribe+address present).
