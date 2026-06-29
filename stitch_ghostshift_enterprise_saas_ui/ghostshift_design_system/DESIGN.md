---
name: GhostShift Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#767586'
  outline-variant: '#c7c4d7'
  surface-tint: '#494bd6'
  primary: '#4648d4'
  on-primary: '#ffffff'
  primary-container: '#6063ee'
  on-primary-container: '#fffbff'
  inverse-primary: '#c0c1ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#595c5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#727577'
  on-tertiary-container: '#fbfdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1440px
  gutter: 24px
---

## Brand & Style
The design system is engineered for high-performance enterprise environments, balancing the rigorous data demands of workforce scheduling with a calm, human-centric approach to burnout management. The aesthetic is "Technical Elegance"—drawing inspiration from the precision of developer tools like Linear and the refined clarity of Vercel.

The personality is **Intelligent, Calm, and High-Performance**. The UI utilizes a "Low-Cognitive Load" philosophy, using ample whitespace and a focused Slate-and-White palette to reduce visual stress. Glassmorphism is applied selectively to top-level navigation and modal overlays to maintain a sense of depth and hierarchy without distracting from the primary data tasks.

## Colors
The palette is rooted in a "Clean Slate" foundation. We use a vast range of grays to create subtle boundaries and content groupings without the need for heavy borders. 

- **Primary (#6366f1):** A vibrant Indigo used for primary actions, focus states, and key data highlights.
- **Surface & Background:** High-purity whites and off-whites (`#f8fafc`) form the base, ensuring maximum legibility for data-heavy tables.
- **Accents:** Soft blue-violet tones are used for progress indicators and AI-suggested optimizations, signaling "intelligence" within the interface.
- **Semantic Colors:** Success, Warning, and Danger colors are slightly desaturated to maintain the "Calm" brand personality while remaining functional for burnout alerts.

## Typography
The system uses a dual-font strategy. **Geist** provides a technical, precise feel for headings and UI labels, reflecting the high-performance SaaS nature of the tool. **Inter** is utilized for body text and data values to ensure maximum readability and accessibility in high-density scheduling views.

For data-heavy dashboards, use `label-sm` for table headers and `body-sm` for cell content. Tracking (letter-spacing) is tightened on larger headlines to achieve the "Linear-style" premium aesthetic.

## Layout & Spacing
The spacing rhythm is based on a **4px baseline grid**. 

- **Dashboard Layout:** A 12-column fluid grid is used for the main workspace. 
- **Sidebar:** Fixed at 240px to provide a stable anchor for navigation.
- **Margins:** Desktop views utilize 48px (`xl`) outer margins to create a spacious, "premium" feel.
- **Dense Views:** For calendar and scheduling grids, spacing is reduced to `sm` (8px) or `xs` (4px) to maximize information density without clutter, using thin `1px` strokes in `#e2e8f0` to separate cells.

## Elevation & Depth
This design system uses a combination of **Tonal Layering** and **Glassmorphism** to convey hierarchy.

- **Level 0 (Background):** Solid `#ffffff` or the lightest gray `#f8fafc`.
- **Level 1 (Cards/Sidebar):** Slightly elevated using a subtle `1px` border in `#f1f5f9` and no shadow.
- **Level 2 (Dropdowns/Popovers):** Soft ambient shadows—`0px 10px 15px -3px rgba(0, 0, 0, 0.05)`.
- **Level 3 (Modals):** Glassmorphism effect—`backdrop-filter: blur(12px); background: rgba(255, 255, 255, 0.8);` with a high-diffusion shadow.
- **Shadow Character:** Shadows are never pure black; they are tinted with the secondary color (`#0f172a`) at very low opacities (2-5%) to feel more natural and integrated.

## Shapes
The shape language is sophisticated and approachable, characterized by significant corner rounding that softens the "technical" nature of the data. 

- **Default (Base):** 8px (`0.5rem`) for inputs and smaller components.
- **Large (Cards/Modals):** 16px (`1rem`) to create a distinct, modern container style.
- **Extra Large (Feature Blocks):** 24px (`1.5rem`) for high-level dashboard overviews.
- **Pill:** Used exclusively for Status Chips and high-priority AI-action buttons.

## Components
Consistent implementation of components is vital for the "High-Performance" feel of this design system:

- **Buttons:** Primary buttons use a solid `#6366f1` background with white text. Ghost buttons use a subtle `1px` border that only appears on hover.
- **Cards:** 16px corner radius, white background, and a very light `1px` border in `#f1f5f9`. 
- **Input Fields:** Minimalist design with a background of `#f8fafc` and a subtle indigo bottom border or ring on focus.
- **Interactive Calendars:** Day cells should use `4px` rounding. "Shift" blocks use semi-transparent versions of the primary or semantic colors to allow overlapping visibility.
- **Burnout Indicators (Chips):** Use a "Dot + Label" pattern. The dot pulses slightly if a burnout risk is high, using the semantic Danger color.
- **Data Tables:** Stripeless. Use a subtle hover state (`#f8fafc`) on rows. Typography must be strictly `body-sm` for data cells.
- **Charts:** Use a refined palette of Indigo, Violet, and Slate. Lines should have a `2px` stroke width and smooth interpolation (monotone or cubic).