# UX4G Accessibility & GIGW 3.0 Compliance Guide

This guide outlines the critical accessibility requirements and audit criteria mandated by **GIGW 3.0 (Guidelines for Indian Government Websites)** and **WCAG 2.1 Level AA**.

---

## 1. Core Principles of Accessibility

1. **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive (e.g., text alternatives for images, captions, sufficient color contrast).
2. **Operable**: User interface components and navigation must be operable (e.g., keyboard accessibility, sufficient time to read and act, clear navigation).
3. **Understandable**: Information and the operation of user interface must be understandable (e.g., readable text, predictable operation, input assistance and error prevention).
4. **Robust**: Content must be robust enough that it can be interpreted reliably by a wide variety of user agents, including assistive technologies (e.g., valid HTML, proper ARIA roles and attributes).

---

## 2. GIGW 3.0 Compliance Checklist

### 2.1 Visual Design & Contrast
- [ ] **Contrast Ratio (Normal Text)**: Minimum `4.5:1` contrast ratio between text and its background.
- [ ] **Contrast Ratio (Large Text / Icons)**: Minimum `3:1` for text larger than 18pt or bold 14pt, and functional icons.
- [ ] **No Color-Only Information**: Never convey status, errors, or alerts using color alone. Pair color with text or recognizable iconography (e.g., `⚠️ Error`, `✓ Verified`).
- [ ] **Text Resizing**: Support text resizing up to 200% without loss of content or horizontal scroll overflow.
- [ ] **High Contrast / Dark Mode**: Provide a visible toggle that enables a high-contrast theme with sharp contrast borders.

### 2.2 Navigation & Keyboard Control
- [ ] **Skip to Main Content**: Provide a skip-link as the first focusable element on every page (`#main-content`).
- [ ] **Visible Focus Indicators**: Focus ring must be clearly visible (minimum 2px solid offset ring) on all focusable elements (links, buttons, inputs).
- [ ] **Logical Tab Order**: Tab order must follow the visual and logical reading order.
- [ ] **Keyboard Trap Free**: Ensure modal dialogues trap focus inside while open, but allow `Escape` or a close button to dismiss and return focus to the trigger.
- [ ] **Touch Target Size**: Minimum interactive target size is `44px x 44px`.

### 2.3 Forms & User Inputs
- [ ] **Visible Labels**: Every form field (`<input>`, `<select>`, `<textarea>`) must have an associated `<label>` using `htmlFor` / `id`.
- [ ] **Required Field Indicators**: Required fields must be indicated both visually (e.g., `*`) and programmatically (`aria-required="true"`).
- [ ] **Error Messages**: Form errors must be linked to the input via `aria-describedby` and announced to screen readers via `role="alert"` or `aria-live="assertive"`.
- [ ] **Confirmation of Critical Actions**: Irreversible actions (casting a vote, finalizing candidate nominations, deploying contracts) must require a confirmation step.

### 2.4 Screen Reader Support
- [ ] **Image Alt Text**: Informative images must have descriptive `alt` attributes. Decorative icons must have `aria-hidden="true"`.
- [ ] **Semantic Headings**: Proper nesting of heading levels (`<h1>` through `<h4>`). Never skip heading levels.
- [ ] **ARIA Roles for Custom Widgets**: Custom components (like radio ballot cards or tabs) must declare appropriate roles (`role="radiogroup"`, `role="radio"`, `aria-checked="true"`).

---

## 3. Testing and Audit Protocols

To verify compliance in any component or screen:

1. **Keyboard-Only Test**:
   - Disconnect the mouse.
   - Press `Tab` and `Shift+Tab` to move through every link, button, and input.
   - Verify the focus outline is never obscured or invisible.
   - Press `Enter` or `Space` to activate all buttons and radio options.
   - Press `Esc` to close modals.

2. **Automated Accessibility Testing**:
   - Run axe-core or Lighthouse Accessibility audit.
   - Aim for a 100% Lighthouse accessibility score.

3. **Color Contrast Analyzer (CCA)**:
   - Check background and foreground pairs using WebAIM Contrast Checker or browser devtools color picker.
