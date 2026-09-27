---
name: ux4g-design
description: Design system and UI/UX guidelines based on UX4G (User Experience for Government) and GIGW 3.0. Use when designing, building, styling, or auditing web interfaces, components, forms, and pages to meet official Indian government/institutional design standards, WCAG 2.1 AA accessibility, and mobile-first civic UX patterns.
---

# UX4G Design System (User Experience for Government)

UX4G is the official open-source design system and UX framework initiated under the Digital India Programme by the National e-Governance Division (NeGD) and Ministry of Electronics and Information Technology (MeitY), Government of India. It standardizes digital citizen experiences across public, civic, educational, and governance portals, ensuring compliance with **GIGW 3.0 (Guidelines for Indian Government Websites)** and **WCAG 2.1 AA**.

Use this skill when developing or auditing UI components, layouts, forms, authentication flows, and public verification screens in institutional or civic platforms (such as collegiate voting, public registry, and blockchain audit portals).

---

## 1. Core Principles

1. **Inclusivity & Accessibility First**:
   - Strictly adhere to WCAG 2.1 AA and GIGW 3.0 standards.
   - Minimum color contrast ratio of `4.5:1` for regular text and `3:1` for large text or graphical elements.
   - Every interactive element must be keyboard navigable (`Tab`, `Shift+Tab`, `Enter`, `Space`) with visible focus outlines (`2px` solid offset ring).

2. **Trust & Authenticity**:
   - Standard institutional top header with institution/government emblem or seal.
   - Secure verification indicators (e.g., cryptographic proof badges, HTTPS indicators, certified audit trails).
   - Explicit confirmation dialogs before irreversible actions (e.g., casting a blockchain ballot).

3. **Clarity & Simplicity**:
   - Mobile-first, responsive 8pt / 12-column layout.
   - Plain, unambiguous language with status indicators using both iconography and textual labels (never rely on color alone).

4. **Accessibility Toolbar**:
   - Universal accessibility bar in the header allowing text resizing (A-, A, A+), high-contrast toggle, and screen-reader skip links.

---

## 2. Standard Layout Structure

Every UX4G-compliant portal follows a standardized vertical hierarchy:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Top Accessibility & Utility Bar                       │
│    [Skip to Main]  [Language Selector]  [A- A A+]  [Theme]│
├──────────────────────────────────────────────────────────┤
│ 2. Primary Institutional Header                          │
│    [Emblem/Logo]  [Portal Title & Department/College]    │
│    [User Auth / Connected Wallet Status]                 │
├──────────────────────────────────────────────────────────┤
│ 3. Navigation Bar (Navbar)                               │
│    Home | Active Elections | Live Results | Verify Ballot │
├──────────────────────────────────────────────────────────┤
│ 4. Breadcrumb & Page Banner                              │
│    Home > Elections > Computer Science Dept Election     │
├──────────────────────────────────────────────────────────┤
│ 5. Main Content Area                                     │
│    (Cards, Form Controls, Tables, Vote Ballot, Stats)    │
├──────────────────────────────────────────────────────────┤
│ 6. Standard Institutional Footer (GIGW Compliant)        │
│    - Quick Links & Policy Links (Privacy, Terms, Help)   │
│    - Accessibility Statement & Audit Compliance Badge    │
│    - Copyright & Last Updated Timestamp                  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. Design Tokens Quick Reference

See [tokens-and-styles.md](./references/tokens-and-styles.md) for full design token specifications.

| Category | Token | Light Mode Value | Dark / High-Contrast Value | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--ux4g-primary` | `#0B4F6C` / `#003366` | `#38BDF8` / `#2563EB` | Official brand, headers, primary buttons |
| **Secondary** | `--ux4g-secondary` | `#E06D20` (Saffron accent) | `#F59E0B` | Badges, callout borders, active highlights |
| **Success** | `--ux4g-success` | `#107E3E` (India green) | `#22C55E` | Verified votes, confirmed transactions |
| **Warning** | `--ux4g-warning` | `#B45309` | `#FBBF24` | Election closing soon, unconfirmed changes |
| **Danger** | `--ux4g-danger` | `#D32F2F` | `#EF4444` | Errors, vote revocations, invalid credentials |
| **Surface** | `--ux4g-bg` | `#F8FAFC` | `#0F172A` | Page background |
| **Card Bg** | `--ux4g-card` | `#FFFFFF` | `#1E293B` | Container background |
| **Text Primary**| `--ux4g-text` | `#0F172A` | `#F8FAFC` | High contrast body text |
| **Text Muted**  | `--ux4g-text-muted` | `#475569` | `#94A3B8` | Metadata, subtitles |
| **Border** | `--ux4g-border` | `#CBD5E1` | `#334155` | Dividers, card boundaries |

---

## 4. Key UI Components & Best Practices

Detailed component specifications and JSX templates are located in [components.md](./references/components.md).

### 4.1 Accessibility Bar & Skip Links
- Always place `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` as the very first DOM element.
- Provide font scaling (`A-`, `A`, `A+`) applying CSS root multiplier: `0.9rem`, `1rem`, `1.125rem`.

### 4.2 Buttons & Controls
- Primary buttons must have high contrast, bold text, minimum touch target of `44px x 44px`.
- Disabled buttons must include `aria-disabled="true"` and an informative tooltip or message explaining why the action is inactive (e.g. "Voting period has not started").
- Interactive states must define clear `:hover`, `:focus-visible`, and `:active` rules.

### 4.3 Forms & Inputs
- Always provide an explicit, visible `<label htmlFor="...">`. Never use placeholders as labels.
- Include helper text or validation errors tied via `aria-describedby="field-help"`.
- Error messages must display an alert icon and red text with `#B91C1C` minimum contrast.

### 4.4 Voting Ballot & Civic Cards
- Candidate/ballot selection cards must feature an explicit radio or check indicator.
- Display verification badges (e.g., Department, Roll No, Manifesto link, Smart Contract Address).
- Confirmation Modal must summarize the selected candidate, election title, and gas/hash verification before committing to the blockchain.

---

## 5. Verification & Audit Checklist (GIGW 3.0)

When completing a UI feature or screen, run through [accessibility-gigw.md](./references/accessibility-gigw.md):

- [ ] **Keyboard Navigation**: Can a user complete the entire flow (login, view election, vote, check results) without using a mouse?
- [ ] **Screen Reader Support**: Do all buttons and badges have descriptive labels (e.g. `aria-label="Vote for Candidate Jane Doe"`)?
- [ ] **Contrast Compliance**: Do all text elements meet >= `4.5:1` contrast ratio against their background?
- [ ] **Status Announcements**: Are dynamic toast/status messages wrapped in `aria-live="polite"` or `role="alert"`?
- [ ] **Clear Language**: Are technical blockchain terms (e.g. `TxHash`, `Gas limit`, `Revert`) accompanied by plain language descriptions (e.g. "Receipt Reference Number", "Transaction processing")?

---

## 6. Directory Structure

```text
.agents/skills/ux4g-design/
├── SKILL.md                          # This instruction manual
├── references/
│   ├── tokens-and-styles.md          # Complete design tokens, typography & CSS variables
│   ├── components.md                 # UI component specs, JSX patterns & code snippets
│   ├── accessibility-gigw.md         # GIGW 3.0 & WCAG 2.1 AA checklist & test protocols
│   └── voting-patterns.md            # Ballot, election lifecycle & verification patterns
└── examples/
    ├── ux4g-theme.css                # Drop-in CSS token styles & accessibility overrides
    ├── HeaderComponent.jsx           # Institutional header with accessibility toolbar
    └── BallotCard.jsx                # Accessible candidate voting card component
```
