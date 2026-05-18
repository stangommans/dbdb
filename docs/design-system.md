# DBDB (Divebar Database) - UI/UX Design System (Updated)

This specification defines the visual language, branding, and UI components for DBDB, ensuring a premium, cohesive experience that translates seamlessly across the platform.

---

## 🎨 1. Mood, Theme, & Aesthetic
*Authentic, worn-in, premium dark/moody environment.*
- **Visual Concept:** Worn-in Authenticity / Moody Underground / Sleek Retro.
- **Lighting Model:** Dark Mode default. High-contrast, warm glowing elements resembling neon signs and draft beer taps.
- **Core Elements:** Glassmorphism overlay panels with 80% opacity and heavy backdrop-blur (2xl/3xl), ambient glowing shadows, and custom glowing neon map pins.

---

## 💅 2. Color Palette
### Primary Backgrounds (Moody Darkness)
- **Deep Velvet (Base BG):** `#131313` (Solid surface for depth).
- **Charcoal Layer (Panel/Drawer BG):** `#1c1b1b` or `#0e0e0e` with `backdrop-blur-xl`.
- **Surface Bright:** `#3a3939` (Used for subtle borders and elevated card outlines).

### Brand Accents (Glowing Neon Taproom)
- **Amber Glow (Primary Accent):** `#f59e0b` (Draft Beer / Retro Neon). Used for primary buttons, ratings, and active map pins.
- **Murky Olive (Success/Positive):** `#84cc16` (Represents "Actually Nice" status).
- **Rust/Crimson (Alert/Price):** `#ef4444` (High price indicators or critical alerts).

---

## 🔤 3. Typography
- **Headings:** **Outfit** (Bold/Semibold). Used for brand identity and section headers to provide a sleek, geometric structure.
- **Body & Metadata:** **Outfit Light** or **Inter**. High readability for addresses, reviews, and descriptions.

### Scale Reference
- **Brand Logo:** `text-headline-md` (Bold, tracking-tighter).
- **Section Headers:** `text-headline-sm` (Semibold).
- **Card Titles:** `text-body-lg` (Medium).
- **Metadata:** `text-label-caps` or `text-sm` (Light, neutral-400).

---

## 🧩 4. Layout & Components
### Navigation & Overlays
- **Top Bar:** Glassmorphic header with `bg-surface-container/80` and `border-b border-white/10`.
- **Bottom Navigation:** Fixed `backdrop-blur-2xl` bar with `text-primary` active states and subtle glowing drop-shadows.
- **Details Drawer:** Mobile-first slide-over sheet using `bg-surface-dim/95` with a high-contrast action grid.

### Interactive Elements
- **Primary Buttons:** `bg-amber-500 text-neutral-950 rounded-xl font-semibold` with a `shadow-amber-500/20` glow.
- **Secondary Actions:** Dark glass buttons with thin `border-white/10` and subtle hover highlights.
- **Map Pins:** Simple glowing Amber dots; active pins feature a larger outer glow/halo.

### Cards & Surfaces
- **Glassmorphism:** `bg-neutral-950/75 backdrop-blur-xl border border-neutral-800/80 shadow-2xl`.
- **Separation:** 1px borders in `white/5` or `white/10` provide definition without breaking the dark aesthetic.


---
name: Moody Underground
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d8c3ad'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a08e7a'
  outline-variant: '#534434'
  surface-tint: '#ffb95f'
  primary: '#ffc174'
  on-primary: '#472a00'
  primary-container: '#f59e0b'
  on-primary-container: '#613b00'
  inverse-primary: '#855300'
  secondary: '#94de2d'
  on-secondary: '#1f3700'
  secondary-container: '#7ac100'
  on-secondary-container: '#2c4900'
  tertiary: '#ffbcb7'
  on-tertiary: '#68000a'
  tertiary-container: '#ff938c'
  on-tertiary-container: '#8d0012'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#ffb95f'
  on-primary-fixed: '#2a1700'
  on-primary-fixed-variant: '#653e00'
  secondary-fixed: '#acf847'
  secondary-fixed-dim: '#91db2a'
  on-secondary-fixed: '#102000'
  on-secondary-fixed-variant: '#304f00'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
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
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 40px
  container-max: 1280px
---

## Brand & Style

This design system is built on the concept of "Worn-in Authenticity," capturing the grit and soul of a late-night dive bar while maintaining a premium, digital-first polish. It evokes the feeling of navigating a dimly lit alleyway illuminated only by flickering neon signs.

The aesthetic blends **Glassmorphism** with **High-Contrast Retro** influences. It utilizes deep, velvety backgrounds contrasted against vibrant, glowing interactive elements. The interface should feel atmospheric and immersive, prioritizing tactile feedback and depth through layered translucency. The target audience values discovery, authenticity, and the "hidden gem" culture of urban nightlife.

## Colors

The palette is anchored in **Deep Velvet (#0a0a0a)**, a near-black base that provides infinite depth. Interacting with this base are layers of **Charcoal (#171717)** at 80% opacity, utilizing backdrop blurs to create a sense of smoked glass.

- **Amber Glow (#f59e0b):** The primary brand color. Used for essential actions, ratings, and active states. It should always be accompanied by a subtle outer glow (bloom) effect to mimic neon.
- **Murky Olive (#84cc16):** Used for success states and secondary affirmations, maintaining the "underground" mood without appearing overly "corporate."
- **Rust/Crimson (#ef4444):** Reserved for alerts, errors, and critical warnings.
- **Surface Layer:** All secondary surfaces use the Charcoal hex with an `80%` alpha channel and a `16px - 24px` backdrop blur.

## Typography

Typography in this design system balances modern geometric precision with utilitarian readability. 

**Outfit** is used for all headlines. Its wide, circular proportions feel contemporary and sleek. Large headlines should use tighter letter spacing and heavy weights to command attention, mimicking bold signage.

**Inter** is used for all body text and UI labels. It provides the necessary neutral ground to keep the interface functional and legible against dark, blurred backgrounds. 

**Label Caps** are utilized for metadata (e.g., "DISTANCE," "ESTABLISHED," "VIBE CHECK") to provide a structural, industrial feel.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model built on an 8px base unit. 

- **Desktop:** A 12-column grid with 24px gutters. Content is housed within glassmorphism "panes" that span specific column counts.
- **Mobile:** A single-column flow with 20px side margins. 
- **Spacing Rhythm:** Use tight spacing (8px, 16px) for related elements within a glass card, and larger spacing (40px, 64px) to separate distinct sections or "neighborhoods" of content. 

Margins and paddings should feel generous enough to let the background "breathe" through the translucent layers.

## Elevation & Depth

Hierarchy is established through **Glassmorphism and Tonal Layers** rather than traditional drop shadows.

1.  **Level 0 (Background):** Deep Velvet (#0a0a0a).
2.  **Level 1 (Panels):** Charcoal (#171717) at 80% opacity with a `24px` backdrop blur. A 1px subtle border in a slightly lighter neutral (#ffffff15) defines the edges.
3.  **Level 2 (Interactive/Floating):** Use an "Amber Bloom" instead of a shadow. Interactive elements like active map pins or primary buttons emit a soft, `12px` radius glow of #f59e0b at 30% opacity.

Depth is perceived by the clarity of the background blur; the higher the element in the stack, the more intense the blur of the layers beneath it.

## Shapes

The design system uses a **Soft (1)** roundedness profile. This 4px (0.25rem) base radius ensures the UI feels intentional and modern without becoming "bubbly" or overly playful. 

- **Cards/Panels:** Use `rounded-lg` (8px) for a slightly more approachable feel on large containers.
- **Buttons/Inputs:** Use the base `rounded` (4px) to maintain a sharp, sleek edge.
- **Map Pins:** Circular (full round) to distinguish them as points of interest within the geometric grid.

## Components

### Buttons
- **Primary:** Solid Amber Glow (#f59e0b) with black text. Apply a `0 0 15px rgba(245, 158, 11, 0.4)` box-shadow to create the neon effect.
- **Ghost:** Amber Glow border (1px) with transparent background. Text is Amber Glow.

### Glass Panels
The signature container. Background: `rgba(23, 23, 23, 0.8)`, Backdrop-filter: `blur(20px)`. Border: `1px solid rgba(255, 255, 255, 0.08)`.

### Input Fields
Dark backgrounds (#0a0a0a) with a subtle 1px border. On focus, the border transitions to Amber Glow with a soft inner shadow of the same color.

### Map Pins
Small circular dots. Inactive pins are muted grey; active dive bars are Amber Glow with a pulsing animation and a significant outer bloom.

### Chips & Tags
Small, low-contrast pills (Charcoal base) with Murky Olive or Amber text to denote bar features (e.g., "Cash Only", "Pool Table").

### Lists
Separated by thin, low-opacity lines (1px, #ffffff10). Hover states should trigger a subtle increase in the panel's background opacity to 90%.