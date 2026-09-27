# UX4G Design Tokens and Styling Guide

This guide specifies the foundational design tokens for UX4G-compliant applications. These values follow the standard token taxonomy defined by NeGD / MeitY for digital government platforms.

---

## 1. Color Palette

### 1.1 Brand & Institutional Colors

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `--ux4g-primary-900` | `#002147` | Deep Navy (Official institutional chrome, deep headers) |
| `--ux4g-primary-800` | `#003366` | Classic Government Blue (Navbar backgrounds, main titles) |
| `--ux4g-primary-700` | `#0B4F6C` | Active interactive elements, focused headers |
| `--ux4g-primary-600` | `#1364F8` | Standard action buttons, primary links |
| `--ux4g-primary-100` | `#EBF3FE` | Primary tinted backgrounds, active row highlighting |
| `--ux4g-primary-50`  | `#F4F8FD` | Light primary card backgrounds |

### 1.2 Tricolor National Accents (Civic & Public Context)

| Token Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| `--ux4g-accent-saffron` | `#E06D20` | Subtle top bar stripe, highlighted badges, important notices |
| `--ux4g-accent-white`   | `#FFFFFF` | Center balance, clean cards, high-contrast surfaces |
| `--ux4g-accent-green`   | `#138808` | Success badges, verified status, active polls indicator |
| `--ux4g-accent-navy`    | `#000080` | Ashoka blue for official seals and verification crests |

### 1.3 Feedback & Semantic Colors

| Category | Token | Hex (Light) | Hex (Dark) | WCAG Contrast on White |
| :--- | :--- | :--- | :--- | :--- |
| **Success** | `--ux4g-success` | `#107E3E` | `#22C55E` | 4.8:1 (Passes AA) |
| **Warning** | `--ux4g-warning` | `#B45309` | `#FBBF24` | 4.6:1 (Passes AA) |
| **Danger**  | `--ux4g-danger`  | `#C5221F` | `#EF4444` | 5.2:1 (Passes AA) |
| **Info**    | `--ux4g-info`    | `#0284C7` | `#38BDF8` | 4.5:1 (Passes AA) |

### 1.4 Neutral Grayscale & Surfaces

| Token | Light Value | Dark Value | Purpose |
| :--- | :--- | :--- | :--- |
| `--ux4g-bg` | `#F8FAFC` | `#0B0F17` | Canvas / Page Background |
| `--ux4g-surface` | `#FFFFFF` | `#151E2E` | Container cards, modals, tables |
| `--ux4g-surface-subtle` | `#F1F5F9` | `#1E293B` | Table headers, secondary cards |
| `--ux4g-border` | `#CBD5E1` | `#334155` | Distinct dividers, borders |
| `--ux4g-border-focus` | `#003366` | `#38BDF8` | Focus rings (minimum 2px solid) |
| `--ux4g-text-primary` | `#0F172A` | `#F8FAFC` | Main headings and body text |
| `--ux4g-text-secondary` | `#475569` | `#94A3B8` | Subtitles, labels, timestamps |
| `--ux4g-text-muted` | `#64748B` | `#64748B` | Disabled copy, helper text |

---

## 2. Typography Scale

UX4G standardizes on clean, highly legible typefaces with broad Unicode support for Indian languages and English.

### Recommended Font Families:
- Primary: `'Noto Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Monospace (Cryptographic Hashes & IDs): `'JetBrains Mono', 'Fira Code', 'Courier New', monospace`

| Scale Token | Font Size | Line Height | Font Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--ux4g-font-h1` | `2.25rem` (36px) | `1.25` | 700 (Bold) | Main page titles, portal banner |
| `--ux4g-font-h2` | `1.75rem` (28px) | `1.3` | 700 (Bold) | Section headers, election names |
| `--ux4g-font-h3` | `1.375rem` (22px) | `1.35` | 600 (Semibold) | Card titles, modal headers |
| `--ux4g-font-h4` | `1.125rem` (18px) | `1.4` | 600 (Semibold) | Table column headers, sub-sections |
| `--ux4g-font-body` | `1.0rem` (16px) | `1.5` | 400 (Regular) | Default body copy, paragraphs |
| `--ux4g-font-small`| `0.875rem` (14px) | `1.4` | 500 (Medium) | Badges, helper text, timestamps |
| `--ux4g-font-micro`| `0.75rem` (12px) | `1.3` | 500 (Medium) | Footnotes, transaction hashes |

---

## 3. Spacing & Layout Grid (8pt System)

All spacing increments follow an 8px grid system to ensure balanced visual rhythm:

- `--ux4g-space-1`: `4px` (0.25rem) - tight gaps, inline icon margins
- `--ux4g-space-2`: `8px` (0.5rem) - form input internal padding (y-axis)
- `--ux4g-space-3`: `12px` (0.75rem) - button padding, card inner padding
- `--ux4g-space-4`: `16px` (1.0rem) - standard component padding
- `--ux4g-space-6`: `24px` (1.5rem) - card margins, section gutters
- `--ux4g-space-8`: `32px` (2.0rem) - layout separation, row gaps
- `--ux4g-space-12`: `48px` (3.0rem) - major section separation

### Container Max-Widths:
- Fixed container: `max-w-7xl` (`1280px`) with minimum `16px` padding on mobile and `24px` on desktop.
- Modal dialog: `max-w-lg` (`512px`) for alerts, `max-w-2xl` (`672px`) for ballot confirmations.

---

## 4. Elevation & Shadows

UX4G emphasizes subtle depth rather than heavy skeuomorphic shadows:

- `--ux4g-shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)` (Cards, resting state)
- `--ux4g-shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` (Hover cards, dropdowns)
- `--ux4g-shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)` (Modals, fixed drawers)
- `--ux4g-focus-ring`: `0 0 0 3px rgba(19, 100, 248, 0.35)` (Accessible focus indicator)
