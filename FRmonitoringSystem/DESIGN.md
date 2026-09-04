# FRmonitoringSystem Design System

## Overview

FRmonitoringSystem uses an editorial-inspired visual system for geographic monitoring and longform environmental/infrastructure storytelling. It combines warm cream surfaces with deep teal and rose accents to create a premium, information-rich monitoring experience.

The system favors bold editorial typography, generous whitespace, sharp geometric precision, strong color blocks, and clear geographic hierarchy.

The visual identity should feel like a **high-end editorial intelligence platform**, not a generic admin dashboard.

---

## Colors

- **Primary**: `#134E4A` — Headlines, primary actions, selected states
- **Secondary**: `#E11D48` — Alerts, highlights, map accents, important findings
- **Tertiary**: `#FDF2E9` — Background, warm surfaces
- **Surface Base**: `#FDF2E9` — Main page background
- **Surface White**: `#FFFFFF` — Cards, panels, inputs
- **Success**: `#16A34A` — Normal/healthy status
- **Warning**: `#D97706` — Warnings, review-needed conditions
- **Error**: `#DC2626` — Critical alerts, errors
- **Info**: `#2563EB` — Updates, supporting information

### Geographic Colors

Use the existing palette for geographic visualization.

- Default state: `#E7E5E4`
- Hovered state: `#D6D3D1`
- Selected state: `#134E4A`
- Important/alert region: `#E11D48`
- Map background/surface: `#FDF2E9`

Do not introduce unnecessary colors. Geographic visualization should remain consistent with the main design system.

---

## Typography

- **Headline Font**: Playfair Display
- **Body Font**: Manrope
- **Mono Font**: Source Code Pro

### Scale

- **h1**: 56px, Black, 1.1 line height — Page/hero headlines
- **h2**: 40px, Bold, 1.15 line height — Major sections
- **h3**: 28px, Bold, 1.25 line height — State/monitoring titles
- **h4**: 22px, Bold, 1.3 line height — Sub-sections
- **Body**: 18px, Regular, 1.75 line height
- **Small**: 14px, Medium, 1.5 line height — Metadata/captions
- **XS**: 12px, Bold, 1.4 line height — Labels/categories

Use Playfair Display primarily for major editorial headlines and important geographic titles.

Use Manrope for navigation, controls, metadata, monitoring information, and interface text.

---

## Spacing

Base unit: **12px**

- **xs**: 6px — Inline icon gaps
- **sm**: 12px — Tight padding
- **md**: 24px — Standard content padding
- **lg**: 36px — Section gaps
- **xl**: 48px — Column margins
- **2xl**: 72px — Major section breaks
- **3xl**: 96px — Hero/full-bleed spacing

Maintain generous whitespace throughout the application.

---

## Border Radius

**0px everywhere.**

All interface elements use sharp corners.

Do not use rounded cards, pills, rounded buttons, rounded inputs, or rounded map panels.

---

## Elevation

**No shadows.**

Use:

- Whitespace
- Borders
- Color blocks
- Typography
- Strong rules
- Position and scale

Do not use:

- Drop shadows
- Glows
- Floating shadow effects

---

## Components

### Buttons

#### Primary

- Background: `#134E4A`
- Text: `#FFFFFF`
- Border: none
- Hover: `#0F3D3A`
- Radius: `0px`

#### Secondary

- Background: transparent
- Text: `#134E4A`
- Border: `2px solid #134E4A`
- Hover background: `#134E4A10`
- Radius: `0px`

#### Ghost

- Background: transparent
- Text: `#134E4A`
- Border: none
- Hover background: `#134E4A08`
- Radius: `0px`

#### Destructive

- Background: `#DC2626`
- Text: `#FFFFFF`
- Border: none
- Hover: `#B91C1C`
- Radius: `0px`

### Button Sizes

- **Small**: `8px 20px`, 14px, 36px height
- **Medium**: `10px 28px`, 16px, 44px height
- **Large**: `14px 36px`, 18px, 52px height

### Disabled

- Opacity: `0.4`
- Cursor disabled
- No hover/focus effects

---

## Cards

### Default

- Background: `#FFFFFF`
- Border: `1px solid #E7E5E4`
- Shadow: none
- Radius: `0px`
- Padding: `24px`
- Hover border: `#134E4A`

### Elevated

- Background: `#FFFFFF`
- Left border: `2px solid #134E4A`
- Other borders: none
- Shadow: none
- Radius: `0px`
- Padding: `24px`
- Hover background: `#FDF2E9`

Cards should feel like editorial information blocks rather than generic dashboard widgets.

---

## Inputs

### Default

- Border: `1px solid #D6D3D1`
- Background: `#FFFFFF`
- Radius: `0px`

### Hover

- Border: `1px solid #A8A29E`

### Focus

- Border: `2px solid #134E4A`

### Error

- Border: `2px solid #DC2626`
- Background: `#FEF2F2`

### Disabled

- Border: `1px solid #E7E5E4`
- Background: `#F5F5F4`
- Opacity: `0.5`

### Labels

- 12px Manrope
- Weight: 700
- Uppercase
- Letter spacing: 1px
- Color: primary
- Margin-bottom: 6px

### Helper Text

- 13px Manrope
- Weight: 400
- Color: secondary text
- Margin-top: 6px

### Error Text

- 12px / 16px
- Color: `#DC2626`

---

## Chips

### Filter

- Background: `#134E4A`
- Text: `#FFFFFF`
- Border: none
- Radius: `0px`

### Status

#### Success

- Background: `#DCFCE7`
- Text: `#166534`

#### Warning

- Background: `#FEF3C7`
- Text: `#92400E`

#### Error

- Background: `#FEE2E2`
- Text: `#991B1B`

### Chip Rules

- Padding: `4px 14px`
- Font size: 11px
- Uppercase
- Letter spacing: 1px
- Radius: `0px`

---

## Lists

- Font: 16px Manrope
- Row height: 52px
- Padding: `0 24px`
- Divider: `1px solid #E7E5E4`

### Hover

Background: `#FDF2E9`

### Active

- Left border: `3px solid #134E4A`
- Font weight: 700

Use this pattern for state lists, monitoring categories, reports, and geographic navigation.

---

## Checkboxes

- Size: 20px × 20px
- Radius: `0px`
- Border: `2px solid #D6D3D1`
- Background: `#FFFFFF`

### Checked

- Background: `#134E4A`
- White checkmark

### Focus

- `2px dashed #134E4A`
- Offset: 2px

Label:

- 16px Manrope
- 10px gap

---

## Radio Buttons

- Size: 20px
- Radius: 50%
- Border: `2px solid #D6D3D1`
- Background: `#FFFFFF`

### Selected

- Border: `2px solid #134E4A`
- Inner dot: 10px `#134E4A`

### Focus

- `2px dashed #134E4A`
- Offset: 2px

---

## Tooltips

- Background: `#134E4A`
- Text: `#FFFFFF`
- Font: 13px Manrope
- Padding: `8px 14px`
- Radius: `0px`
- Max width: 260px
- Show delay: 300ms
- Hide delay: 0ms

---

# Map Design

The map is a **primary part of the FRmonitoringSystem experience**, not a decorative background.

### Mapping Technology

All geographic mapping must use:

- **Leaflet.js**
- **React Leaflet**
- **Esri World Imagery** tile layer

Do not introduce another mapping library unless explicitly approved.

### Map Style

The map should visually integrate with the MagSpread-inspired system:

- Strong geographic hierarchy
- Minimal unnecessary controls
- Sharp rectangular UI elements
- Deep teal for selected geography
- Rose for important alerts
- Warm cream for surrounding interface surfaces
- No rounded floating panels
- No unnecessary shadows

### India Map

The primary geographic experience should follow:

**India → State → Monitoring Information**

States should:

- Be visually distinguishable
- Highlight on hover
- Clearly indicate selection
- Support click interaction
- Transition smoothly into state-level information

### Map Panels

Map overlays and information panels should follow the same component system:

- `0px` radius
- No shadows
- White or warm cream backgrounds
- Strong borders
- Generous spacing
- Clear typography hierarchy

---

# Geographic Information Hierarchy

The interface should make the geographic context obvious at all times.

Recommended hierarchy:

**Country**
→ India

**State**
→ Selected state

**Monitoring Category**
→ Relevant monitoring information

**Details**
→ Supporting data, findings, status, or events

Users should always understand **where they are looking and what the displayed information represents**.

---

# Editorial Layout

The application should retain the visual characteristics of a premium editorial publication.

### Do

- Use large Playfair Display headlines
- Use generous whitespace
- Use strong horizontal rules
- Use full-width color sections where appropriate
- Use large geographic visuals
- Use asymmetric/editorial layouts when useful
- Use bold typography to establish hierarchy
- Use full-bleed imagery where appropriate

### Avoid

- Generic SaaS dashboard layouts
- Excessive small cards
- Dense grids
- Rounded containers
- Floating glassmorphism panels
- Drop shadows
- Excessive gradients
- Excessive decorative effects

The application should feel **curated and editorial**, while remaining functional as a monitoring platform.

---

# Accessibility

- Maintain WCAG AA contrast where applicable.
- Do not place low-contrast text on warm cream backgrounds.
- Interactive elements must have visible focus states.
- Do not rely on color alone to communicate monitoring status.
- Geographic alerts should use color plus labels/icons/context.
- Map interactions should have accessible textual alternatives where practical.

---

# Do's and Don'ts

1. **Do** use Playfair Display for dramatic geographic and monitoring headlines.
2. **Do** use Manrope for interface and monitoring information.
3. **Do** use the deep teal `#134E4A` as the primary visual anchor.
4. **Do** use rose `#E11D48` for important alerts and accent highlights.
5. **Do** use the warm cream `#FDF2E9` as the primary surface.
6. **Do** maintain generous spacing using the 12px base unit.
7. **Do** use Leaflet + Esri World Imagery for maps.
8. **Do** make the map a central part of the experience.
9. **Do** maintain clear India → State → Monitoring hierarchy.
10. **Do** use strong typography, whitespace, borders, and color blocks for hierarchy.
11. **Don't** use border-radius on standard interface components.
12. **Don't** use drop shadows or glows.
13. **Don't** turn the application into a generic admin dashboard.
14. **Don't** introduce unnecessary colors or visual effects.
15. **Don't** overload screens with cards and dense data grids.
16. **Don't** use warm cream backgrounds behind text when contrast is insufficient.
17. **Don't** use more than two columns for long-form body content.
18. **Don't** use color alone to communicate status.
19. **Don't** introduce another mapping library without explicit approval.
20. **Don't** sacrifice the editorial aesthetic for generic UI patterns.
