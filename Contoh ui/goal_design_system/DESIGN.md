---
name: Goal Design System
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bccbb9'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#869585'
  outline-variant: '#3d4a3d'
  surface-tint: '#4ae176'
  primary: '#4be277'
  on-primary: '#003915'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#006e2f'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb5ab'
  on-tertiary: '#60130d'
  tertiary-container: '#ff8b7c'
  on-tertiary-container: '#76231b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#7f2a21'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 28px
    fontWeight: '400'
    lineHeight: '1.2'
  title-md:
    fontFamily: Archivo Narrow
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Archivo Narrow
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Archivo Narrow
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Archivo Narrow
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
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system is engineered for a high-energy, athletic audience. It captures the adrenaline of the pitch through a fusion of **Corporate Modern** structure and **Glassmorphism** accents. The aesthetic is clean and high-performance, evoking the feel of premium sports gear and modern stadium architecture. 

The user experience centers on momentum; every transition should feel fast and fluid. We utilize large, confident typography and vibrant green accents to create a sense of urgency and excitement, balanced by a professional dark-mode-first infrastructure that ensures clarity during night-time booking sessions.

## Colors
The palette is dominated by **Deep Charcoal** to provide a high-contrast foundation that makes the **Dynamic Green** (Primary) "pop" like floodlights on a pitch. 

- **Primary (Dynamic Green):** Used for primary actions, success states, and key brand moments.
- **Secondary (Emerald):** Used for supporting accents and energy gradients.
- **Surface (Deep Charcoal):** Layers of #1E1E1E are used to define hierarchy over the #121212 background.
- **Contrast (White):** Pure white is reserved for high-readability text and icons against dark backgrounds.

Gradients should be used sparingly on high-impact components like "Book Now" buttons or active status indicators to simulate a sense of motion and energy.

## Typography
This design system utilizes a high-impact typographic pairing to balance athleticism with utility. 

- **Headlines:** **Anton** provides a condensed, powerful, and "stadium-board" feel. All major headings should be set in Uppercase to maximize the athletic aesthetic.
- **Body & Labels:** **Archivo Narrow** is chosen for its high information density and technical look. It ensures that complex booking schedules and data-heavy field details remain legible and structured.

Vertical rhythm is maintained by a strict adherence to the defined line heights, ensuring that even with condensed fonts, the text remains airy and accessible.

## Layout & Spacing
The layout follows a **Fluid Grid** model to accommodate the varied screen sizes of mobile users on the go. 

- **Grid:** A 12-column grid for desktop and a 4-column grid for mobile.
- **Rhythm:** We use a base-8 spacing system. However, for "airy" layouts, we prioritize `xl` (40px) padding between major sections to prevent the UI from feeling cluttered.
- **Safe Zones:** High-priority booking buttons should always maintain a `lg` (24px) margin from the screen edges to ensure ease of thumb-reach on mobile devices.

## Elevation & Depth
Depth is created through **Glassmorphism** and **Tonal Layering** rather than traditional heavy shadows.

- **Level 1 (Base):** #121212 Background.
- **Level 2 (Cards):** #1E1E1E with a 1px subtle stroke of white at 10% opacity.
- **Level 3 (Modals/Overlays):** Semi-transparent charcoal with a `backdrop-filter: blur(12px)`. This creates a "frosted stadium glass" effect that keeps the user grounded in their previous context.
- **Shadows:** Use extremely soft, large-spread shadows (0 10px 30px rgba(0,0,0,0.5)) only on floating action buttons and primary cards to lift them off the dark base.

## Shapes
We employ a **Rounded** (0.5rem base) shape language. This softens the aggressive nature of the bold typography and dark colors, making the app feel more welcoming and modern.

- **Standard Elements:** 8px (0.5rem) radius for inputs, small cards, and buttons.
- **Large Containers:** 16px (1rem) radius for main field-detail cards and modal containers.
- **Interactive Pills:** 32px (full-round) for category tags (e.g., "Football", "Tennis") to distinguish them from functional buttons.

## Components
- **Buttons:** Primary buttons use the `energy` gradient with black text for maximum contrast. They should have a subtle inner-glow to feel "tactile." Secondary buttons are "Ghost" style with a primary green border.
- **Cards:** Field cards should feature a large image with a bottom-up charcoal gradient overlay where the title and price are placed.
- **Chips:** Used for "Available Times." Selected state: Green background with Black text. Unselected: Dark surface with White text.
- **Inputs:** Dark backgrounds (#1E1E1E) with a 1px border that glows primary green upon focus.
- **Glass Header:** A sticky top navigation bar using the glassmorphism blur to maintain a sense of space as the user scrolls through field listings.
- **Booking Sticky Bar:** A persistent bottom bar on mobile with the price and a high-contrast CTA, utilizing a slight blur effect to show the content passing underneath.