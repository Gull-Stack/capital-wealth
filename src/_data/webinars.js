// Federal Retirement Webinar Series — source of truth for the /webinars/ hub.
//
// Cadence: every other Thursday (leadership decision, 2026-05-21). Model is
// "per-topic, built as you go" — each LIVE webinar gets its own Zoom webinar +
// Salesforce campaign, and the evergreen registration page (/l/federal-benefits-webinar/)
// is re-pointed to whichever one is "next."
//
// Topics + order reflect the 2026-05-21 working session with Ann Werts:
//   - FEHB (#11) and Medicare (#12) are scheduled for NOVEMBER — Ann: most feds
//     won't engage until Open Season (2nd Monday Nov → 2nd Monday Dec). She wants
//     2–3 webinars that month, so we may add a 3rd / go weekly in November.
//   - Order follows Ann's build sequence: pension → VERA/VSIP/RIF → benefits →
//     supplement & Social Security → TSP block → FEGLI → retirement process.
//   - Sep 17 → Nov 12 is an intentional pre-Open-Season lull; October is open
//     (slot a repeat or a bonus topic like Survivor Benefits if we want it).
//
// status:
//   "past"      — recorded; replay available (renders in "Watch past webinars")
//   "next"      — live and open for registration now (the featured event)
//   "scheduled" — on the calendar; registration opens when the Zoom is built

module.exports = {
  series: {
    presenter: "Ann Werts",
    presenterTitle: "Federal Benefits Specialist · 25+ years",
    cadence: "Every other Thursday",
    timeMt: "5:00 – 6:00 PM Mountain",
    // The evergreen "next webinar" registration page (re-pointed each cycle).
    registerUrl: "/l/federal-benefits-webinar/",
    // Soft CTA when someone wants to talk sooner than the next session.
    callUrl: "/start/",
    datesDisclaimer: "Dates for upcoming sessions are subject to change."
  },

  episodes: [
    {
      slug: "fers-pension",
      title: "FERS Pension Explained",
      tag: "FERS",
      blurb: "A plain-English overview of the FERS pension — eligibility, the best days to retire, and how the annuity is calculated — so you can maximize the value of your pension.",
      date: "2026-05-14", mon: "MAY", day: "14", dateDisplay: "Thursday, May 14, 2026",
      status: "past",
      replayUrl: "/blog/fers-pension-explained/",
      youtubeId: "Bd-eW4XrztA"
    },
    {
      slug: "vera-vsip-rif",
      title: "VERA, VSIP, RIF & Beyond",
      tag: "Early-Out Offers",
      blurb: "With early-retirement and buyout offers still coming from agencies, being prepared matters more than ever. Learn how to read your numbers — VERA early retirement, VSIP buyouts, and a Reduction in Force — and make sound choices if an offer comes your way.",
      date: "2026-05-28", mon: "MAY", day: "28", dateDisplay: "Thursday, May 28, 2026",
      timeMt: "5:00 – 6:00 PM Mountain",
      status: "past",
      campaignId: "701VS00000fQz8OYAS",
      icsUrl: "/assets/webinars/federal-benefits-webinar-2026-05-28.ics"
      // TODO: add replayUrl + youtubeId once the May 28 recording is published.
      // Until then it shows "Replay coming soon" and is held out of the replay grid.
    },
    {
      slug: "fers-benefits",
      title: "FERS Benefits: The Full Picture",
      tag: "FERS",
      blurb: "An overview of the entire FERS system — pension, survivor benefits, the FERS Supplement, and TSP basics — woven into one useable retirement strategy.",
      date: "2026-06-11", mon: "JUN", day: "11", dateDisplay: "Thursday, June 11, 2026",
      timeMt: "5:00 – 6:00 PM Mountain",
      status: "next",
      registerUrl: "/l/federal-benefits-webinar/",
      icsUrl: "/assets/webinars/federal-benefits-webinar-2026-06-11.ics"
    },
    {
      slug: "fers-supplement-social-security",
      title: "FERS Supplement & Social Security",
      tag: "Income",
      blurb: "How the FERS Supplement is calculated and when it ends at 62, plus one of retirement's most important decisions — when to begin Social Security. Strategies for single and married couples, and managing the tax consequences.",
      date: "2026-06-25", mon: "JUN", day: "25", dateDisplay: "Thursday, June 25, 2026",
      status: "scheduled"
    },
    {
      slug: "tsp-101",
      title: "TSP 101: Thrift Savings Plan Basics",
      tag: "TSP",
      blurb: "How the TSP funds and Lifecycle (L) funds work, plus accessing your account, contributions, inter-fund transfers, and loans.",
      date: "2026-07-09", mon: "JUL", day: "09", dateDisplay: "Thursday, July 9, 2026",
      status: "scheduled"
    },
    {
      slug: "tsp-201",
      title: "TSP 201: Allocating Your TSP in Uncertain Times",
      tag: "TSP",
      blurb: "A deeper class on allocation — including the pros and cons of the Roth TSP and the return potential and risk associated with each TSP fund.",
      date: "2026-07-23", mon: "JUL", day: "23", dateDisplay: "Thursday, July 23, 2026",
      status: "scheduled"
    },
    {
      slug: "tsp-301",
      title: "TSP 301: Using Your TSP in Retirement",
      tag: "TSP",
      blurb: "Once you retire, the planning changes. How to withdraw from your TSP efficiently to generate monthly retirement income — and maximize the value of your hard-saved dollars.",
      date: "2026-08-06", mon: "AUG", day: "06", dateDisplay: "Thursday, August 6, 2026",
      status: "scheduled"
    },
    {
      slug: "tsp-roth-conversions",
      title: "TSP Master Class: Roth Conversions",
      tag: "TSP",
      blurb: "New for 2026 — converting traditional TSP balances to the Roth TSP. Current vs. future tax rates, expected uses for the funds, and how the tax on the conversion gets paid.",
      date: "2026-08-20", mon: "AUG", day: "20", dateDisplay: "Thursday, August 20, 2026",
      status: "scheduled"
    },
    {
      slug: "fegli",
      title: "FEGLI: Managing Life Insurance Through Your Career",
      tag: "FEGLI",
      blurb: "The major features of the Federal Employees' Group Life Insurance program — Basic and Optional coverage — and the benefits and costs through a federal career and into retirement.",
      date: "2026-09-03", mon: "SEP", day: "03", dateDisplay: "Thursday, September 3, 2026",
      status: "scheduled"
    },
    {
      slug: "the-retirement-process",
      title: "The Retirement Process",
      tag: "Process",
      blurb: "From application to final adjudication — a walk through the entire federal retirement process and what to expect when you complete your retirement application.",
      date: "2026-09-17", mon: "SEP", day: "17", dateDisplay: "Thursday, September 17, 2026",
      status: "scheduled"
    },
    {
      slug: "fehb-best-health-plan",
      title: "How to Choose the Best Health Plan Within FEHB",
      tag: "FEHB",
      blurb: "What to look for when comparing health, dental, and vision coverage during Open Season — plus how a Flexible Spending Account lets you set aside pre-tax dollars for out-of-pocket healthcare costs.",
      date: "2026-11-12", mon: "NOV", day: "12", dateDisplay: "Thursday, November 12, 2026",
      status: "scheduled",
      note: "Open Season topic — timed to the start of Open Season (Ann)"
    },
    {
      slug: "medicare-and-fehb",
      title: "Medicare and Your FEHB",
      tag: "Medicare",
      blurb: "FEHB is the only group health insurance in the country that lets you opt out of Medicare Part B at 65. The pros and cons of opting in, and what each of the four parts of Medicare covers.",
      date: "2026-11-26", mon: "NOV", day: "26", dateDisplay: "Thursday, November 26, 2026",
      status: "scheduled",
      note: "Open Season topic (Ann)"
    }
  ]
};
