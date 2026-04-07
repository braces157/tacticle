# Design System: High-End Editorial for Enthusiast Keyboards

## 1. Overview & Creative North Star
**Creative North Star: "The Tactile Gallery"**

This design system is not a store; it is a digital exhibition. We are moving away from the "grid-of-items" e-commerce trope and moving toward an editorial experience that mirrors the precision and craftsmanship of a high-end mechanical keyboard. 

To achieve this, we utilize **Intentional Asymmetry**. Rather than perfectly centered grids, we use generous, unequal whitespace to guide the eye, treating product photography as fine art. We break the "template" look by layering type over image and using "Ghost" containers that feel integrated into the environment rather than pinned to a grid. The experience should feel airy, expensive, and quiet.

---

## 2. Colors
Our palette is a study in tonal nuance. We avoid pure #000000 to keep the interface from feeling harsh, opting instead for deep charcoals and tiered grays to create a "paper-on-stone" depth.

### The Palette
- **Primary (`#5f5e5e`):** Used for key interaction points and subtle branding.
- **Surface (`#f9f9f9`):** Our canvas. It is a warm, crisp white that prevents eye strain.
- **On-Surface (`#2d3435`):** Our "Black." Used for headers and body text to ensure high legibility with a soft touch.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define a new content area, use a background shift from `surface` to `surface-container-low` (`#f2f4f4`). Visual boundaries must be felt through tonal change, not seen through 1px lines.

### Surface Hierarchy & Nesting
Treat the UI as a physical desk. 
- **The Desk (Base):** `surface` (`#f9f9f9`)
- **The Mat (Section):** `surface-container-low` (`#f2f4f4`)
- **The Object (Card/Component):** `surface-container-lowest` (`#ffffff`)

### The "Glass & Gradient" Rule
For floating navigation or modular overlays, use **Glassmorphism**. Apply `surface_container_low` at 80% opacity with a `24px` backdrop blur. For primary CTAs, use a subtle linear gradient from `primary` (`#5f5e5e`) to `primary_dim` (`#535252`) at a 145-degree angle to provide a "machined metal" luster.

---

## 3. Typography
We use a dual-font system to balance technical precision with editorial authority.

- **Display & Headlines (Manrope):** A geometric sans-serif that feels modern and architectural. 
    - *Usage:* `display-lg` (3.5rem) should be used with tight letter-spacing (-0.02em) for product names.
- **Body & Labels (Inter):** A highly legible workhorse for technical specs and descriptions.
    - *Usage:* `body-md` (0.875rem) for all product descriptions to maintain a clean, "uncluttered" look.

**Hierarchy Note:** Always prioritize the "Typographic Leap." If you have a `headline-lg`, skip two levels down to `body-md` for the subtext. This high contrast in scale creates the "premium" feel.

---

## 4. Elevation & Depth
In this design system, depth is organic, not artificial.

- **The Layering Principle:** Reach for `surface-container` tiers before reaching for shadows. A `surface-container-highest` card on a `surface` background provides enough contrast for the eye to perceive depth.
- **Ambient Shadows:** Shadows should be used only on interactive "floating" elements (e.g., a cart drawer or a hover-state card). Use a 32px blur, 0px offset, and 4% opacity using the `on-surface` color. It should look like a soft glow, not a drop shadow.
- **The "Ghost Border":** If a button or input requires a container on a white background, use the `outline-variant` (`#adb3b4`) at **15% opacity**. It should be barely perceptible.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (Primary to Primary-Dim), `on-primary` text, `sm` (0.125rem) rounding for a "keycap" sharpness.
- **Secondary:** Transparent background with a "Ghost Border" and `primary` text.
- **Tertiary:** Underlined text only, using `label-md`.

### Cards (Product Display)
**Strict Rule:** No dividers, no borders. 
Use `surface-container-lowest` for the card body. The product image should bleed to the edges or sit on a `surface-variant` (`#dde4e5`) inner container to create a "frame within a frame" effect.

### Input Fields
Minimalist "Underline" style or ultra-soft containers. Use `surface-container-high` for the background with a `sm` radius. Labels should use `label-sm` and sit 8px above the field, never inside it.

### Editorial Product Grid
Instead of a standard 4x4 grid, use a staggered layout. Item 1 takes 60% width, Item 2 takes 40% and is offset vertically by 100px. This breaks the "template" feel and forces the user to engage with each keyboard as an individual piece of art.

### The "Spec" Sheet
For keyboard technical specs (switches, plate material, etc.), use a two-column list with **no dividers**. Use `surface-container-low` background shifts to highlight alternating rows if necessary, though whitespace is preferred.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `display-lg` typography that overlaps product imagery slightly to create depth.
- **Do** use "Optical Centering"—sometimes an object looks better slightly above the mathematical center.
- **Do** allow for "Dead Space." A page that is 40% empty is a page that feels premium.

### Don't:
- **Don't** use 100% black. It kills the "soft minimalism" vibe.
- **Don't** use `full` rounding (pills) for everything. Stick to `sm` (0.125rem) and `md` (0.375rem) to mimic the subtle curves of a keyboard chassis.
- **Don't** use icons with heavy fills. Use light-stroke (1px or 1.5px) "Linear" icons to match the weight of the Inter typeface.
- **Don't** use standard "Sale" reds. For errors or alerts, use our sophisticated `error` (`#9f403d`) which is desaturated and fits the palette.