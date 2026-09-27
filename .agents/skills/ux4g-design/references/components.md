# UX4G UI Components Specification

This reference outlines the required design patterns, HTML semantics, ARIA attributes, and styling for core UX4G components.

---

## 1. Institutional Header with Accessibility Controls

The header establishes sovereign trust and gives users immediate accessibility tools.

### Key Requirements:
1. **National/Institutional Emblem**: Displayed prominently on the left with high resolution and descriptive `alt` text (e.g. `alt="Institution Emblem"`).
2. **Title & Hierarchy**: Two-tier typography:
   - Line 1: Organization/Institution Name (e.g., "State University / College Election Commission")
   - Line 2: System / Portal Title (e.g., "IntraVote - Decentralized Student Council Voting System")
3. **Accessibility Controls (Right-aligned)**:
   - Font Resizing: `[A-]` `[A]` `[A+]`
   - High Contrast Toggle: `[Contrast]` or `[Dark Mode]`
   - Skip to Main Content Link (`.sr-only focus:not-sr-only`)

```jsx
<header className="ux4g-header border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
  {/* Top Utility / Accessibility Stripe */}
  <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1 text-xs text-slate-700 dark:text-slate-300 flex justify-between items-center">
    <div className="flex items-center space-x-2">
      <span className="font-semibold text-sky-800 dark:text-sky-400">Institutional Portal</span>
      <span aria-hidden="true">|</span>
      <span>Government of India / Academic Directorate</span>
    </div>
    <div className="flex items-center space-x-3">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-1 focus:bg-amber-400 focus:text-black">
        Skip to main content
      </a>
      <div className="flex items-center space-x-1" role="group" aria-label="Text size controls">
        <button onClick={() => setFontSize('small')} className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" aria-label="Decrease text size">A-</button>
        <button onClick={() => setFontSize('default')} className="px-1.5 py-0.5 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded" aria-label="Reset text size">A</button>
        <button onClick={() => setFontSize('large')} className="px-1.5 py-0.5 text-sm hover:bg-slate-200 dark:hover:bg-slate-800 rounded" aria-label="Increase text size">A+</button>
      </div>
      <button onClick={toggleTheme} className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-xs">
        {theme === 'dark' ? '☀️ Light' : '🌙 High Contrast'}
      </button>
    </div>
  </div>

  {/* Main Brand Area */}
  <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <div className="flex items-center space-x-4">
      <img src="/assets/emblem.png" alt="Institutional Seal" className="h-12 w-12 object-contain" />
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
          State Inter-College Academic Consortium
        </p>
        <h1 className="text-xl font-bold text-sky-950 dark:text-sky-100 leading-tight">
          IntraVote Blockchain Portal
        </h1>
      </div>
    </div>
  </div>
</header>
```

---

## 2. Accessible Buttons & Interactive States

UX4G buttons must provide clear feedback across focus, hover, and disabled states.

### Guidelines:
- Touch target: At least `44px` height and minimum `100px` width for desktop.
- Never use a disabled look with color alone—always retain `aria-disabled="true"`.
- Loading states must display an animated spinner and `aria-busy="true"` with a live region announcement.

```jsx
// Primary UX4G Action Button
<button
  type="button"
  disabled={isLoading}
  aria-busy={isLoading}
  className="inline-flex items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm
             bg-sky-800 hover:bg-sky-900 text-white 
             focus:outline-none focus:ring-3 focus:ring-sky-500 focus:ring-offset-2
             disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
>
  {isLoading ? (
    <>
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
      </svg>
      <span>Verifying on Blockchain...</span>
    </>
  ) : (
    <span>Confirm Vote Submission</span>
  )}
</button>
```

---

## 3. Accessible Form Controls with Floating or Clear Labels

Forms must have explicit associations between `<label>` and `<input>`.

```jsx
<div className="mb-4">
  <label htmlFor="student-prn" className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
    Permanent Registration Number (PRN) <span className="text-red-600" aria-hidden="true">*</span>
  </label>
  <input
    id="student-prn"
    type="text"
    required
    aria-required="true"
    aria-describedby="prn-hint prn-error"
    placeholder="e.g. 2023CSD1042"
    className="w-full px-3.5 py-2.5 rounded border border-slate-300 dark:border-slate-700 
               bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 
               focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
  />
  <p id="prn-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
    Enter the 11-digit university roll number printed on your ID card.
  </p>
  {error && (
    <p id="prn-error" role="alert" className="mt-1 text-xs font-semibold text-red-600 flex items-center">
      <span className="mr-1" aria-hidden="true">⚠️</span> {error}
    </p>
  )}
</div>
```

---

## 4. Candidate Voting Ballot Card

The ballot card gives voters an unambiguous interface with clear candidate identification, manifesto, and selection state.

```jsx
<article
  role="radio"
  aria-checked={isSelected}
  tabIndex={0}
  onClick={onSelect}
  onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && onSelect()}
  className={`p-4 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between
    ${isSelected 
      ? 'border-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:border-sky-400 shadow-md' 
      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
>
  <div className="flex items-start space-x-3">
    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
      ${isSelected ? 'border-sky-700 bg-sky-700 text-white' : 'border-slate-400'}`}>
      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
    </div>
    <div>
      <div className="flex items-center space-x-2">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{candidate.name}</h3>
        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono">
          #{candidate.id}
        </span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{candidate.partyOrDepartment}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{candidate.manifestoSummary}</p>
    </div>
  </div>
  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
    <span className="text-slate-500">Registration: Verified</span>
    <span className="font-semibold text-sky-700 dark:text-sky-400">
      {isSelected ? 'Selected' : 'Click to select'}
    </span>
  </div>
</article>
```

---

## 5. Standard Institutional GIGW Footer

The footer anchors sovereign authenticity and provides required statutory compliance links.

```jsx
<footer className="ux4g-footer bg-slate-900 text-slate-300 text-xs border-t-4 border-amber-600 pt-8 pb-12 mt-16">
  <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
    <div>
      <h4 className="font-bold text-white text-sm mb-3">About IntraVote</h4>
      <p className="text-slate-400 leading-relaxed">
        Decentralized, tamper-evident student council and faculty election platform 
        powered by Ethereum smart contracts.
      </p>
    </div>
    <div>
      <h4 className="font-bold text-white text-sm mb-3">Statutory Links</h4>
      <ul className="space-y-2">
        <li><a href="/terms" className="hover:underline hover:text-white">Terms of Service</a></li>
        <li><a href="/privacy" className="hover:underline hover:text-white">Privacy Policy</a></li>
        <li><a href="/accessibility" className="hover:underline hover:text-white">Accessibility Statement</a></li>
        <li><a href="/smart-contract" className="hover:underline hover:text-white">Smart Contract Audit Report</a></li>
      </ul>
    </div>
    <div>
      <h4 className="font-bold text-white text-sm mb-3">Compliance & Guidelines</h4>
      <ul className="space-y-2">
        <li><span>Compliant with GIGW 3.0</span></li>
        <li><span>WCAG 2.1 AA Certified</span></li>
        <li><span>Zero Knowledge Voter Secrecy</span></li>
      </ul>
    </div>
    <div>
      <h4 className="font-bold text-white text-sm mb-3">Helpline & Support</h4>
      <p className="text-slate-400">Election Commission Support Desk</p>
      <p className="text-slate-400 mt-1">support@intravote.ac.in</p>
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800 text-center text-slate-500">
    <p>© 2026 Institutional Election Commission. Designed following UX4G & Digital India Guidelines.</p>
    <p className="mt-1 font-mono text-[11px]">System Build: v2.4.0-verified | Network: Hardhat Local / Sepolia</p>
  </div>
</footer>
```
