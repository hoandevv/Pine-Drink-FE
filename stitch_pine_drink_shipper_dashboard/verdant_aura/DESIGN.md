---
name: Verdant Aura
colors:
  surface: '#eefeed'
  surface-dim: '#cedece'
  surface-bright: '#eefeed'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e8f8e7'
  surface-container: '#e2f2e2'
  surface-container-high: '#ddecdc'
  surface-container-highest: '#d7e7d7'
  on-surface: '#111e15'
  on-surface-variant: '#414942'
  inverse-surface: '#263429'
  inverse-on-surface: '#e5f5e4'
  outline: '#717972'
  outline-variant: '#c0c9c0'
  surface-tint: '#36684b'
  primary: '#00331c'
  on-primary: '#ffffff'
  primary-container: '#164a2f'
  on-primary-container: '#84b996'
  inverse-primary: '#9dd3af'
  secondary: '#4a6640'
  on-secondary: '#ffffff'
  secondary-container: '#c9e9b9'
  on-secondary-container: '#4e6a44'
  tertiary: '#372900'
  on-tertiary: '#ffffff'
  tertiary-container: '#523e00'
  on-tertiary-container: '#d6a600'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b8efca'
  primary-fixed-dim: '#9dd3af'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#1d5034'
  secondary-fixed: '#cbecbc'
  secondary-fixed-dim: '#b0d0a1'
  on-secondary-fixed: '#082104'
  on-secondary-fixed-variant: '#334d2a'
  tertiary-fixed: '#ffdf95'
  tertiary-fixed-dim: '#f4bf1b'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#594400'
  background: '#eefeed'
  on-background: '#111e15'
  surface-variant: '#d7e7d7'
typography:
  headline-xl:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 26px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  section-gap: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system embodies a "Premium Organic" aesthetic, drawing inspiration from high-end wellness boutiques and artisanal tea culture. The brand personality is serene, sophisticated, and deeply rooted in nature, yet executed with the precision of modern luxury.

The style leverages **Minimalism** and **Tonal Layering**. It avoids harsh digital whites and blacks in favor of a warm, ivory-based palette and deep forest greens. The interface should feel breathable and tactile, evoking an emotional response of calm, focus, and exclusivity. Key visual drivers include generous whitespace, pill-shaped geometry, and a sophisticated interplay between matte surfaces and gold accents.

## Colors

The palette is anchored by the **Forest Green** primary, used for brand-critical elements and structural components like sidebars to provide a grounded, authoritative foundation.

- **Primary (Forest Green):** Used for primary buttons, active navigation states, and high-level headers.
- **Secondary (Matcha/Sage):** Primarily for subtle backgrounds, secondary badges, and hover states. It acts as the "soft" bridge between the dark greens and light creams.
- **Surface (Cream/Ivory):** The canvas of the application. Avoid pure #FFFFFF; use Ivory for the main background to maintain the "latte" warmth.
- **Accent (Pineapple Gold):** Reserved for micro-interactions, active borders, and critical call-to-actions that require high visibility without breaking the organic harmony.
- **Text (Deep Forest Black):** A high-contrast, near-black green that ensures legibility while feeling softer and more "premium" than standard neutral grays.

## Typography

This design system exclusively utilizes **Montserrat** to achieve a geometric yet friendly modernism. The hierarchy is established through dramatic weight shifts rather than just size.

- **Headlines:** Use SemiBold (600) or Bold (700). For large display text, apply a slight negative letter spacing to create a more compact, "editorial" feel.
- **Body Text:** Use Regular (400) for maximum readability. The line height is intentionally generous (1.6) to support the airy, premium aesthetic.
- **Labels:** Use Medium (500) or SemiBold (600). Small labels often benefit from uppercase styling with increased letter spacing to differentiate them from body copy.
- **Hierarchy:** Maintain a clear contrast between Forest Green headers and Deep Forest Black body text to guide the eye effectively.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on "White Space as a Feature." Components should never feel cramped; if in doubt, increase padding.

- **Grid:** Use a 12-column grid for desktop with 24px margins. For mobile, shift to a 4-column grid with 16px margins.
- **Spacing Rhythm:** Based on an 8px baseline. Use `stack-lg` (32px) to separate distinct card groups and `section-gap` (64px) to separate major content blocks.
- **Safe Areas:** Ensure a minimum of 24px internal padding for all cards and containers to maintain the premium, unhurried feel.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy shadows.

- **Base Layer:** The Ivory (#FFFDF5) background.
- **Mid Layer:** Sage/Matcha (#DFF3D4) containers for secondary information or sidebar groupings.
- **Top Layer:** Warm Ivory (#FFF8E7) cards with thin, Pineapple Gold (#FFC928) borders for active states.
- **Shadows:** Use extremely soft, low-opacity shadows (e.g., `rgba(22, 74, 47, 0.08)`) to give cards a subtle lift. The shadow color should have a slight green tint to remain cohesive with the palette.
- **Glassmorphism:** Use sparingly for floating navigation or overlays, utilizing a backdrop blur (12px) and a semi-transparent Ivory fill.

## Shapes

The design system utilizes a **Full Pill (Level 3)** shape language. This creates an organic, soft, and approachable aesthetic that contrasts beautifully with the sharp geometric nature of the Montserrat typeface.

- **Components:** All buttons, input fields, and tags must be fully rounded (pill-shaped).
- **Cards:** Use `rounded-xl` (1.5rem / 24px) for main content containers to maintain a consistent softness without the awkwardness of full pill shapes on large squares.
- **Icons:** Should be contained within circular or pill-shaped backgrounds when used as decorative or interactive elements.

## Components

- **Buttons:** 
    - **Primary:** Forest Green background, White or Ivory text, Pill-shaped.
    - **Secondary:** Matcha/Sage background, Forest Green text, Pill-shaped.
    - **Accent:** Pineapple Gold background for high-priority conversion points.
- **Input Fields:** Use Ivory Warm (#FFF8E7) backgrounds with a subtle 1px border in Matcha. On focus, the border transitions to Pineapple Gold.
- **Chips & Badges:** Always pill-shaped. Use Matcha backgrounds for neutral tags and Forest Green for high-emphasis tags.
- **Cards:** Utilize a "Soft Lift"—a Warm Ivory background, a subtle Matcha tint shadow, and 24px padding. Active cards get a 2px Pineapple Gold border.
- **Lists:** Use Forest Green for primary list items and Sage for dividers. Ensure generous vertical padding (16px+) between items.
- **Navigation (Sidebar):** Use the Deep Forest Green (#0B3320) background with Ivory text. Active states should use a Pineapple Gold vertical indicator on the left or a pill-shaped Matcha background for the menu item.