# Federal Calculator Hub + Pillar Re-Architecture Plan

_Created 2026-05-26. Goal: concentrate topical authority in the federal cluster so the flagship FERS calculator (and its siblings) climb from 8-12 into the top 3, and build new link-magnet calculators that earn links and rank in their own right._

---

## Current state (what we have)

**The pillar is already good.** `/services/federal-benefits/` is a real hub page: hero, "Your Benefits, Decoded" bento, deep-dive cards, a featured calculator block, and "Federal Benefits Deep Dives" linking all ~12 spokes (FERS retirement, TSP, FEGLI, FEHB, Social Security, FERS supplement, the calculator, federal retirement taxes, the checklist, etc.).

**But the calculators are fragmented across two homes — this is the core problem:**
- **Flagship (bespoke):** `/services/federal-benefits/fers-calculator/` — the FERS pension calculator ranking 8-12.
- **Three more (templated from `src/_data/calculator_tools.json`, under `/tools/`):**
  - `/tools/military-buyback-calculator/`
  - `/tools/sick-leave-conversion-calculator/`
  - `/tools/fers-multiplier-decision-tool/`

These four tools cover overlapping topics (sick leave, the 1.1% multiplier, service credit) **but do not link to each other.** Authority and user journeys are split across two URL trees, and Google sees four isolated pages instead of one authoritative calculator suite. Fixing this is the single biggest structural lever.

---

## The re-architecture

### Move 1 — Build a Calculator Hub index (new ranking surface + link target)
Create `/services/federal-benefits/calculators/` — a hub page that lists **every** federal calculator with a one-line description and a clear CTA into each. Target keywords: "federal retirement calculators," "FERS calculators," "federal employee calculators."
- It becomes the natural thing other sites link to ("here's a free suite of federal retirement calculators").
- It funnels authority down to each tool and up to the pillar.
- Add it to the pillar's featured block and to the site header's federal menu.

### Move 2 — Cross-link the four existing calculators (fast win, do first)
- The flagship FERS calculator's **sick-leave** paragraph → link to `/tools/sick-leave-conversion-calculator/`.
- Its **multiplier** section → link to `/tools/fers-multiplier-decision-tool/`.
- Its **military buyback** checkbox/section → link to `/tools/military-buyback-calculator/`.
- Each `/tools/` calculator → link back up to the flagship FERS calculator and to the new hub.
- Decision on URLs: **keep the existing `/tools/` URLs** (no migration risk) but bind them into the cluster with the hub + cross-links. Only consider 301-ing them under `/services/federal-benefits/calculators/` later if we want path consistency — not worth the risk now.

### Move 3 — Build new link-magnet calculators
Calculators are the most linkable, most rankable assets we can make. Priority order (impact × effort × news-timeliness):
1. **FERS Supplement Calculator** — high search volume, we already have the supplement content; pairs with the flagship.
2. **VERA / VSIP Early-Out Comparison** — rides the *current* news cycle and the May 28 webinar; "should I take the buyout" is being searched right now.
3. **TSP Growth & Withdrawal Calculator** — huge evergreen volume; second leg of FERS.
4. **Social Security WEP/GPO Calculator** — the 2025 repeal (Social Security Fairness Act) is a live story; very few good tools exist = ranking opportunity.
5. **High-3 Calculator** — simple, supports the flagship, captures long-tail.

Each new calculator: bespoke page in the federal cluster (match the flagship's depth + `WebApplication`/`HowTo`/`FAQPage` schema), listed on the hub, cross-linked to the flagship and relevant spoke + blog posts.

### Move 4 — Pillar reinforcement
- Every spoke page links **up** to `/services/federal-benefits/` with descriptive anchor text and **across** to the calculator hub.
- The pillar gets a prominent "Federal Retirement Calculators" section linking the hub.
- Confirm one clear `<h1>` on the pillar targeting the head term (e.g., "Federal Employee Retirement Planning") — current H1 is brand-styled ("Bridging the Federal Benefits Gap"); add/adjust so the head keyword is present in the H1 or an early H2.

### Move 5 — Webinar → evergreen content pipeline (systematize it)
You proved the model with `/blog/fers-pension-explained/` (the May 14 FERS webinar replay). Make it repeatable for every webinar (VERA/VSIP/RIF May 28 next):
1. **Replay page** (`VideoObject` + `Article` + `FAQPage` schema) — already the pattern.
2. **3-5 blog posts** mining the transcript for long-tail queries, each linking to the relevant calculator + pillar.
3. **Short clips** to YouTube (your preferred channel) → embed back, link in show notes.
4. **Interlink everything** to the calculator hub and pillar.
This turns each webinar into a durable cluster of ranking pages instead of a one-time event.

---

## Internal-linking model (the mesh)

```
                 /services/federal-benefits/   ← PILLAR (head term)
                   ↑    ↑          ↑     ↑
        spokes ────┘    │          │     └──── blog cluster
   (FERS, TSP, FEHB,    │          │          (fers-pension-explained,
    FEGLI, SS, taxes)   │          │           fers-high-3, multiplier,
                        │          │           pension-calc-guide, …)
                        ↓          ↓
            /…/calculators/  ← CALCULATOR HUB
              ↑  ↑  ↑  ↑  ↑
   flagship FERS · supplement · TSP · VERA/VSIP · WEP/GPO · high-3 ·
   military buyback · sick leave · multiplier   (all cross-linked)
```
Rule: every calculator links to the hub + flagship + its topic spoke + its best blog post. Every spoke links to the pillar + the most relevant calculator. Vary anchor text (avoid 19 identical "FERS calculator" anchors → mix "estimate your FERS pension," "FERS annuity calculator," etc.).

---

## Sequencing

| Phase | Work | Why first |
|-------|------|-----------|
| **A (this week)** | Move 2 — cross-link the 4 existing calculators. Move 4 — pillar H1/H2 keyword check + hub link placement. | Pure upside, hours of work, no new pages, tightens the cluster immediately. |
| **B (next)** | Move 1 — build the Calculator Hub index. | Gives us the link target + ranking surface; needed before promoting calculators externally. |
| **C** | Move 3 — ship calculators in priority order (FERS Supplement → VERA/VSIP → TSP → WEP/GPO → High-3). | Each is a new ranking surface + link magnet; VERA/VSIP + WEP/GPO are time-sensitive. |
| **D (ongoing)** | Move 5 — run every webinar through the evergreen pipeline. | Compounding content engine. |

Pair Phase B/C launches with the off-page playbook: each new calculator/hub is what the PR pitches and KSL article point at.

> All new calculator pages are client-facing → run through the `compliance-reviewer` skill (educational-only framing, no guarantees, federal non-affiliation + advisory/CWA disclosures) before publish.
