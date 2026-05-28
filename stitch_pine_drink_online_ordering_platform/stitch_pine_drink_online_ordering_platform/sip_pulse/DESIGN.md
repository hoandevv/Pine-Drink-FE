---
name: Sip & Pulse
colors:
  surface: '#f4fafd'
  surface-dim: '#d4dbdd'
  surface-bright: '#f4fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f7'
  surface-container: '#e8eff1'
  surface-container-high: '#e2e9ec'
  surface-container-highest: '#dde4e6'
  on-surface: '#161d1f'
  on-surface-variant: '#5b403e'
  inverse-surface: '#2b3234'
  inverse-on-surface: '#ebf2f4'
  outline: '#8f6f6d'
  outline-variant: '#e4beba'
  surface-tint: '#ba1724'
  primary: '#b71422'
  on-primary: '#ffffff'
  primary-container: '#db3237'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3ae'
  secondary: '#635e53'
  on-secondary: '#ffffff'
  secondary-container: '#e9e2d3'
  on-secondary-container: '#696458'
  tertiary: '#5a5c5d'
  on-tertiary: '#ffffff'
  tertiary-container: '#737576'
  on-tertiary-container: '#fcfdfe'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ae'
  on-primary-fixed: '#410004'
  on-primary-fixed-variant: '#930014'
  secondary-fixed: '#e9e2d3'
  secondary-fixed-dim: '#cdc6b8'
  on-secondary-fixed: '#1e1b13'
  on-secondary-fixed-variant: '#4b463c'
  tertiary-fixed: '#e1e3e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1d'
  on-tertiary-fixed-variant: '#454748'
  background: '#f4fafd'
  on-background: '#161d1f'
  surface-variant: '#dde4e6'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The brand personality is energetic, youthful, and meticulously clean. It positions itself as a tech-forward F&B startup that bridges the gap between high-end artisanal beverages and the speed of modern delivery. The visual language evokes the freshness of a newly brewed tea and the efficiency of a streamlined digital experience.

The design style is **Modern Corporate with a Minimalist edge**. It prioritizes high-quality product photography and ample whitespace to create an "airy" feel, while using bold primary accents to drive appetite and conversion. It avoids clutter, using generous scale and soft depth to guide the user through the ordering flow.

## Colors

The palette is designed to be appetizing and premium. 

- **Primary (#FF4D4D):** A vibrant "Electric Poppy" used for critical actions, price highlights, and brand moments. It creates a sense of urgency and energy.
- **Secondary (#FDF5E6):** "Oat Cream." This serves as a calming counter-balance to the primary red. Use this for large background sections, surface containers, and card backgrounds to evoke the warmth of a cafe.
- **Backgrounds:** Use pure white (#FFFFFF) for the main canvas to maintain a clinical, clean feel. Light grey (#F8F9FA) should be reserved for subtle section dividers and input fields.
- **Text:** Deep charcoal (#2D3436) ensures high legibility and a professional grounding, avoiding the harshness of pure black.

## Typography

**Plus Jakarta Sans** is the sole typeface for this design system. Its modern, slightly rounded geometric forms mirror the friendly yet precise nature of the brand.

- **Hierarchy:** Use heavy weights (700-800) for product names and category headers to create a strong visual anchor.
- **Body Text:** Maintain a standard weight of 400 for descriptions to ensure breathability and readability against cream backgrounds.
- **Micro-copy:** Use the `label-sm` style for badges and status indicators to provide clear, scanable information without overwhelming the main content.
- **Spacing:** Tighten letter-spacing slightly on larger headlines to maintain a "locked-in," professional look.

## Layout & Spacing

The layout philosophy is based on a **Spacious Fluid Grid**. Content should feel unconstrained but organized.

- **Grid:** Use a 12-column grid for desktop and a 2-column or single-column stack for mobile. 
- **Rhythm:** An 8px base unit governs all spatial relationships. Card padding should consistently use `lg` (24px) to emphasize the premium nature of the products.
- **Mobile Reflow:** On mobile devices, horizontal scrolling "carousels" should be used for categories (e.g., Seasonal, Best Sellers) to keep the vertical scroll length manageable.
- **Safe Areas:** Ensure a minimum 16px margin on mobile devices to prevent content from touching the screen edges.

## Elevation & Depth

Visual hierarchy is achieved through **Ambient Shadows** and **Tonal Layering**.

- **Surface Layers:** The background is white. Secondary surfaces (cards or selection states) use the Oat Cream (#FDF5E6) to create a soft "lift" without needing a shadow.
- **Shadow Profile:** When depth is required (specifically for floating Cart buttons or Product Cards), use a very diffused, low-opacity shadow. 
    - *Example:* `0px 10px 30px rgba(45, 52, 54, 0.08)`.
- **Interactions:** Upon hover or press, cards should slightly lift (increase shadow spread) or scale (1.02x) to provide tactile feedback typical of a modern startup UI.

## Shapes

The design system uses a **Rounded** shape language to appear approachable and friendly.

- **Base Radius:** Elements like small buttons and input fields use a 0.5rem (8px) radius.
- **Large Radius:** Product cards and main containers must use `rounded-lg` (16px) or `rounded-xl` (24px) to align with the "youthful F&B" aesthetic.
- **Full Radius:** Use pill-shapes for status badges (e.g., "Ready for Pickup") and tags to distinguish them from functional buttons.

## Components

### Buttons
- **Primary:** Solid #FF4D4D with white text. 16px roundedness. Bold typography.
- **Secondary:** Transparent with a 2px #FF4D4D border or #FDF5E6 solid background with #2D3436 text.
- **Floating Action Button (FAB):** Specifically for the Cart, use a high-elevation primary button anchored to the bottom right.

### Product Cards
- **Structure:** Large image (top), title (bold), short description (muted), and a prominent "+" button for quick add-to-cart.
- **Style:** 16px corner radius, white background, soft ambient shadow.

### Status Badges
- **Pending:** Pale grey background, charcoal text.
- **Preparing:** Light orange background, dark orange text.
- **Ready:** Primary Red background, white text.
- **Shape:** Pill-shaped (full roundedness).

### Input Fields
- **Style:** Subtle light-grey background (#F8F9FA) with an 8px radius. Use a 2px primary color border only on focus states.

### Sticky Cart
- A persistent bar at the bottom of the mobile view or a sidebar on desktop that summarizes items and shows a "Checkout" CTA using the Primary color.