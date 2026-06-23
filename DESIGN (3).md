---
name: Studio Precision
colors:
  surface: '#1d100a'
  surface-dim: '#1d100a'
  surface-bright: '#46362e'
  surface-container-lowest: '#170b06'
  surface-container-low: '#261812'
  surface-container: '#2b1c16'
  surface-container-high: '#362720'
  surface-container-highest: '#41312a'
  on-surface: '#f8ddd2'
  on-surface-variant: '#e2bfb0'
  inverse-surface: '#f8ddd2'
  inverse-on-surface: '#3d2d26'
  outline: '#a98a7d'
  outline-variant: '#5a4136'
  surface-tint: '#ffb694'
  primary: '#ffb694'
  on-primary: '#571f00'
  primary-container: '#ff6a00'
  on-primary-container: '#571f00'
  inverse-primary: '#a14000'
  secondary: '#c6c6c7'
  on-secondary: '#2f3131'
  secondary-container: '#454747'
  on-secondary-container: '#b4b5b5'
  tertiary: '#9ccaff'
  on-tertiary: '#003256'
  tertiary-container: '#009eff'
  on-tertiary-container: '#003357'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb694'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7b2f00'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#9ccaff'
  on-tertiary-fixed: '#001d35'
  on-tertiary-fixed-variant: '#00497a'
  background: '#1d100a'
  on-background: '#f8ddd2'
  surface-variant: '#41312a'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style

This design system is built on a foundation of architectural precision and high-performance utility. It targets power users, developers, and document professionals who require a tool that feels like a high-end IDE for PDFs. 

The aesthetic is heavily inspired by modern developer-centric interfaces (Vercel/Linear), prioritizing structural integrity, clear information density, and functional minimalism. It avoids superfluous decoration, opting instead for a "machine-honed" look characterized by:
- **High-Contrast Dark Mode:** Deep blacks and stark whites to reduce eye strain during deep work.
- **Linear Precision:** Sharp boundaries, 1px strokes, and hair-line dividers.
- **Industrial Accents:** A vibrant "Studio Orange" used sparingly for critical actions and state indicators, suggesting energy and heat-mapped focus.
- **Architectural Depth:** Layering is achieved through subtle tonal shifts and 1px borders rather than heavy shadows.

## Colors

The palette is engineered for a "Lights Out" environment, where the content (the PDF) is the primary focus.

- **Background (#050505):** The foundation. Absolute depth to ensure the UI recedes and the document pops.
- **Surface (#0F0F0F):** Used for elevated containers, sidebars, and panels. The subtle 10-bit difference between background and surface creates structure without needing borders in every instance.
- **Studio Orange (#FF6A00):** The high-performance accent. Reserved for primary calls to action, active states, and selection highlights.
- **Secondary/Text (#FFFFFF):** Pure white used for primary headings and icons to maintain maximum legibility.
- **Success/Error:** Industry-standard functional colors, desaturated slightly to fit the dark aesthetic while remaining clear.

**Light Mode Transition:** In light mode, the background flips to #FFFFFF, surfaces to #F9F9F9, and borders to #E5E5E5. The Studio Orange remains the primary accent to maintain brand recognition.

## Typography

This design system utilizes **Inter** for all UI elements to ensure a systematic, neutral, and highly legible experience. 

- **Weight Scaling:** Use `600` (Semi-Bold) for headers to create a strong visual hierarchy against the dark background. 
- **Letter Spacing:** Headlines use a slight negative tracking (-0.02em) to appear tighter and more "designed." Labels use positive tracking and uppercase for a technical, functional feel.
- **Code/Data:** For metadata, page numbers, or file paths, a monospaced font (JetBrains Mono) is recommended to reinforce the "Studio" and "Coderz" heritage.

## Layout & Spacing

The layout follows a **Fluid-Fixed Hybrid** model. The sidebar and toolbars are fixed to specific widths to maximize the document viewport, while the main canvas area is fluid.

- **Baseline Grid:** A strict 4px grid governs all spacing.
- **The Sidebar:** Fixed at 280px for navigation and document structure (thumbnails, layers).
- **The Toolbar:** A top-pinned 56px bar containing primary PDF controls.
- **Breakpoints:**
  - **Mobile (<768px):** Single column, hidden sidebar (drawer), 16px margins.
  - **Tablet (768px - 1024px):** Persistent thin sidebar (icons only), 24px margins.
  - **Desktop (>1024px):** Full architectural layout, 32px margins.

## Elevation & Depth

In this design system, depth is communicated through **Reflective Layering** rather than traditional shadows.

- **Borders as Depth:** Every surface-level change is marked by a 1px solid border. The border color for a surface at `0dp` is `#1F1F1F`, while elevated modals use a slightly brighter `#2F2F2F`.
- **Subtle Gradients:** Primary buttons and active states use a linear gradient (Top-to-Bottom: `primary` to `primary-dark`) to simulate a slight physical protrusion.
- **Backdrop Blur:** Modals and overlays use a 12px blur with a 60% opacity background to maintain context of the document beneath while focusing the user.
- **Inner Glow:** Active inputs feature a subtle 1px inner glow in Studio Orange to denote focus without expanding the element's footprint.

## Shapes

The shape language is **Technical and Precise**. 

- **Base Radius:** 4px (Soft) is the standard for buttons, inputs, and cards. This provides a hint of approachability while maintaining the overall sharp, professional aesthetic.
- **Outer Containers:** Large panels and the main document viewer use a 0px (Sharp) radius where they meet the screen edge to maximize screen real estate.
- **Selection Brackets:** Use sharp 90-degree corners for document selection tools to emphasize accuracy.

## Components

### Buttons
- **Primary:** Background Studio Orange (#FF6A00), Text White (#FFFFFF), 4px radius. On hover, apply a subtle top-light gradient.
- **Ghost:** No background, 1px border (#2F2F2F). On hover, background becomes #1A1A1A and border becomes #FF6A00.

### Input Fields
- Dark background (#050505), 1px border (#1F1F1F). Text uses `body-md`. Focus state: Border becomes Studio Orange, 1px outer glow.

### Cards & Panels
- Background Surface (#0F0F0F), 1px border (#1F1F1F). No shadows. Headers within cards should have a 1px bottom divider.

### Chips (Labels/Tags)
- Small, uppercase `label-md` text. Background #1A1A1A with a 1px border. For "Pro" features, use an Orange border.

### The "Studio" Toolbar
- A specialized component containing icon-only buttons for PDF manipulation (Rotate, Crop, Sign). Icons must be 20px, stroke-based (1.5px thickness), and pure White.

### Checkboxes/Radios
- Square 16px boxes with 2px radius. When checked, fill with Studio Orange and use a White checkmark.