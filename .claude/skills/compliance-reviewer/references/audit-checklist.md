# Audit Checklist — run this on every page/email/ad

Work top to bottom. For each hit, capture file:line, the text, the rule, a severity, and a fix.

## 1. Claims about the firm itself
- [ ] Described as **fee-based fiduciary** (NOT "fee-only").
- [ ] No "we don't sell products / no commissions / no proprietary products / no incentive to sell." (False — CWA Insurance Services, LLC.)
- [ ] Registration stated **accurately and identically** everywhere (SEC *or* Utah state — see SKILL.md open item; any mismatch = Critical).
- [ ] "Fiduciary" used truthfully; if insurance sales create a conflict, it isn't claimed away with absolutes ("always," "100% conflict-free").
- [ ] No claim of SEC/state/government approval or endorsement. "Registration does not imply a certain level of skill or training" present where registration is mentioned.

## 2. Performance, returns, and outcomes
- [ ] No guaranteed or implied returns ("grow your money," "beat the market," "X% returns," "six figures over 20 years").
- [ ] No promise of specific personal outcomes ("retire by 55," "never run out of money," "protect your principal").
- [ ] Any performance/historical figure is fair, balanced, substantiable, and shown net where applicable; no cherry-picked winners.
- [ ] Loss-of-principal / "past performance is not a guarantee of future results" risk language present near any investment benefit.
- [ ] Hypotheticals/case studies labeled illustrative, "not actual client results," "individual results vary."

## 3. Insurance & annuity content (CWA Insurance side)
- [ ] Guarantees attributed to the **issuing insurance carrier** and its **claims-paying ability** — never to Capital Wealth.
- [ ] Material limitations disclosed where the product is promoted: surrender charges, fees, withdrawal limits, that it's an insurance product.
- [ ] "Safe," "guaranteed income," "protected," "tax-free" not used unqualified.
- [ ] No disparagement of other products, carriers, or "Wall Street."
- [ ] Insurance content is identifiable as insurance — not disguised as neutral education to set up a sale.

## 4. Testimonials, reviews, ratings, endorsements
- [ ] Each testimonial/review carries clear & prominent disclosure: (a) is/ is not a client, (b) compensated or not, (c) material conflicts.
- [ ] No cherry-picking only glowing reviews in a misleading way.
- [ ] Third-party ratings/badges (BBB, FINRA BrokerCheck, awards) used accurately, with criteria/source where required.

## 5. Federal-employee content (high scrutiny)
- [ ] Disclaimer present: **not affiliated with or endorsed by** the U.S. Government, SSA, OPM, TSP, or any federal agency.
- [ ] "Official Government Registered Contractor," CAGE/UEI, government seals/flags don't imply endorsement or that the firm is a government program. (SAM.gov registration is true but must not read as an endorsement — flag as High if it could.)
- [ ] FERS/TSP/FEHB facts are accurate and not promissory.

## 6. Required disclosures present (see required-disclosures.md)
- [ ] Advisory disclaimer (Capital Wealth, LLC + CWA Insurance Services, LLC).
- [ ] Risk / past-performance disclaimer.
- [ ] Federal disclaimer on federal pages.
- [ ] Email only: unsubscribe link + physical mailing address.
- [ ] Tax/legal: "does not provide tax or legal advice; consult your own professional."

## 7. Language sweep
- [ ] Run the forbidden-phrases list (see forbidden-phrases.md). Soften "will" → "may/can/designed to help."
- [ ] No unsubstantiated superlatives ("best," "#1," "top-rated," "leading") without a cited, current basis.
- [ ] No urgency/fear that misleads ("act now or lose your benefits").

## Output format for the report
```
### [SEVERITY] short title
- File: src/path/file.njk:123
- Found: "<exact offending text>"
- Rule: SEC Marketing Rule general prohibition #1 (untrue/misleading) / NAIC Model #570 / Missing required disclosure
- Fix: "<concrete replacement text or action>"
```
