```markdown
# Design System Strategy: Editorial Sophistication

## 1. Overview & Creative North Star

### The Creative North Star: "The Curated Legacy"
This design system moves away from the cold, spreadsheet-driven aesthetics of traditional finance. Instead, it adopts the persona of a **High-End Editorial Publication**. Our goal is to make wealth management feel like a curated lifestyle experience—blending the timeless authority of a serif-heavy broadsheet with the surgical precision of modern technology.

We break the "template" look by rejecting rigid, boxy layouts. We utilize **intentional asymmetry**, **overlapping elements**, and **dynamic whitespace** to create a rhythmic flow. The interface should feel like it was composed by a master typographer, where every element has the "breath" it needs to signify luxury and calm.

---

## 2. Colors & Surface Architecture

Our palette balances the deep authority of `primary` (#003870) with the warmth of `secondary` (#8e4f04 / Accent Orange).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or cards. Boundaries must be established through background color shifts. 
- Use `surface-container-low` (#f3f4f6) for large section backgrounds.
- Place `surface-container-lowest` (#ffffff) elements on top to create a natural, "paper-on-stone" lift.
- For high-impact areas, use `tertiary-fixed` (#d9e4eb) to create subtle, sophisticated zones of focus.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials.
- **Level 0 (Base):** `surface` (#f8f9fb).
- **Level 1 (Sections):** `surface-container` (#edeef0).
- **Level 2 (In-section content):** `surface-container-highest` (#e1e2e4).

### The "Glass & Gradient" Rule
To avoid a flat, "Bootstrap" appearance, use Glassmorphism for floating navigation or overlay modals. 
- Use a background blur of `20px` to `40px` combined with `surface` colors at 70% opacity.
- **Signature Texture:** Apply a subtle linear gradient from `primary` (#003870) to `primary-container` (#194f90) for primary CTAs. This adds a "silk-finish" depth that flat hex codes cannot replicate.

---

## 3. Typography

The typographic tension between the romantic serif and the technical mono is the soul of this system.

- **Display & Headlines (Cormorant Garamond / notoSerif):** Used for "The Narrative." These should be set with generous leading. Use `display-lg` for hero statements to convey elegance and heritage.
- **Body & Titles (Manrope):** Used for "The Content." Manrope provides high legibility for financial data and long-form reading, acting as the neutral bridge between our two extreme styles.
- **Eyebrows & Technicals (Geist Mono / spaceGrotesk):** Used for "The Precision." Always set in `ALL CAPS` with `0.05rem` letter spacing. Use `label-md` for categories, data labels, and small "editorial" metadata. This font signals that while we are elegant, our math is exact.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering**, not structural scaffolding.

### The Layering Principle
Depth is achieved by stacking surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a "soft lift." This mimics the way high-quality stationery feels when layered on a desk.

### Ambient Shadows
Shadows are a last resort. When used (e.g., for a floating action button or a top-level modal), they must be:
- **Extra-Diffused:** Blur values of `30px` or higher.
- **Low-Opacity:** Never exceed 8% opacity.
- **Tinted:** Use a shadow color derived from `on-surface` (#191c1e) rather than pure black to keep the light feeling natural.

### The "Ghost Border" Fallback
If a border is required for accessibility (e.g., input fields), use the `outline-variant` token at **20% opacity**. 100% opaque borders are strictly forbidden as they "trap" the eye and break the editorial flow.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `0.25rem` (sm) radius. Label set in `title-sm` (Manrope).
- **Secondary:** Transparent fill with a `Ghost Border` and `primary` text.
- **Tertiary:** No background. Use `label-md` (Geist Mono) in all caps with a small `Accent Orange` (`secondary`) dot or arrow as a trailing element.

### Cards
Cards must never have borders. Use the `surface-container-lowest` fill. Implement **Asymmetrical Padding**: e.g., `spacing-8` on the top/left and `spacing-10` on the bottom/right to create a sense of bespoke "layout" rather than a centered container.

### Lists & Data
- **Forbid Divider Lines.** Separate list items using `spacing-4` vertical gaps or alternating background shifts between `surface` and `surface-container-low`.
- Financial figures should always be paired with `label-sm` (Geist Mono) headers to emphasize technical accuracy.

### Signature Component: The "Editorial Pull Quote"
Use `headline-lg` (Cormorant Garamond) with a `secondary` (#f09f54) left-accent bar (4px wide). This component should overlap the edge of an image or a background section to break the grid.

---

## 6. Do's and Don'ts

### Do:
- **Embrace Asymmetry:** Offset images from their text containers by `spacing-10` to create movement.
- **Use Human Imagery:** Only use high-resolution photography of people in candid, warm environments.
- **Nesting Surfaces:** Use `surface-container` tiers to group related information without needing "boxes."

### Don't:
- **Don't use "Stock" Icons:** If an icon is needed, it must be ultra-thin (0.5px or 1px stroke) to match the sophistication of the typography.
- **Don't use Dividers:** Avoid horizontal rules (`<hr>`). Use whitespace (`spacing-12`+) to denote a change in topic.
- **Don't Over-Round:** Keep corner radii at `DEFAULT` (0.25rem) or `none`. Wealth management is about stability; excessive rounding (pills) feels too "tech-startup."

---

## 7. Spacing Scale
Utilize the spacing scale to create "Rhythmic Tension." 
- Use **Large Gaps** (`spacing-20`, `spacing-24`) between major sections to signal luxury. 
- Use **Tight Clusters** (`spacing-2`, `spacing-3`) for technical data to signal precision. 

Every layout should be a dance between these two extremes.```