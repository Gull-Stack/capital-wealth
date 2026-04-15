# SDBA Cleanup PR — Antigravity Follow-Up

**Context:** The first pass shipped most of Weeks 1–2 from `SDBA-SEO-AEO-Roadmap.md`. Before moving to Weeks 3–4 content expansion, close these 6 loose ends. Bundle them into one PR.

**Page affected:** `/services/sdba/` (the hub page only — cluster pages come later).

**Verified status as of April 15, 2026:** live page has the new H1, title/meta, definition block, author byline, 3 new schema blocks, 3 comparison tables, 18 FAQs in schema, and 2026 limits table. Word count 2,533.

---

## ✅ Cleanup Item 1 — Apply Quick Answer prefixes to FAQs #2 through #18

**Status:** Only FAQ #1 has the "Quick answer:" prefix. The other 17 still need it — both in the visible HTML AND in the `FAQPage` JSON-LD `acceptedAnswer.text`.

**Pattern (already applied to #1 — follow this exactly):**
```html
<div class="faq-answer">
  <p class="quick-answer"><strong>Quick answer:</strong> [25–40 word lead answer]</p>
  <p>[rest of existing answer]</p>
</div>
```

**Schema pattern (update every `acceptedAnswer.text` to START with the Quick Answer):**
```json
"acceptedAnswer": {
  "@type": "Answer",
  "text": "Quick answer: [25–40 word lead]. [Then the existing longer answer text]."
}
```

**Quick Answers to use (verbatim — already compliance-safe):**

| # | Question | Quick Answer |
|---|---|---|
| 2 | Does my retirement plan offer an SDBA? | Many mid-to-large employer plans and the federal TSP offer SDBAs, but plans rarely advertise them. Check your plan's summary description for "brokerage window" or "brokerage link," or ask Capital Wealth to confirm eligibility. |
| 3 | Who is eligible to use an SDBA? | Any participant in a 401(k), 403(b), 457, 401(a), or federal TSP plan that offers an SDBA feature is eligible. Eligibility is plan-specific, not income- or experience-based. |
| 4 | Does my money leave my employer's 401(k) plan? | No. SDBA assets remain inside your employer-sponsored retirement plan — the brokerage account is simply a sub-account within the same plan, keeping all protections and tax treatment intact. |
| 5 | How is an SDBA different from a target-date fund? | A target-date fund is a one-size-fits-all glide path. An SDBA lets a fiduciary advisor build a portfolio tailored to your timeline, risk tolerance, and income plan — actively managed, not set-and-forget. |
| 6 | Can my financial advisor manage my SDBA? | Yes. A qualified fiduciary advisor like Capital Wealth can be granted limited authority to manage your SDBA while you retain full control of your 401(k) and plan participation. |
| 7 | How much does an SDBA cost? | Typical SDBA platform fees are $0–$100 per year depending on the plan. Capital Wealth's management fee is disclosed upfront during your consultation — no hidden costs, no commissions on trades. |
| 8 | What does 'fiduciary' mean here? | A fiduciary advisor is legally required to put your interests ahead of their own at all times. Capital Wealth is a registered fiduciary firm — not a broker-dealer selling products on commission. |
| 9 | How often is the account reviewed or rebalanced? | Your SDBA is actively monitored and rebalanced on an ongoing basis. Capital Wealth reviews allocations quarterly at minimum, with real-time adjustments when markets or your plan require it. |
| 10 | Is my money protected inside an SDBA? | Yes. SDBA assets stay inside your employer-sponsored plan and retain the same ERISA protections as the rest of your 401(k). Holdings are also protected by SIPC through the brokerage custodian. |
| 11 | Can I see my SDBA on my normal 401(k) statement? | Yes. Your SDBA appears as a position on your normal 401(k) or TSP statement. For detailed holdings, you can log in directly to the brokerage platform (Fidelity, Schwab, Empower, Vanguard, TSP). |
| 12 | Can I roll in prior-employer 401(k)s? | Yes, if your current plan allows rollovers (most do). A Capital Wealth advisor can walk through whether rolling in a prior employer 401(k) is the right move for your situation. |
| 13 | What happens to my SDBA if I leave my job? | You typically have four options: leave it in the current plan, roll to a new employer's plan, roll to an IRA, or cash out (rarely advisable). Capital Wealth helps you evaluate which fits your full retirement picture. |
| 14 | What are the 2026 401(k) contribution limits? | In 2026, employees can contribute up to $24,500; age 50+ can add $8,000 catch-up ($32,500 total); age 60–63 can add $11,250 super catch-up under SECURE 2.0. SDBA contributions count toward these same limits. |
| 15 | Can I stop SDBA management later? | Yes. You can end Capital Wealth's management of your SDBA at any time — assets stay in your 401(k), and you return to self-directing or another advisor without penalty. |
| 16 | Do I still control my 401(k) with an SDBA? | Yes. You retain full control of your 401(k) and plan participation. Capital Wealth manages only the investment selections inside the SDBA — you can pause, modify, or cancel management at any time. |
| 17 | Can I see my SDBA account online? | Yes. Your SDBA appears inside your normal 401(k) or TSP portal. You can also log in directly to the underlying brokerage (Fidelity, Schwab, Empower, Vanguard, or TSP) to see detailed holdings. |
| 18 | How do I know which investments are right for me inside an SDBA? | You don't need to choose. Your Capital Wealth fiduciary advisor builds and maintains the portfolio based on your age, timeline, risk tolerance, and retirement plan — no DIY fund picking required. |

---

## ✅ Cleanup Item 2 — Add Mike's credentials to the author byline

**Current (on live page):**
```html
Reviewed by <strong>Mike Stevens</strong>
```

**Update to:**
```html
Reviewed by <strong>Mike Stevens, CFP®, ChFC®</strong>
```

**Also update the alt attribute on the avatar image:**
```html
alt="Mike Stevens, CFP® — Founder, Capital Wealth"
```

**Also update the `author` object inside the `WebPage`+`Article` JSON-LD:**
```json
"hasCredential": [
  { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification", "name": "CFP®" },
  { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification", "name": "ChFC®" }
]
```

**⚠️ Before merging:** Bryce/Mike must confirm these are Mike's exact, current designations. If only CFP® is accurate, use only CFP®. If additional designations apply (e.g., Series 65), add them.

---

## ✅ Cleanup Item 3 — Swap the OG image for an SDBA-specific asset

**Current:**
```html
<meta property="og:image" content="https://www.capitalwealth.com/assets/images/photos/CWA-Mountain-Couple-home-header.webp">
<meta name="twitter:image" content="https://www.capitalwealth.com/assets/images/photos/CWA-Mountain-Couple-home-header.webp">
```

**Replace with:**
```html
<meta property="og:image" content="https://www.capitalwealth.com/assets/images/og/sdba-og-1200x630.jpg">
<meta property="og:image:alt" content="Self-Directed Brokerage Account Management — Capital Wealth">
<meta name="twitter:image" content="https://www.capitalwealth.com/assets/images/og/sdba-og-1200x630.jpg">
<meta name="twitter:image:alt" content="Self-Directed Brokerage Account Management — Capital Wealth">
```

**Asset needed:** `/src/assets/images/og/sdba-og-1200x630.jpg`
- **Size:** 1200 × 630 px
- **Content:**
  - Capital Wealth logo (top-left, small)
  - Headline: **"Self-Directed Brokerage Account Management"** (large, Old Glory Blue `#0A3161`)
  - Sub-line: "Fidelity BrokerageLink · Schwab PCRA · Empower · Vanguard · TSP"
  - Data chip: **"5,000+ funds unlocked"** in Old Glory Red `#B31942`
  - URL footer: `capitalwealth.com/services/sdba`
- **Background:** white or very pale gray

Bryce will create this in Canva using the CW brand kit and drop it into the repo. Antigravity only needs to update the meta tags once the asset is in place.

---

## ✅ Cleanup Item 4 — Fix nav heading hierarchy (remove H3/H4 from mega-menu)

**Problem:** Mega-menu/dropdown uses `<h3>` and `<h4>` tags that appear in DOM order *before* the page H1. This breaks document outline for screen readers and LLM parsers.

**Current (from live DOM):**
```
H3: Retirement Services
H2: A written plan for every dollar of your retirement.
H4: Core Services
H4: Specialty
H3: Federal Employee Benefits
H2: FERS done right. ...
H4: Plan Your Benefits
H4: Tools & Resources
H3: Self-Directed Brokerage Accounts
H2: Take control of the money in your 401(k).
H4: How SDBA Works
H4: Get Started
H1: Self-Directed Brokerage Account (SDBA) Management for 401(k) and TSP   ← FINALLY
```

**This is a site-wide fix (affects every page).** Locate the mega-menu template component (likely `_includes/mega-menu.njk` or similar).

**Change:**
```html
<h3 class="mega-menu-category">Retirement Services</h3>
```
**To:**
```html
<div class="mega-menu-category">Retirement Services</div>
```

**Same for all `<h4>` sub-category labels inside the nav → convert to `<div class="mega-menu-subcategory">`.**

CSS should already target the class, not the tag — verify no CSS rules use `.mega-menu h3` or `.mega-menu h4`. Update selectors if they do.

**Verify after change:**
- Install the "HeadingsMap" browser extension.
- Load `/services/sdba/` and confirm the outline starts with H1 → H2 → H3 with no H3/H4 before the H1.
- Run [W3C Nu HTML Checker](https://validator.w3.org/nu/) against the page.

---

## ✅ Cleanup Item 5 — Add the conservative 7% vs ~8% comparison block

**Current:** The old section "What could a 1% better return do for your retirement?" is still on the page (110 words) but it's prose-only — no structured side-by-side.

**Action:** Replace that section's body with the structured comparison card from the roadmap (conservative framing — 7% baseline vs ~8% with ~1% advisor value).

**Replacement HTML:**
```html
<section class="sdba-stat-proof" aria-label="The conservative value of professional SDBA management">
  <div class="container">
    <h2>What could a conservatively managed SDBA do for your retirement?</h2>
    <p class="stat-lead">
      We don't believe in performance promises. What we do believe in is a disciplined,
      diversified approach — and for many participants, even a modest improvement of
      approximately <strong>1% per year</strong> over the course of a career can
      meaningfully change the size of a retirement account.
    </p>
    <div class="stat-compare">
      <div class="stat-col">
        <p class="stat-label">Self-managed 401(k)</p>
        <p class="stat-figure">~7%</p>
        <p class="stat-note">Long-term conservative baseline return estimate</p>
      </div>
      <div class="stat-col stat-col-primary">
        <p class="stat-label">Professionally managed SDBA</p>
        <p class="stat-figure">~8%</p>
        <p class="stat-note">Conservative baseline + ~1% potential advisor value</p>
      </div>
    </div>
    <p class="stat-disclaimer">
      Hypothetical illustration only. Assumes a conservative long-term equity return estimate
      of 7% — below the long-term historical average of the S&amp;P 500. The ~1% "advisor
      value" figure is a general estimate of the potential benefit of professional portfolio
      management, rebalancing, and tax-aware allocation — not a guarantee or projection of
      any specific return. Past performance does not guarantee future results. Actual returns
      will vary based on market conditions, plan design, and individual investment selections.
    </p>
  </div>
</section>
```

**CSS:**
```css
.sdba-stat-proof { padding: 3rem 0; background: #fff; }
.sdba-stat-proof .stat-lead { max-width: 720px; margin: 1rem auto 2rem; font-size: 1.0625rem; line-height: 1.6; text-align: center; color: #333; }
.stat-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 720px; margin: 0 auto; }
.stat-col { padding: 1.75rem 1.5rem; background: #f9fafb; border-radius: 12px; text-align: center; border: 2px solid #e5e7eb; }
.stat-col-primary { background: linear-gradient(135deg, #0A3161 0%, #1e4d82 100%); color: #fff; border-color: #0A3161; }
.stat-col .stat-label { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.5rem; font-weight: 600; opacity: 0.85; }
.stat-col .stat-figure { font-size: 3rem; font-weight: 700; margin: 0 0 0.5rem; line-height: 1; font-variant-numeric: tabular-nums; }
.stat-col-primary .stat-figure { color: #fff; }
.stat-col:not(.stat-col-primary) .stat-figure { color: #0A3161; }
.stat-col .stat-note { font-size: 0.8125rem; line-height: 1.45; margin: 0; opacity: 0.85; }
.stat-disclaimer { max-width: 720px; margin: 1.5rem auto 0; font-size: 0.75rem; line-height: 1.5; color: #666; font-style: italic; }
@media (max-width: 640px) { .stat-compare { grid-template-columns: 1fr; } .stat-col .stat-figure { font-size: 2.5rem; } }
```

**Compliance guardrail:** do NOT cite the 3.32% AON Hewitt figure. Do NOT remove the disclaimer. Do NOT default to 9% or higher baselines.

---

## ✅ Cleanup Item 6 — Add sticky TOC / jump links

**Current:** Zero jump links on the page. Add a sticky TOC at the top of the main content area.

**HTML (place immediately after the author byline, before the definition block):**
```html
<nav class="sdba-toc" aria-label="On this page">
  <p class="toc-label">On this page</p>
  <ol>
    <li><a href="#what-is-sdba">What is an SDBA?</a></li>
    <li><a href="#sdba-value">The Value of Professional Management</a></li>
    <li><a href="#sdba-vs-standard">SDBA vs. Standard 401(k) Lineup</a></li>
    <li><a href="#sdba-platforms">Platforms We Manage</a></li>
    <li><a href="#three-steps">Our 3-Step Process</a></li>
    <li><a href="#sdba-fit">Is an SDBA Right for You?</a></li>
    <li><a href="#contribution-limits">2026 Contribution Limits</a></li>
    <li><a href="#sdba-faq">Frequently Asked Questions</a></li>
  </ol>
</nav>
```

**Add matching `id=""` attributes to each H2:**

| Section H2 | `id` attribute |
|---|---|
| What is a Self-Directed Brokerage Account? | `id="what-is-sdba"` |
| What could a conservatively managed SDBA do...? | `id="sdba-value"` |
| SDBA vs. Standard 401(k) Fund Lineup | `id="sdba-vs-standard"` |
| SDBA Platforms We Manage | `id="sdba-platforms"` |
| Three Steps to SDBA Success | `id="three-steps"` |
| Is an SDBA Right for You? | `id="sdba-fit"` |
| 2026 401(k) & SDBA Contribution Limits | `id="contribution-limits"` |
| SDBA FAQ | `id="sdba-faq"` |

**CSS:**
```css
.sdba-toc { position: sticky; top: 80px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.25rem; font-size: 0.9rem; max-width: 280px; margin-left: auto; z-index: 10; }
.sdba-toc .toc-label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem; color: #666; margin: 0 0 0.5rem; font-weight: 600; }
.sdba-toc ol { margin: 0; padding-left: 1.25rem; }
.sdba-toc li { margin: 0.375rem 0; }
.sdba-toc a { color: var(--color-primary, #0A3161); text-decoration: none; }
.sdba-toc a:hover { text-decoration: underline; }
@media (max-width: 1024px) { .sdba-toc { position: static; margin: 1.5rem 0; max-width: 100%; } }
```

**Also add smooth scroll + scroll offset for the anchor targets:**
```css
html { scroll-behavior: smooth; }
:target { scroll-margin-top: 80px; }
```

---

## PR summary for Antigravity

**Commit message (suggested):**
```
feat(sdba): apply SDBA page cleanup items from roadmap

- Add Quick Answer prefixes to FAQs #2-18 (HTML + FAQPage schema)
- Add Mike Stevens credentials to author byline + Article schema (CFP®, ChFC®)
- Swap generic OG image for SDBA-specific asset
- Convert mega-menu H3/H4 labels to styled divs (site-wide outline fix)
- Replace 1% prose section with structured 7% vs ~8% comparison card
- Add sticky TOC with 8 anchor links + id attributes on H2s

Compliance: all stat copy uses conservative ~1% advisor-value framing on
a 7% S&P baseline with hypothetical projection disclaimers. No 3.32%
outperformance claims.
```

**Test before deploy:**
1. Run [Rich Results Test](https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.capitalwealth.com%2Fservices%2Fsdba%2F) — confirm FAQPage, HowTo, WebPage+Article, Service, BreadcrumbList, Review all still validate.
2. Run HeadingsMap browser extension — confirm clean H1 → H2 → H3 outline with no stray H3/H4 before H1.
3. Test OG image on [opengraph.xyz](https://www.opengraph.xyz/) — confirm SDBA-specific asset loads.
4. Spot-check 3–4 FAQ items to confirm Quick Answer renders and is in schema `acceptedAnswer.text`.
5. Click each TOC link on mobile + desktop — confirm smooth scroll lands correctly with header offset.

After this PR merges, we move to Weeks 3–4 content expansion (platform-specific sub-sections, audience segmentation, fee transparency, case studies, stats grid).
