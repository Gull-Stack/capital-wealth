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
  }
};
