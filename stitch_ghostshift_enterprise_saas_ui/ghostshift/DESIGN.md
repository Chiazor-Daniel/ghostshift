---
name: GhostShift
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#4953bc'
  on-secondary: '#ffffff'
  secondary-container: '#8792fe'
  on-secondary-container: '#17228f'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bdc2ff'
  on-secondary-fixed: '#000767'
  on-secondary-fixed-variant: '#2f3aa3'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  headline-xl:
    fontFamily: manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  unit-xs: 4px
  unit-sm: 8px
  unit-md: 16px
  unit-lg: 24px
  unit-xl: 32px
---

## Brand & Style
The design system embodies a sophisticated "GhostShift" aesthetic—a hybrid of high-end minimalism and subtle glassmorphism. It targets professional environments that require both technical precision and a premium, modern feel. The emotional response is one of clarity, depth, and fluid transition.

The style leverages translucent layers and backdrop blurs to create a sense of physical space. Interfaces feel lightweight yet structured, utilizing the contrast between sharp typography and soft, ethereal surface treatments. This system prioritizes legibility and functional elegance over loud ornamentation.

## Colors
The palette is centered on the "GhostShift" spectrum, utilizing deep indigo for brand actions and a range of slate tones for structural hierarchy.

- **Primary:** Deep Indigo (#4f46e5) serves as the core interactive color, used for primary buttons, active states, and brand markers.
- **Surface & Background:** The main canvas is a very light slate (#f8fafc), providing a cool, sterile base that allows white (#ffffff) card surfaces to pop with subtle elevation.
- **Typography:** Contrast is strictly maintained with Deep Slate (#1e293b) for all headings to ensure immediate scannability, while Medium Slate (#64748b) provides a softer, legible weight for long-form body text.
- **Accents:** Secondary actions and supportive UI elements use a lighter violet-indigo (#818cf8) to maintain monochromatic harmony.

## Typography
The system uses a pairing of **Manrope** for headlines and **Inter** for body and interface elements. 

Headlines utilize tighter letter-spacing and bold weights to ground the "GhostShift" aesthetic. Body copy is set in Inter to provide a neutral, systematic feel that ensures high readability across dense information environments. All typography is color-coded using the defined slate hierarchy to ensure clear content architecture.

## Layout & Spacing
The design system employs a fluid 12-column grid for desktop and a single-column layout for mobile. 

The spacing rhythm is based on an 8px base unit. 16px (unit-md) is the standard padding for most small components, while 24px (unit-lg) is used for card padding and section margins. For desktop layouts, the horizontal margins expand to 48px to create a sense of openness and luxury.

## Elevation & Depth
Depth is created through a combination of **Glassmorphism** and **Tonal Layering**. 

Cards use a white surface with a very subtle 1px border (#e2e8f0) and a soft, wide-spread ambient shadow. When elements are "shifted" or hovered, a backdrop blur (12px to 20px) is applied to create the "Ghost" effect, making the element appear as if it is floating over the light slate background. This avoids the heavy shadows of traditional skeuomorphism in favor of light-based depth.

## Shapes
The shape language is consistently rounded to evoke a modern, approachable feel. 

- **Cards & Major Containers:** Always use a 16px (rounded-lg/xl) corner radius.
- **Buttons & Inputs:** Follow a 8px (rounded-md) radius for a slightly tighter, more functional appearance.
- **Chips:** Utilize a full pill-shape (999px) to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use the #4f46e5 fill with white text. Ghost buttons use a 1px border of the same indigo or are entirely transparent with indigo text.
- **Cards:** White surfaces (#ffffff) with 16px corner radius. In dark mode or on hover, apply a `backdrop-filter: blur(10px)` with 80% opacity.
- **Input Fields:** Use a light slate background (#f1f5f9) with a 1px border. Focus states transition the border to #4f46e5 with a soft glow.
- **Chips/Badges:** Use a light indigo tint (#e0e7ff) for the background and deep indigo (#4338ca) for the text to ensure high contrast and category visibility.
- **Lists:** Items are separated by subtle #f1f5f9 dividers; hover states utilize a very faint indigo tint (#f5f3ff) to indicate interactivity.