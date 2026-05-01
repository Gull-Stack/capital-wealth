// Per-build webinar configuration. Sourced from env vars at build time so
// the Zoom join link can be set in Vercel without committing it.
//
// Vercel env keys to set (any environment that should render the join link):
//   ZOOM_WEBINAR_URL   — full Zoom join URL for May 14, 2026 federal webinar
module.exports = {
  may14FederalBenefits: {
    date: "2026-05-14",
    timeMt: "6:00 PM – 8:00 PM Mountain",
    zoomUrl: process.env.ZOOM_WEBINAR_URL || "",
    icsUrl: "/assets/webinars/federal-benefits-webinar-2026-05-14.ics"
  },
  ogdenMay19: {
    date: "2026-05-19",
    timeMt: "4:30 PM – 6:30 PM Mountain",
    icsUrl: "/assets/webinars/federal-benefits-workshop-ogden-2026-05-19.ics"
  },
  slcMay20: {
    date: "2026-05-20",
    timeMt: "4:00 PM – 6:00 PM Mountain",
    icsUrl: "/assets/webinars/federal-benefits-workshop-slc-2026-05-20.ics"
  },
  hillAfbMay21: {
    date: "2026-05-21",
    timeMt: "6:00 PM – 8:00 PM Mountain",
    icsUrl: "/assets/webinars/federal-benefits-workshop-hill-afb-2026-05-21.ics"
  }
};
