# Nav Fix Handoff — Option B: In-Flow Nav to Sticky on Scroll

## Problem
The .finpay-header uses position: fixed which causes it to float over page content from the start. This hides the Official Government Registered Contractor banner on subpages. The main tag has padding-top: 100px to compensate but it is not enough and wastes above-the-fold space.

## Goal
Make the nav sit in normal document flow on page load (so nothing is hidden), then become sticky when the user scrolls past it. The Government Contractor bar should always be fully visible.

---

## Change 1: CSS — src/assets/css/finpay-inspired.css

Find the .finpay-header block (around line 184). Replace it:

OLD:
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);

NEW:
  position: sticky;
  top: 0;
  margin: 1rem auto 0;

Remove left and transform entirely. Keep width, max-width, z-index, background, backdrop-filter, border-radius, border, box-shadow, transition unchanged.

Also update .finpay-header.scrolled to add:
  border-radius: 0 0 16px 16px;
  margin-top: 0;
And change background opacity from 0.82 to 0.92 for better readability when docked.

---

## Change 2: HTML — src/_includes/layouts/base.njk

### 2a. Remove padding-top from main tag
Find:  <main style="padding-top: 100px;">
Replace with:  <main>

### 2b. Add Government Contractor bar between </header> closing tag and <main> tag
Insert this HTML between the mobile nav div and the main tag:

<!-- Government Contractor Bar — site-wide trust signal -->
<div style="background: var(--primary, #0A3161); padding: 0.5rem 0; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
  <div style="max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; font-family: var(--font-body); font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; color: rgba(255,255,255,0.85);">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="18" height="10" style="vertical-align: -1px; margin-right: 0.35em; border-radius: 1px;"><clipPath id="t"><rect width="60" height="30"/></clipPath><g clip-path="url(#t)"><rect width="60" height="30" fill="#B31942"/><rect y="2.31" width="60" height="2.31" fill="#fff"/><rect y="6.92" width="60" height="2.31" fill="#fff"/><rect y="11.54" width="60" height="2.31" fill="#fff"/><rect y="16.15" width="60" height="2.31" fill="#fff"/><rect y="20.77" width="60" height="2.31" fill="#fff"/><rect y="25.38" width="60" height="2.31" fill="#fff"/><rect width="24" height="16.15" fill="#0A3161"/></g></svg>An Official Government Registered Contractor&ensp;|&ensp;Unique Entity ID: <a href="https://cage.dla.mil/Search/Details?id=18320005" target="_blank" rel="noopener" style="color: rgba(255,255,255,0.85); text-decoration: underline; text-underline-offset: 2px;">L63FVVWAKXA8</a>
  </div>
</div>

---

## Change 3: Remove duplicate contractor bar from src/_includes/layouts/service-subpage.njk

Find and DELETE the entire block (around line 238-252):
<!-- Government Contractor Bar (federal pages only) -->
{% if serviceTag == "federal" %}
...the entire div with the contractor bar...
{% endif %}

Delete it completely — the bar is now in base.njk site-wide.

---

## Change 4: Scroll JS in base.njk
The existing scroll listener can stay as-is. The .scrolled CSS changes will handle the visual transition.

---

## Testing
After making changes, run the 11ty build to verify no errors. Do NOT git commit.
