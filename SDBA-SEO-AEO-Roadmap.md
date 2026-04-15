# SDBA Page — Week 1 Fixes for Antigravity

**Target file:** likely `src/services/sdba/index.njk` (or wherever the `/services/sdba/` page template lives)
**URL affected:** https://www.capitalwealth.com/services/sdba/
**Goal:** Ship 5 high-leverage SEO/AEO fixes. All copy + code is ready to drop in.

---

## ✅ Fix 1 — Rewrite the H1

### Current
```html
<h1>Your Retirement Plan Has More Options Than You Think</h1>
<p class="hero-subtitle">Professional SDBA Management.</p>
```

### New
```html
<p class="hero-eyebrow">Your retirement plan has more options than you think.</p>
<h1>Self-Directed Brokerage Account (SDBA) Management for 401(k) and TSP</h1>
<p class="hero-subtitle">
  Fiduciary management inside your employer plan — Fidelity BrokerageLink, Schwab PCRA,
  Empower, Vanguard, and the federal TSP Mutual Fund Window.
</p>
```

**Style note:** add `.hero-eyebrow` — small uppercase kicker line above the H1. Keeps the emotional hook, but lets the H1 do its SEO job.

```css
.hero-eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--color-accent, #B31942);
  margin-bottom: 0.75rem;
}
```

---

## ✅ Fix 2 — Add a definition block above the fold

Place this **immediately after** the hero CTA section, before the "Also Seen On" media bar.

```html
<section class="sdba-definition" aria-label="What is an SDBA">
  <div class="container">
    <div class="definition-card">
      <h2 class="definition-heading">What is a Self-Directed Brokerage Account?</h2>
      <p class="definition-body">
        A <strong>Self-Directed Brokerage Account (SDBA)</strong> is a feature inside many
        <strong>401(k), 403(b), 457, 401(a), and federal Thrift Savings Plan (TSP)</strong>
        retirement plans that lets participants invest in thousands of mutual funds and ETFs
        beyond the plan's standard fund lineup. Your contributions, employer match, and tax
        treatment remain identical — only the investment menu expands. Common platforms
        include <strong>Fidelity BrokerageLink</strong>, <strong>Schwab Personal Choice
        Retirement Account (PCRA)</strong>, <strong>Empower Brokerage</strong>,
        <strong>Vanguard Brokerage Option</strong>, and the <strong>TSP Mutual Fund Window</strong>.
      </p>
    </div>
  </div>
</section>
```

```css
.sdba-definition { padding: 2.5rem 0; background: #f9fafb; }
.definition-card {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem;
  border-left: 4px solid var(--color-accent, #B31942);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.definition-heading { font-size: 1.375rem; margin: 0 0 0.75rem; }
.definition-body { font-size: 1.0625rem; line-height: 1.6; margin: 0; color: #1a1a1a; }
```

**Why this matters:** AI Overviews, ChatGPT, and Perplexity almost always lift their "definition" citation from a short, direct paragraph in the first 200 words. This block is that.

---

## ✅ Fix 3 — Add a visible author byline with credentials

Place **immediately below the H1/subtitle** in the hero, before the CTA:

```html
<div class="author-attribution">
  <img src="/assets/images/team/mike-stevens.jpg"
       alt="Mike Stevens, CFP® — Founder, Capital Wealth"
       class="author-avatar"
       loading="lazy"
       width="48" height="48">
  <div class="author-meta">
    <span class="author-name">
      Reviewed by <strong>Mike Stevens, CFP®, ChFC®</strong>
    </span>
    <span class="author-line">
      Founder, Capital Wealth &nbsp;·&nbsp;
      15+ years advising 401(k) and TSP participants
    </span>
    <span class="author-date">
      Last updated: <time datetime="2026-04-15">April 15, 2026</time>
    </span>
  </div>
</div>
```

```css
.author-attribution {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  margin: 1rem 0 1.5rem;
  padding: 0.75rem 1rem;
  background: rgba(10, 49, 97, 0.04);
  border-radius: 8px;
  max-width: fit-content;
}
.author-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.author-meta { display: flex; flex-direction: column; gap: 2px; font-size: 0.875rem; line-height: 1.4; }
.author-name strong { color: var(--color-primary, #0A3161); }
.author-line, .author-date { color: #555; font-size: 0.8125rem; }
```

**Note to Antigravity:** if the mike-stevens.jpg path differs, verify from the repo's team assets. From memory: `src/assets/images/team/mike-stevens.jpg`.

**Verify credentials before pushing:** confirm Mike holds CFP® and ChFC® (and whether Series 65 should be included). If only one designation is accurate, use only what's accurate.

---

## ✅ Fix 4 — Add three new JSON-LD schema blocks

Add these **inside `<head>`**, after the existing schema blocks. Do NOT remove any existing schema.

### 4a. WebPage + Article schema (biggest E-E-A-T lift)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["WebPage", "Article"],
  "@id": "https://www.capitalwealth.com/services/sdba/#webpage",
  "url": "https://www.capitalwealth.com/services/sdba/",
  "name": "Self-Directed Brokerage Account (SDBA) Management for 401(k) and TSP",
  "headline": "Self-Directed Brokerage Account (SDBA) Management for 401(k) and TSP",
  "description": "Fiduciary SDBA management for 401(k) and TSP participants. Access 5,000+ mutual funds with expert guidance. Fidelity BrokerageLink, Schwab PCRA, Empower, Vanguard, and TSP Mutual Fund Window supported.",
  "datePublished": "2025-09-01",
  "dateModified": "2026-04-15",
  "inLanguage": "en-US",
  "isPartOf": {
    "@type": "WebSite",
    "@id": "https://www.capitalwealth.com/#website",
    "url": "https://www.capitalwealth.com/",
    "name": "Capital Wealth",
    "publisher": { "@id": "https://www.capitalwealth.com/#organization" }
  },
  "about": { "@id": "https://www.capitalwealth.com/#organization" },
  "image": "https://www.capitalwealth.com/assets/images/og/sdba-og-1200x630.jpg",
  "author": {
    "@type": "Person",
    "@id": "https://www.capitalwealth.com/about/#mike-stevens",
    "name": "Mike Stevens",
    "jobTitle": "Founder & Lead Financial Advisor",
    "description": "Fiduciary financial advisor specializing in 401(k), TSP, and self-directed brokerage account management. 15+ years of experience.",
    "hasCredential": [
      { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification", "name": "CFP®" },
      { "@type": "EducationalOccupationalCredential", "credentialCategory": "certification", "name": "ChFC®" }
    ],
    "worksFor": { "@id": "https://www.capitalwealth.com/#organization" },
    "url": "https://www.capitalwealth.com/about/",
    "sameAs": ["https://www.linkedin.com/in/mstevens317/"]
  },
  "reviewedBy": {
    "@type": "Person",
    "@id": "https://www.capitalwealth.com/about/#mike-stevens"
  },
  "publisher": { "@id": "https://www.capitalwealth.com/#organization" },
  "mainEntityOfPage": "https://www.capitalwealth.com/services/sdba/",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".sdba-definition", ".definition-body"]
  }
}
</script>
```

**Note on `datePublished`:** set this to the actual page publish date in the CMS/repo. `"2025-09-01"` is a placeholder — replace with the true original publish date.

### 4b. Service schema scoped to SDBA

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://www.capitalwealth.com/services/sdba/#service",
  "name": "Self-Directed Brokerage Account Management",
  "serviceType": "SDBA Management",
  "description": "Professional, fiduciary management of Self-Directed Brokerage Accounts inside employer 401(k), 403(b), 457, 401(a), and federal TSP plans.",
  "provider": { "@id": "https://www.capitalwealth.com/#organization" },
  "areaServed": { "@type": "Country", "name": "United States" },
  "audience": {
    "@type": "Audience",
    "audienceType": "401(k), 403(b), 457, 401(a), and federal TSP participants"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "SDBA Platforms We Manage",
    "itemListElement": [
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Fidelity BrokerageLink Management" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Schwab Personal Choice Retirement Account (PCRA) Management" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Empower Brokerage Management" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Vanguard Brokerage Option Management" } },
      { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "TSP Mutual Fund Window Management" } }
    ]
  }
}
</script>
```

### 4c. HowTo schema for the "Three Steps" section

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Use a Self-Directed Brokerage Account Effectively",
  "description": "A three-step process for evaluating, building, and managing a Self-Directed Brokerage Account inside your employer retirement plan.",
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Evaluate",
      "text": "Review your plan's SDBA eligibility, fee structure, and allowable fund universe. Capital Wealth confirms whether your 401(k), 403(b), or TSP offers a brokerage window and whether SDBA fits your goals."
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Build",
      "text": "Construct a diversified, risk-appropriate portfolio inside the SDBA using low-cost ETFs and mutual funds aligned to your retirement timeline and income plan."
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Manage",
      "text": "Ongoing rebalancing, tax-loss harvesting where applicable, and quarterly reviews keep your SDBA aligned with your retirement plan as markets and goals change."
    }
  ]
}
</script>
```

**Important:** the `text` fields above must match (roughly) the visible copy inside the three-step section on the page. If the current on-page copy differs meaningfully, update the schema text to mirror the visible page.

---

## ✅ Fix 5 — Replace the OG image with an SDBA-specific asset

### Current (generic homepage hero)
```html
<meta property="og:image" content="https://www.capitalwealth.com/assets/images/photos/CWA-Mountain-Couple-home-header.webp">
<meta name="twitter:image" content="https://www.capitalwealth.com/assets/images/photos/CWA-Mountain-Couple-home-header.webp">
```

### New
```html
<meta property="og:image" content="https://www.capitalwealth.com/assets/images/og/sdba-og-1200x630.jpg">
<meta property="og:image:alt" content="Self-Directed Brokerage Account Management — Capital Wealth">
<meta name="twitter:image" content="https://www.capitalwealth.com/assets/images/og/sdba-og-1200x630.jpg">
<meta name="twitter:image:alt" content="Self-Directed Brokerage Account Management — Capital Wealth">
```

### OG image spec (for design)
- **Size:** 1200 × 630 px, JPG (or WebP + JPG fallback)
- **File path:** `/assets/images/og/sdba-og-1200x630.jpg`
- **Content:**
  - Capital Wealth logo (top-left, small)
  - Headline: **"Self-Directed Brokerage Account Management"** (large, Old Glory Blue `#0A3161`)
  - Sub-line: "Fidelity BrokerageLink · Schwab PCRA · Empower · Vanguard · TSP"
  - Data badge or chip: **"5,000+ funds unlocked"** in Old Glory Red `#B31942`
  - URL footer: `capitalwealth.com/services/sdba`
- **Background:** white or very pale gray; keep it clean — social thumbnails crop tightly

If design bandwidth is tight, Bryce can spin one up in Canva using CW's existing brand kit.

---

## Handoff summary for Antigravity

1. Locate the `/services/sdba/` page template (Nunjucks — likely `src/services/sdba/index.njk` or `src/pages/services/sdba.njk`).
2. Apply Fixes 1–5 above. Preserve all existing schema blocks — these are **additions**, not replacements (except the OG image URLs).
3. Create the new OG image at `/src/assets/images/og/sdba-og-1200x630.jpg` (or wherever the build pipeline copies static assets from).
4. Add the new CSS to the site's SDBA page stylesheet (or the global stylesheet if that's the convention).
5. Verify author photo path — should be `src/assets/images/team/mike-stevens.jpg` per CW convention.
6. Confirm Mike's exact credentials before publishing (CFP®, ChFC®, Series 65?).
7. Confirm `datePublished` value from repo git history for this page (or CMS if earlier).
8. Build, deploy to Vercel preview, validate with:
   - [Google Rich Results Test](https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.capitalwealth.com%2Fservices%2Fsdba%2F)
   - [Schema.org validator](https://validator.schema.org/)
   - [OpenGraph.xyz preview](https://www.opengraph.xyz/)
9. After deploy, resubmit URL in Google Search Console.

---

## What success looks like after Week 1 ships

- H1 contains primary keyword → Google re-crawls and re-scores relevance
- Author + dates + Reviewed-by visible AND in schema → E-E-A-T climb
- New Article + Service + HowTo schema → eligible for featured snippets, How-To rich result, and AI Overview citations
- New OG image → better social CTR from LinkedIn/Facebook shares

Week 2 (tables, FAQ quick-answers, heading hierarchy, TOC) unlocks the AEO citation layer on top of this.

---

# 🎯 Competitive Intel — PowerMy401k / Bison Wealth

Analyzed:
- https://powermy401k.com/
- https://powermy401k.com/faqsand401kcalculator/

**Who they are:** Bison Wealth's consumer-facing SDBA brand, Atlanta-based, SEC-registered RIA, backed by East Asset Management (Pegula family — Buffalo Bills/Sabres). They run aggressive Google Ads on "401k calculator" keywords. Direct competitor for the exact keyword set CW wants.

## What they do well that CW does not

### 1. They lead with an aggressive outperformance statistic
Their entire homepage hero is built around one number:

> **"A Bison professionally managed 401(k) could earn an average of 3.32% more per year."**
> — sourced to AON Hewitt "Help in Defined Contribution Plans" study

**Capital Wealth's posture is different.** Mike has explicitly chosen not to cite outperformance stats like 3.32%. Per CW's compliance stance:

- Advisor value: framed as roughly **1% per year** (conservative "advisor alpha")
- Market baseline: conservative end of long-term S&P 500 returns — use **7%**, not 8–9%
- No specific outperformance claims pulled from third-party studies

This is a fiduciary compliance choice: Mike would rather underpromise and overdeliver, and avoid anything that could read as a performance guarantee. It's also defensible under FINRA/SEC marketing rules.

**Action for CW SDBA page — replace the current "1% better return" hero section with a conservative framed growth comparison, not a headline stat:**

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

**Why this beats PowerMy401k's 3.32% claim in the long run:**
- Legally and ethically defensible as a fiduciary
- Still visually anchors the value of management (7% vs 8% side-by-side)
- Respects the user's intelligence — no big flashy stat
- Avoids the "too good to be true" filter sophisticated prospects apply

### 2. FAQ is categorized, not flat
Their FAQ is organized into 4 buckets: **Most Popular Questions / How Does It Work? / About [the firm] / Our Ethics**. This improves UX, increases dwell time, and lets them rank for more long-tail queries per page.

**Action:** restructure CW's 15 FAQs into 4 buckets:
- **Most Popular Questions** (top 5–6, definition + eligibility + cost)
- **How SDBA Management Works** (process + review cadence + platforms)
- **About Capital Wealth & Our Fiduciary Duty** (credentials + Mike Stevens + fee structure)
- **2026 Contribution Limits & Rules** (new — see below)

### 3. Questions they have that CW is missing

CW should add these to the FAQ (all high-intent, long-tail queries):

- **"Do I still control my 401(k) with an SDBA?"** — Anxiety question. Huge for conversion.
- **"Will I be able to see my SDBA account online?"** — practical, builds trust
- **"How do I choose the best self-directed brokerage account?"** — long-tail keyword winner
- **"How will I know which investments are right for me?"** — addresses decision paralysis
- **"What are the 2026 401(k) contribution limits?"** — they cover this; CW has it but the page lacks the FULL detail. Add a standalone contribution limits block (see below).
- **"Is Roth or Traditional better for me inside an SDBA?"** — ties SDBA to Roth Conversions page (internal link)
- **"What happens if I change jobs?"** — they have it; CW covers similar ground. Make sure it's clear.

### 4. 2026 contribution limits block (they do this well — CW should do it better)

Add a **structured, table-formatted** 2026 contribution limits section. This is highly scraped by LLMs and wins "what are the 401k contribution limits for 2026" queries.

```html
<section class="contribution-limits" id="2026-401k-limits">
  <div class="container">
    <h2>2026 401(k) & SDBA Contribution Limits</h2>
    <p>The IRS limits below apply to the total amount you (and your employer match, where applicable) can contribute to a 401(k), 403(b), 457, or federal TSP — including amounts invested through a Self-Directed Brokerage Account.</p>
    <table class="limits-table">
      <thead>
        <tr>
          <th>Contribution Type</th>
          <th>2025 Limit</th>
          <th>2026 Limit</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Employee elective deferral (under age 50)</td>
          <td>$23,500</td>
          <td>$24,500</td>
        </tr>
        <tr>
          <td>Age 50+ catch-up contribution</td>
          <td>+$7,500 (total $31,000)</td>
          <td>+$8,000 (total $32,500)</td>
        </tr>
        <tr>
          <td>Age 60–63 "super catch-up" (SECURE 2.0)</td>
          <td>+$11,250 (total $34,750)</td>
          <td>+$11,250 (total $35,750)</td>
        </tr>
        <tr>
          <td>Combined employee + employer limit</td>
          <td>$70,000 / $77,500 (50+)</td>
          <td>$72,000 / $80,000 (50+)</td>
        </tr>
      </tbody>
    </table>
    <p class="table-footnote">Source: IRS Notice 2024-80 (2025) and IRS Notice 2025-XX (2026). Verify figures against the current IRS publication before relying on them for planning.</p>
  </div>
</section>
```

**Important:** verify the 2026 numbers against the most recent IRS notice before publishing. Have Mike or compliance sign off. (The PowerMy401k page itself had a mismatch — they listed $24,500 for 2026 but the older catch-up limits were carried over inconsistently.)

### 5. Calculator tool (Week 3+, not Week 1)

PowerMy401k's home page has an embedded 401(k) growth calculator that takes Age / Salary / Balance / Company Name. It's a lead capture machine — "Company Name" routes to a consultation. CW's planned **FERS Calculator** is a bigger SEO play (23K+ volume per the existing SEO strategy memory), but for SDBA we should eventually build:

> **"SDBA Value Calculator"** — inputs: current balance, age, salary, contribution %. Output: projected balance with/without professional management, using the AON Hewitt 3.32% delta.

Park this as a Phase 2 deliverable (after FERS calculator ships).

### 6. Structural weaknesses in PowerMy401k (CW's opportunities to pull ahead)

| Area | PowerMy401k | Capital Wealth opportunity |
|---|---|---|
| Meta description | **Missing** | CW has one ✅ — keep the edge |
| Schema | Minimal/none visible | CW will have Article + Service + HowTo + FAQ + Review ✅ |
| Author/E-E-A-T | None visible; uses firm backing only | Add Mike Stevens CFP® byline ✅ |
| TSP / federal niche | Not mentioned | **CW's moat** — lean into TSP Mutual Fund Window content |
| Platform-specific pages | None | CW can build BrokerageLink / PCRA / Empower / Vanguard pillar pages |
| Word depth | 873 home / 2,329 FAQ | CW target: 3,500+ on SDBA pillar |
| Local signal | Atlanta-only mention | CW has full LocalBusiness schema + Lehi, UT ✅ |

## Updated Week 1 additions (add to the list of fixes)

After the 5 original Week 1 fixes, also add:

### ✅ Fix 6 — Replace the existing "1% better return" section with the conservative side-by-side comparison
Place **above the "Common SDBA Problems" H2**, directly after the definition block. Use the HTML from §1 above (conservative 7% vs ~8% comparison with ~1% advisor value framing). **Do NOT cite the 3.32% AON Hewitt figure anywhere on the page.**

### ✅ Fix 7 — Add the 2026 contribution limits table
Place **above the FAQ section**. Use HTML from §4 above. **Verify numbers with compliance before publish.**

### ✅ Fix 8 — Add 3 new FAQ items (quick win — just extends the existing FAQPage schema)
Add these three questions to the page visible FAQ AND to the FAQPage JSON-LD:

1. **"Do I still control my 401(k) if Capital Wealth manages my SDBA?"**
   Answer: "Yes. You retain full control of your 401(k) account and plan participation. Capital Wealth manages the investment selection inside the Self-Directed Brokerage Account as your fiduciary — you can pause, modify, or cancel SDBA management at any time without affecting the rest of your 401(k)."

2. **"Can I see my SDBA in my regular 401(k) account online?"**
   Answer: "Yes. Your SDBA appears as an investment position inside your normal 401(k) or TSP online account. For detailed holdings, you can also log in directly to the brokerage platform (Fidelity, Schwab, Empower, Vanguard, or TSP) that powers the SDBA."

3. **"How do I know which investments are right for me inside an SDBA?"**
   Answer: "Your Capital Wealth fiduciary advisor builds your SDBA portfolio around your age, retirement timeline, risk tolerance, existing assets, and income needs. Selection and ongoing rebalancing are handled for you — no DIY fund-picking required."

## Summary of what shifts after incorporating this intel

| Week 1 item | Before intel | After intel |
|---|---|---|
| Fixes to ship | 5 | 8 |
| Citeable statistics on page | 0 | 1 (conservative 1% advisor-value framing, 7% base) |
| Tables on page | 0 | 1 (2026 limits — Week 1 now, not Week 2) |
| FAQ items | 15 | 18 |
| Competitive differentiation | Medium | High (CW leads on schema, author E-E-A-T, TSP niche) |

**Net effect:** instead of matching PowerMy401k's aggressive stat claim, CW holds a conservative fiduciary posture (1% advisor value on a 7% baseline) while **leapfrogging them** on schema depth, E-E-A-T signals, TSP/federal content, platform-specific coverage, and compliance-defensibility. That's a durable long-term position — competitors who overclaim can be forced to rework pages when regulators tighten rules; CW won't have to.

## Handoff reminder for Antigravity

When implementing, the order of operations that minimizes re-work:
1. H1 rewrite + definition block + author byline (copy changes)
2. OG image swap (asset + meta tag change)
3. New schema blocks (pure additions to `<head>`)
4. 3.32% hero stat block (new section)
5. 2026 limits table (new section)
6. 3 new FAQ items (add to visible list + extend FAQPage schema)
7. Build → deploy to Vercel preview → validate with Google Rich Results Test → push to prod.

All 8 Week 1 fixes should be one PR. Target: ship within 3–5 business days.

---

# 📅 WEEK 2 — AEO Citation Layer

Goal: make the page maximally citable by ChatGPT, Perplexity, Google AI Overviews. All work is on the same `/services/sdba/` page.

## ✅ Fix 9 — Add 3 comparison tables (highest AEO leverage item in Week 2)

AI Overviews and ChatGPT heavily prefer pages with structured tables. Add all three inside the main content flow.

### Table A — SDBA vs. Standard 401(k) Fund Lineup
Place **immediately after the definition block**.

```html
<section class="sdba-compare-table" aria-label="SDBA vs standard 401(k) lineup">
  <div class="container">
    <h2>SDBA vs. Standard 401(k) Fund Lineup</h2>
    <table class="sdba-table">
      <thead>
        <tr>
          <th scope="col">Feature</th>
          <th scope="col">Standard Plan Lineup</th>
          <th scope="col">Self-Directed Brokerage Account</th>
        </tr>
      </thead>
      <tbody>
        <tr><th scope="row">Fund choices</th><td>Typically 15–25 curated funds</td><td>5,000+ mutual funds and ETFs</td></tr>
        <tr><th scope="row">Professional management</th><td>Target-date default</td><td>Active, fiduciary-managed</td></tr>
        <tr><th scope="row">Fees</th><td>Plan-default expense ratios</td><td>~$25–$100/yr flat SDBA fee + advisor fee</td></tr>
        <tr><th scope="row">Tax treatment</th><td>Standard 401(k) rules</td><td>Identical — same 401(k) rules</td></tr>
        <tr><th scope="row">Employer match</th><td>Yes</td><td>Yes</td></tr>
        <tr><th scope="row">Rebalancing</th><td>Automatic (inside target-date only)</td><td>Customized, advisor-directed</td></tr>
        <tr><th scope="row">Tax-loss harvesting</th><td>Not applicable inside 401(k)</td><td>Not applicable inside 401(k) (Roth conversions handled separately)</td></tr>
        <tr><th scope="row">Best for</th><td>Small balances, hands-off savers</td><td>Balances $100k+, participants wanting active management</td></tr>
      </tbody>
    </table>
  </div>
</section>
```

### Table B — Major SDBA Platforms Compared
Place **above the "Three Steps to SDBA Success" section**.

```html
<section class="sdba-platforms-table" aria-label="SDBA platform comparison">
  <div class="container">
    <h2>SDBA Platforms We Manage</h2>
    <p>Capital Wealth manages SDBAs across all the major brokerage windows offered by large employer retirement plans and the federal Thrift Savings Plan.</p>
    <table class="sdba-table">
      <thead>
        <tr>
          <th scope="col">Platform</th>
          <th scope="col">Common Employers / Plan Sponsors</th>
          <th scope="col">Typical Annual Fee</th>
          <th scope="col">Fund Universe</th>
        </tr>
      </thead>
      <tbody>
        <tr><th scope="row">Fidelity BrokerageLink</th><td>Large corporate 401(k) plans — tech, healthcare, consulting</td><td>$0 (paid by plan sponsor)</td><td>10,000+ funds and ETFs</td></tr>
        <tr><th scope="row">Schwab Personal Choice Retirement Account (PCRA)</th><td>Mid-to-large 401(k) plans, many 403(b) / 457 plans</td><td>$0 (paid by plan sponsor)</td><td>5,000+ funds and ETFs</td></tr>
        <tr><th scope="row">Empower Brokerage</th><td>Many mid-size 401(k) plans (formerly MassMutual, Great-West, Prudential)</td><td>Varies by plan, often $0–$50/yr</td><td>5,000+ funds and ETFs</td></tr>
        <tr><th scope="row">Vanguard Brokerage Option (VBO)</th><td>Educational, nonprofit, and institutional plans</td><td>$0–$50/yr</td><td>5,000+ funds and ETFs</td></tr>
        <tr><th scope="row">TSP Mutual Fund Window</th><td>Federal civilian employees, uniformed services</td><td>$95 annual + transaction fees</td><td>5,000+ mutual funds</td></tr>
      </tbody>
    </table>
    <p class="table-footnote">Fees and fund counts are typical ranges; your specific plan may differ. Capital Wealth will confirm your plan's exact fee schedule during your free 30-minute consultation.</p>
  </div>
</section>
```

### Table C — When an SDBA Makes Sense (and When It Doesn't)
Place **after the "Three Steps" section**, before the FAQ.

```html
<section class="sdba-fit-table" aria-label="When an SDBA makes sense">
  <div class="container">
    <h2>Is an SDBA Right for You?</h2>
    <p>Not every 401(k) participant benefits from a brokerage window. Here's our honest view on fit.</p>
    <table class="sdba-table">
      <thead>
        <tr>
          <th scope="col">Your Situation</th>
          <th scope="col">SDBA Recommended?</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>$100k+ in your 401(k) and you want active management inside your plan</td><td><strong>✅ Strong fit</strong></td></tr>
        <tr><td>Federal employee wanting beyond the 5 core TSP funds</td><td><strong>✅ Strong fit</strong></td></tr>
        <tr><td>Physician or executive with $250k+ balance and tax-planning complexity</td><td><strong>✅ Strong fit</strong></td></tr>
        <tr><td>Current 401(k) lineup is expensive or limited to 1–2 decent options</td><td><strong>✅ Strong fit</strong></td></tr>
        <tr><td>Under $50k balance with a well-constructed target-date fund</td><td>⚠️ Fees may offset the benefit</td></tr>
        <tr><td>Happy with a target-date fund and no tax or withdrawal complexity</td><td>❌ Probably not needed</td></tr>
        <tr><td>Planning to retire in less than 12 months (rollover may be cleaner)</td><td>❌ Consider a rollover strategy instead</td></tr>
      </tbody>
    </table>
    <p class="table-cta">Not sure where you fall? <a href="/contact/">Schedule a complimentary 30-minute review</a> — we'll give you an honest answer in one call.</p>
  </div>
</section>
```

### CSS for all three tables

```css
.sdba-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.95rem; }
.sdba-table th, .sdba-table td { padding: 0.875rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
.sdba-table thead th { background: var(--color-primary, #0A3161); color: #fff; font-weight: 600; }
.sdba-table tbody th { font-weight: 600; background: #f9fafb; }
.sdba-table tbody tr:hover { background: #fafbfc; }
.table-footnote { font-size: 0.8125rem; color: #666; margin-top: 0.75rem; }
.table-cta { margin-top: 1rem; font-weight: 500; }
.sdba-table a { color: var(--color-accent, #B31942); text-decoration: underline; }
@media (max-width: 640px) {
  .sdba-table { font-size: 0.875rem; }
  .sdba-table th, .sdba-table td { padding: 0.625rem 0.75rem; }
}
```

## ✅ Fix 10 — Add Quick Answer pre-lines to every FAQ

For each of the 18 FAQs (15 existing + 3 new from Fix 8), add a bolded "Quick answer" first line of 25–40 words that an AI can lift verbatim. Then the longer paragraph explanation.

**Pattern:**

```html
<details class="faq-item">
  <summary>Does my retirement plan offer an SDBA?</summary>
  <div class="faq-answer">
    <p class="quick-answer"><strong>Quick answer:</strong> Many mid-to-large employer plans and the federal TSP offer an SDBA — but plans rarely advertise the feature. Check your plan's summary description for "brokerage window" or "brokerage link" to confirm.</p>
    <p>Common SDBA platforms include Fidelity BrokerageLink, Schwab Personal Choice Retirement Account (PCRA), Empower Brokerage, and Vanguard Brokerage Option. A Capital Wealth advisor can confirm your plan's eligibility on a complimentary 30-minute call.</p>
  </div>
</details>
```

**Important:** update the FAQPage JSON-LD `acceptedAnswer.text` to include the Quick Answer sentence at the front — that's the text Google pulls into featured snippets.

```css
.quick-answer { background: #fff8e1; border-left: 3px solid #f59e0b; padding: 0.625rem 0.875rem; margin-bottom: 0.75rem; font-size: 0.95rem; border-radius: 4px; }
```

### Quick Answer drafts for all 18 questions

Antigravity should write 25–40 word Quick Answers following this pattern. Starter drafts:

| # | Question | Quick Answer (draft) |
|---|---|---|
| 1 | What is an SDBA? | A Self-Directed Brokerage Account (SDBA) is a feature inside many 401(k), 403(b), 457, and TSP plans that lets participants invest in thousands of mutual funds and ETFs beyond the plan's standard fund lineup — same tax treatment, same match. |
| 2 | Does my plan offer an SDBA? | Many mid-to-large employer plans and the federal TSP offer SDBAs, but plans rarely advertise them. Check your plan's summary description for "brokerage window" or "brokerage link," or ask Capital Wealth to confirm eligibility. |
| 3 | Who is eligible? | Any participant in a 401(k), 403(b), 457, 401(a), or federal TSP plan that offers an SDBA feature is eligible. Eligibility is plan-specific, not income- or experience-based. |
| 4 | Does my money leave my employer's plan? | No. SDBA assets remain inside your employer-sponsored retirement plan — the brokerage account is simply a sub-account within the same plan, keeping all protections and tax treatment intact. |
| 5 | Different from target-date fund? | A target-date fund is a one-size-fits-all glide path. An SDBA lets a fiduciary advisor build a portfolio tailored to your timeline, risk tolerance, and income plan — actively managed, not set-and-forget. |
| 6 | Can my advisor manage my SDBA? | Yes. A qualified fiduciary advisor like Capital Wealth can be granted limited authority to manage your SDBA while you retain full control of your 401(k) and plan participation. |
| 7 | How much does an SDBA cost? | Typical SDBA platform fees are $0–$100/yr depending on the plan. Capital Wealth's management fee is disclosed upfront during your consultation — no hidden costs, no commissions on trades. |
| 8 | What does 'fiduciary' mean? | A fiduciary advisor is legally required to put your interests ahead of their own at all times. Capital Wealth is a registered fiduciary firm — not a broker-dealer selling products on commission. |
| 9 | How often is the account reviewed? | Your SDBA is actively monitored and rebalanced on an ongoing basis. Capital Wealth reviews allocations quarterly at minimum, with real-time adjustments when markets or your plan require it. |
| 10 | Is my money protected? | Yes. SDBA assets stay inside your employer-sponsored plan and retain the same ERISA protections as the rest of your 401(k). Holdings are also protected by SIPC through the brokerage custodian. |
| 11 | Can I see my SDBA on my 401(k) statement? | Yes. Your SDBA appears as a position on your normal 401(k) or TSP statement. For detailed holdings, you can log in directly to the brokerage platform (Fidelity, Schwab, Empower, Vanguard, TSP). |
| 12 | Can I roll in prior 401(k)s? | Yes, if your current plan allows rollovers (most do). A Capital Wealth advisor can walk through whether rolling in a prior employer 401(k) is the right move for your situation. |
| 13 | What happens if I leave my job? | You typically have four options: leave it in the current plan, roll to new employer's plan, roll to an IRA, or cash out (rarely advisable). Capital Wealth helps you evaluate which fits your full retirement picture. |
| 14 | 2026 contribution limits? | In 2026, employees can contribute up to $24,500; age 50+ can add $8,000 catch-up ($32,500 total); age 60–63 can add $11,250 super catch-up under SECURE 2.0. SDBA contributions count toward these same limits. |
| 15 | Can I stop SDBA management later? | Yes. You can end Capital Wealth's management of your SDBA at any time — assets stay in your 401(k), and you return to self-directing or another advisor without penalty. |
| 16 | Do I still control my 401(k)? | Yes. You retain full control of your 401(k) and plan participation. Capital Wealth manages only the investment selections inside the SDBA — you can pause, modify, or cancel management at any time. |
| 17 | See SDBA account online? | Yes. Your SDBA appears inside your normal 401(k) or TSP portal. You can also log in directly to the underlying brokerage (Fidelity, Schwab, Empower, Vanguard, or TSP) to see detailed holdings. |
| 18 | Which investments are right for me? | You don't need to choose. Your Capital Wealth fiduciary advisor builds and maintains the portfolio based on your age, timeline, risk tolerance, and retirement plan — no DIY fund picking required. |

## ✅ Fix 11 — Add a sticky TOC / jump-link navigation

Currently zero jump links. Add a sticky side-rail or top-bar TOC linked to H2 anchors.

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

Each target section needs a matching `id=""` on the H2.

```css
.sdba-toc { position: sticky; top: 80px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.25rem; font-size: 0.9rem; }
.sdba-toc .toc-label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem; color: #666; margin: 0 0 0.5rem; font-weight: 600; }
.sdba-toc ol { margin: 0; padding-left: 1.25rem; }
.sdba-toc li { margin: 0.375rem 0; }
.sdba-toc a { color: var(--color-primary, #0A3161); text-decoration: none; }
.sdba-toc a:hover { text-decoration: underline; }
@media (max-width: 1024px) { .sdba-toc { position: static; margin: 1.5rem 0; } }
```

## ✅ Fix 12 — Fix the heading hierarchy (remove mega-menu H3/H4s)

**Problem:** the mega-menu/nav uses semantic `<h3>` and `<h4>` tags that appear in the HTML **before** the page H1. This breaks the document outline for LLMs and screen readers.

**Action:**
1. Change all mega-menu category labels from `<h3>` to `<div class="menu-heading" role="heading" aria-level="3">` — or just plain `<div>` / `<span>` with styling. Preferred: strip the semantic heading role entirely since these aren't document outline headings, they're navigation labels.
2. Same for `<h4>` sub-labels inside the nav — convert to `<div class="menu-sub-heading">`.
3. Verify page outline after change: a clean outline tool (e.g., `headingsMap` browser extension or [w3c validator](https://validator.w3.org/nu/)) should show a clean `H1 → H2 → H3` structure with no stray H3/H4 above the H1.

---

# 📅 WEEKS 3–4 — Content Depth Expansion

Goal: take the page from ~2,200 words (after Week 1–2) to ~4,000 words with platform-specific, audience-specific, and fee-transparent content. This is what pushes the page into page-one rankings for commercial-intent queries.

## ✅ Fix 13 — Five platform-specific sub-sections (200 words each)

Place these **immediately after the "Platforms We Manage" comparison table (Table B)**. Each block should internally link to a future pillar page (see Month 2).

```html
<section class="sdba-platforms-detail" id="platform-details">
  <div class="container">
    <h2>Platform-Specific SDBA Management</h2>

    <!-- Fidelity BrokerageLink -->
    <article class="platform-block" id="fidelity-brokeragelink">
      <h3>Fidelity BrokerageLink</h3>
      <p>Fidelity BrokerageLink is the brokerage window found inside most large-corporate 401(k) plans administered by Fidelity — including many Fortune 500 employers in tech, healthcare, and consulting. It gives participants access to more than 10,000 mutual funds and ETFs beyond the plan's core lineup, with no additional platform fee charged to the participant in most plans.</p>
      <p>Capital Wealth manages BrokerageLink assets under a limited trading authorization. We build a diversified portfolio using low-cost index funds and ETFs, rebalance on a disciplined schedule, and coordinate the strategy with your IRA, Roth, and taxable accounts held elsewhere.</p>
      <p><a href="/services/sdba/fidelity-brokeragelink-guide/">Full guide to Fidelity BrokerageLink management →</a></p>
    </article>

    <!-- Schwab PCRA -->
    <article class="platform-block" id="schwab-pcra">
      <h3>Schwab Personal Choice Retirement Account (PCRA)</h3>
      <p>The Schwab PCRA is the brokerage window offered in 401(k), 403(b), and 457 plans administered by Schwab. PCRA accounts can access 5,000+ mutual funds and ETFs plus individual securities where the plan permits. Most plans charge no additional fee for PCRA, though transaction fees may apply on some fund families.</p>
      <p>Capital Wealth is an experienced PCRA manager. We can be appointed as the advisor of record on a PCRA account, receive quarterly statements, and execute rebalancing trades under a limited trading authorization — leaving your 401(k) plan enrollment, contribution rate, and employer match untouched.</p>
      <p><a href="/services/sdba/schwab-pcra-guide/">Full guide to Schwab PCRA management →</a></p>
    </article>

    <!-- Empower -->
    <article class="platform-block" id="empower-brokerage">
      <h3>Empower Brokerage</h3>
      <p>Empower Brokerage (formerly offered through MassMutual, Great-West, and Prudential plans before the Empower rebrand) is the brokerage window for many mid-size 401(k) and 403(b) plans. Participant fees vary by plan — typically $0–$50 annually — and the fund universe covers 5,000+ mutual funds and ETFs.</p>
      <p>Capital Wealth manages Empower SDBA accounts for corporate, nonprofit, and healthcare participants, coordinating the portfolio with your broader retirement income plan.</p>
      <p><a href="/services/sdba/empower-brokerage-guide/">Full guide to Empower Brokerage management →</a></p>
    </article>

    <!-- Vanguard -->
    <article class="platform-block" id="vanguard-brokerage-option">
      <h3>Vanguard Brokerage Option (VBO)</h3>
      <p>The Vanguard Brokerage Option is commonly offered in educational (403(b)), nonprofit, and institutional retirement plans administered by Vanguard. VBO provides access to 5,000+ mutual funds and ETFs, including many non-Vanguard funds. Participant fees are typically $0–$50 annually.</p>
      <p>Capital Wealth manages VBO accounts under a limited trading authorization, with particular attention to the low-cost fund lineups common in university and nonprofit retirement plans.</p>
      <p><a href="/services/sdba/vanguard-brokerage-option-guide/">Full guide to Vanguard Brokerage Option management →</a></p>
    </article>

    <!-- TSP MFW -->
    <article class="platform-block" id="tsp-mutual-fund-window">
      <h3>TSP Mutual Fund Window</h3>
      <p>The Thrift Savings Plan (TSP) Mutual Fund Window — launched June 2022 — is the brokerage window available to federal civilian employees and uniformed services members. It opens access to roughly 5,000 mutual funds beyond the five core TSP funds (G, F, C, S, I) and the lifecycle L Funds. The TSP MFW carries an annual fee of $95 plus transaction costs.</p>
      <p>Capital Wealth is a specialist in federal retirement planning. Our TSP Mutual Fund Window management coordinates with your FERS benefits, Social Security strategy, and FEHB/FEGLI decisions — the full federal retirement picture, not just fund selection.</p>
      <p><a href="/services/federal-benefits/tsp-mutual-fund-window/">Full guide to TSP Mutual Fund Window management →</a></p>
    </article>

  </div>
</section>
```

```css
.platform-block { padding: 1.5rem 0; border-bottom: 1px solid #e5e7eb; }
.platform-block:last-child { border-bottom: 0; }
.platform-block h3 { color: var(--color-primary, #0A3161); margin: 0 0 0.75rem; }
.platform-block a { color: var(--color-accent, #B31942); font-weight: 500; }
```

## ✅ Fix 14 — "Who is this for?" audience segmentation

Place **above the "Is an SDBA Right for You?" table (Table C)**.

```html
<section class="sdba-audience" aria-label="SDBA audience fit">
  <div class="container">
    <h2>Who We Manage SDBAs For</h2>
    <div class="audience-grid">
      <article class="audience-card">
        <h3>Corporate 401(k) Participants</h3>
        <p>Tech, healthcare, consulting, and Fortune 500 employees with $100k+ in their 401(k) who want active management without rolling to an IRA. Most have access to Fidelity BrokerageLink or Schwab PCRA inside their plan.</p>
      </article>
      <article class="audience-card">
        <h3>Federal Employees (TSP Mutual Fund Window)</h3>
        <p>FERS and CSRS participants who want exposure beyond the five core TSP funds. We coordinate TSP Mutual Fund Window management with your FERS supplement, Social Security, and FEHB strategy. <a href="/services/federal-benefits/tsp-mutual-fund-window/">Learn more about TSP management →</a></p>
      </article>
      <article class="audience-card">
        <h3>Physicians &amp; 403(b) Participants</h3>
        <p>Hospital and university physicians with high 403(b) balances often have BrokerageLink, Schwab PCRA, or VBO access. We manage SDBA alongside your backdoor Roth, HSA, and taxable portfolio for tax-efficient growth.</p>
      </article>
      <article class="audience-card">
        <h3>Executives with Concentrated Company Stock</h3>
        <p>If a large portion of your 401(k) is in employer stock, an SDBA lets you diversify without leaving the plan — a powerful risk-management tool pre-retirement.</p>
      </article>
    </div>
  </div>
</section>
```

```css
.audience-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; margin-top: 1.5rem; }
.audience-card { padding: 1.5rem; background: #f9fafb; border-radius: 8px; border-top: 3px solid var(--color-primary, #0A3161); }
.audience-card h3 { margin: 0 0 0.625rem; font-size: 1.0625rem; color: var(--color-primary, #0A3161); }
.audience-card p { margin: 0; font-size: 0.9375rem; line-height: 1.55; }
@media (max-width: 720px) { .audience-grid { grid-template-columns: 1fr; } }
```

## ✅ Fix 15 — Fee transparency block

Place **above the FAQ section**. Money keywords require money transparency to rank.

```html
<section class="sdba-fees" id="sdba-fees">
  <div class="container">
    <h2>How Much Does SDBA Management Cost?</h2>
    <p>Capital Wealth believes fee transparency is a foundational fiduciary obligation. Here's exactly how SDBA management is priced — no hidden commissions, no trading kickbacks, no undisclosed expenses.</p>
    <table class="sdba-table">
      <thead>
        <tr>
          <th scope="col">Fee Component</th>
          <th scope="col">Typical Range</th>
          <th scope="col">Who Charges It</th>
        </tr>
      </thead>
      <tbody>
        <tr><th scope="row">Platform SDBA fee</th><td>$0 – $100/yr</td><td>Your 401(k) or TSP plan sponsor</td></tr>
        <tr><th scope="row">Underlying fund expense ratios</th><td>~0.03% – 0.50%/yr</td><td>The fund manager (Vanguard, Fidelity, iShares, etc.)</td></tr>
        <tr><th scope="row">Capital Wealth management fee</th><td>Disclosed in advance — contact us</td><td>Capital Wealth (billed quarterly, deducted from the account)</td></tr>
        <tr><th scope="row">Trading commissions</th><td>$0 on most ETFs and mutual funds</td><td>Brokerage platform — varies by fund family</td></tr>
      </tbody>
    </table>
    <p class="table-footnote">Capital Wealth never accepts commissions, sales loads, or 12b-1 fees on any fund we purchase for you. Our only compensation is the advisory fee disclosed upfront in your engagement agreement.</p>
  </div>
</section>
```

## ✅ Fix 16 — Add 2 case-study snippets (no names, numbers only)

Place **above the audience segmentation block** (or anywhere in the middle third of the page). Work with Mike to confirm the specifics are representative of actual CW clients before publishing.

```html
<section class="sdba-cases" aria-label="Representative SDBA case studies">
  <div class="container">
    <h2>What SDBA Management Looks Like in Practice</h2>
    <p class="section-intro">Representative examples based on typical Capital Wealth clients. Identifying details have been changed; figures are illustrative of the kind of outcomes we work toward for participants in similar situations.</p>

    <article class="case-card">
      <p class="case-header">Physician, age 52, Fidelity BrokerageLink</p>
      <p>A physician at a large hospital system had $640,000 in a BrokerageLink default target-date fund with a 0.72% expense ratio. We rebalanced to a diversified portfolio of low-cost index funds at a 0.18% blended expense ratio, reducing annual drag by roughly $3,450/yr and aligning the allocation to a 13-year time horizon. Capital Wealth also coordinated the SDBA allocation with the physician's backdoor Roth IRA and taxable portfolio for tax-efficient placement.</p>
    </article>

    <article class="case-card">
      <p class="case-header">Federal employee, age 58, TSP Mutual Fund Window</p>
      <p>A GS-14 federal employee with $580,000 in the TSP L-2030 fund wanted more control heading into retirement. We opened the TSP Mutual Fund Window and built a diversified mutual fund portfolio alongside the five core TSP funds — keeping costs below 0.25% blended. Capital Wealth also built out the FERS supplement, FEHB, and Social Security claiming strategy so the TSP allocation actually fit the broader retirement income plan.</p>
    </article>
  </div>
</section>
```

```css
.case-card { padding: 1.25rem 1.5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; margin: 1rem 0; }
.case-header { font-weight: 600; color: var(--color-primary, #0A3161); margin: 0 0 0.5rem; font-size: 0.9375rem; }
.case-card p { line-height: 1.6; }
.section-intro { color: #555; font-style: italic; font-size: 0.9375rem; }
```

**Compliance check:** confirm with Mike/compliance that the specific figures above are representative. If CW has real case studies (with approved disclaimers), substitute them.

## ✅ Fix 17 — Conservative statistics block (fiduciary-posture version)

Place **before the FAQ** or as a secondary stat panel. Keep everything aligned with the 1%-advisor-value / 7%-S&P rule.

```html
<section class="sdba-stats" aria-label="SDBA statistics">
  <div class="container">
    <h2>SDBAs by the Numbers</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <p class="stat-big">~40%</p>
        <p class="stat-desc">of large 401(k) plans offer a Self-Directed Brokerage Account feature (PSCA Annual Survey, 2024).</p>
      </div>
      <div class="stat-item">
        <p class="stat-big">5,000+</p>
        <p class="stat-desc">mutual funds and ETFs typically accessible through major SDBA platforms — vs. 15–25 in a standard 401(k) lineup.</p>
      </div>
      <div class="stat-item">
        <p class="stat-big">~$95/yr</p>
        <p class="stat-desc">annual fee for the federal TSP Mutual Fund Window, plus transaction costs.</p>
      </div>
      <div class="stat-item">
        <p class="stat-big">$24,500</p>
        <p class="stat-desc">2026 employee contribution limit for 401(k)/TSP (plus catch-up contributions for ages 50+).</p>
      </div>
    </div>
    <p class="stats-footnote">Source: Plan Sponsor Council of America (PSCA) Annual Survey; IRS Notice 2025-XX; individual plan documents. Verify specific figures against current IRS publications.</p>
  </div>
</section>
```

```css
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin: 1.5rem 0; }
.stat-item { text-align: center; padding: 1.25rem; background: #fff; border-radius: 8px; border: 1px solid #e5e7eb; }
.stat-big { font-size: 1.875rem; font-weight: 700; color: var(--color-accent, #B31942); margin: 0 0 0.5rem; font-variant-numeric: tabular-nums; }
.stat-desc { font-size: 0.875rem; line-height: 1.45; margin: 0; color: #333; }
.stats-footnote { font-size: 0.75rem; color: #666; margin-top: 0.75rem; }
@media (max-width: 720px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
```

**Verify before publish:** PSCA 40% figure — confirm in the most recent survey; adjust to the actual current-year figure.

---

# 📅 MONTH 2 — Cluster Authority & Rich Media

Goal: build the surrounding content ecosystem so the `/services/sdba/` page becomes the hub of a tight topical cluster. Internal links flow inward, external authority accrues to the hub.

## ✅ Fix 18 — Build 6 cluster pages

Each 1,500–2,500 words. Each should use the same schema conventions established in Week 1 (WebPage + Article + speakable + author).

| Path | Primary Keyword | Focus |
|---|---|---|
| `/services/sdba/fidelity-brokeragelink-guide/` | "Fidelity BrokerageLink management" | Deep guide — eligibility, funds, fees, CW process. Link to Fortune 500 employers known to offer it. |
| `/services/sdba/schwab-pcra-guide/` | "Schwab PCRA management" | Same structure — PCRA specifics. |
| `/services/sdba/empower-brokerage-guide/` | "Empower brokerage management" | Same structure — Empower specifics. |
| `/services/sdba/vanguard-brokerage-option-guide/` | "Vanguard Brokerage Option management" | Same structure — nonprofit/educational angle. |
| `/services/sdba/vs-target-date-funds/` | "SDBA vs target-date fund" | Comparison page — tables, scenarios, when to switch. |
| `/services/sdba/sdba-fees-explained/` | "SDBA fees explained" | Money-intent page — full fee breakdown across platforms. |

**Each cluster page should:**
- Link UP to `/services/sdba/` with the anchor text "SDBA management"
- Link SIDEWAYS to 2–3 other cluster pages
- Link DOWN to the contact/consultation page
- Use the same author byline + review attribution as the hub
- Carry its own WebPage + Article + FAQPage schema
- Each cluster page's FAQ should have 5–10 platform-specific Qs

## ✅ Fix 19 — Update the SDBA hub page to link to all 6 cluster pages

In Fix 13 (platform sub-sections) the links are already drafted. After cluster pages are live:
1. Update the "Full guide to X →" links at the bottom of each platform block.
2. Add a "Deep dives" section above the FAQ linking to the 2 comparison pages (vs target-date, fees explained).
3. Update the global site footer or services nav to include the cluster pages.

## ✅ Fix 20 — Add a 2-minute explainer video + VideoObject schema

Record Mike Stevens on camera (or use a simple Loom-style screen recording with voiceover). ~2 minutes covering:
1. What is an SDBA? (30s)
2. Who is it for? (30s)
3. What does Capital Wealth do with it? (45s)
4. How to get started? (15s)

Upload to YouTube (for discovery + backlink authority) AND self-host or embed. Place **below the H1/definition block**, above the stat comparison.

```html
<section class="sdba-video" aria-label="SDBA explainer video">
  <div class="container">
    <h2>What is an SDBA? Watch a 2-Minute Overview</h2>
    <div class="video-wrapper">
      <iframe src="https://www.youtube.com/embed/[VIDEO_ID]?rel=0&modestbranding=1"
              title="What is a Self-Directed Brokerage Account? — Capital Wealth"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowfullscreen></iframe>
    </div>
  </div>
</section>
```

```css
.video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; max-width: 900px; margin: 0 auto; }
.video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
```

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "What is a Self-Directed Brokerage Account (SDBA)?",
  "description": "A 2-minute overview from Mike Stevens, CFP® of Capital Wealth — what an SDBA is, who it's for, and how professional management works inside a 401(k) or TSP.",
  "thumbnailUrl": "https://www.capitalwealth.com/assets/images/video/sdba-thumbnail-1280x720.jpg",
  "uploadDate": "2026-05-XX",
  "duration": "PT2M",
  "contentUrl": "https://www.youtube.com/watch?v=[VIDEO_ID]",
  "embedUrl": "https://www.youtube.com/embed/[VIDEO_ID]",
  "publisher": { "@id": "https://www.capitalwealth.com/#organization" },
  "author": { "@id": "https://www.capitalwealth.com/about/#mike-stevens" }
}
</script>
```

## ✅ Fix 21 — Core Web Vitals audit + fixes

Run after Week 1–4 content is live, before investing in paid search traffic.

Checklist:
1. **PageSpeed Insights / Lighthouse** — run against the live production URL, both mobile and desktop.
2. **Target scores:** LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.
3. **Common SDBA-page-specific issues likely to surface:**
   - Mountain Couple hero image → ensure `<img loading="eager" fetchpriority="high">` only on the LCP image; lazy-load everything below the fold.
   - Convert hero image from JPG/PNG to WebP if not already (looks like it already is — `.webp`).
   - Preload web fonts with `<link rel="preload" as="font" type="font/woff2" crossorigin>`.
   - Defer GTM/analytics scripts until after interactive.
   - Audit third-party scripts — KSL/media logo bar should use simple `<img>` tags, not iframes.
4. **Measure CLS specifically** for the new tables and sticky TOC — they're CLS-prone if image dimensions aren't reserved.
5. **Validate all new schema** with [Google Rich Results Test](https://search.google.com/test/rich-results) and [Schema.org validator](https://validator.schema.org/).

## ✅ Fix 22 — SDBA Value Calculator (Phase 2 tool)

This is the biggest lead-capture opportunity to come out of this audit. Spec:

**Page:** `/services/sdba/sdba-calculator/` (dedicated landing page, linked from hub)

**Inputs:**
- Current age
- Target retirement age
- Current 401(k)/TSP balance
- Annual contribution
- Employer match %
- Current expense ratio of holdings (with sensible default of 0.50%)

**Assumptions (per CW conservative policy):**
- Baseline return: **7% annual** (S&P 500 conservative)
- SDBA-managed scenario: **7% + ~1% advisor value = ~8% annual**
- Inflation: 2.5% (optional display)
- All projections disclosed as hypothetical, not guaranteed

**Outputs:**
- Projected balance at retirement (self-managed vs SDBA-managed)
- Total expense drag avoided over career
- CTA: "Book a free 30-min review with Capital Wealth"

**Tech stack note for Antigravity:** implement client-side (Vanilla JS or Alpine.js) — no server dependency. Add `SoftwareApplication` or `WebApplication` schema. Similar pattern to the planned FERS calculator (which is the #1 SEO priority per strategy doc).

---

# 🗺️ Full Roadmap Summary

| Phase | Fixes | Timeline | Primary Win |
|---|---|---|---|
| **Week 1** | Fixes 1–8 | 3–5 business days | H1 targeting + schema + E-E-A-T + conservative stat frame |
| **Week 2** | Fixes 9–12 | 5–7 business days | AEO citation layer (tables, quick answers, TOC) |
| **Weeks 3–4** | Fixes 13–17 | 2 weeks | Content depth (platforms, audiences, fees, case studies) |
| **Month 2** | Fixes 18–22 | 3–4 weeks | Cluster authority + video + CWV + calculator |

**Total word count trajectory:**
- Baseline: 1,787 words
- After Week 1: ~2,300
- After Week 2: ~2,800
- After Week 3–4: ~4,200
- After Month 2 (hub only): ~4,500 + 6 cluster pages × 2,000 = ~16,500 cluster total

**Schema trajectory:**
- Baseline: 4 blocks (FinancialService, BreadcrumbList, FAQPage, Review)
- After Week 1: 7 blocks (+ WebPage+Article, Service, HowTo)
- After Month 2: 9 blocks (+ VideoObject, SoftwareApplication for calculator)

**Compliance guardrails (repeat for every item):**
- Never cite outperformance statistics (no 3.32% claims)
- Frame advisor value as ~1% on a ~7% conservative baseline
- All projections labeled as hypothetical with "past performance does not guarantee future results"
- Every claim about platform fees, IRS limits, or PSCA survey data must be verified against current source before publish

**PR strategy for Antigravity:**
- **PR 1:** Week 1 fixes (1–8) — one integrated PR
- **PR 2:** Week 2 fixes (9–12) — one PR
- **PR 3:** Weeks 3–4 fixes (13–17) — one PR
- **PR 4+:** Each Month 2 cluster page is its own PR; video embed + CWV fixes + calculator are separate PRs

**Metrics to track:**
- Google Search Console: impressions + average position for "SDBA management," "Fidelity BrokerageLink advisor," "Schwab PCRA management," "TSP Mutual Fund Window"
- Rich result eligibility: FAQ, HowTo, Article, Video — verify in GSC Enhancements tab
- AI Overview citations: manually check quarterly (ChatGPT, Perplexity, Gemini, Google SGE)
- Consultation bookings tagged to `/services/sdba/` as source in analytics

---

When this is all shipped, the SDBA hub page goes from "competes with PowerMy401k on a level footing" to **"the definitive fiduciary SDBA management resource on the open web"** — with defensible compliance, stronger E-E-A-T, and a topical cluster that reinforces hub authority. That's page-one-and-cite-worthy for the full SDBA keyword set.
