import React, { useState } from 'react';

/**
 * UX4G Institutional Header Component
 * Implements GIGW 3.0 accessibility utility toolbar (A-, A, A+, contrast toggle)
 * and institutional branding layout.
 */
export default function HeaderComponent({ institutionName = "State Inter-College Consortium", portalName = "IntraVote Voting System", walletAddress, onConnectWallet }) {
  const [fontSize, setFontSize] = useState('default');
  const [theme, setTheme] = useState('light');

  const applyFontSize = (size) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      {/* 1. Accessibility & Sovereign Utility Stripe */}
      <div className="bg-slate-100 dark:bg-slate-950 px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Institutional Affirmation */}
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" aria-hidden="true"></span>
            <span className="font-semibold text-sky-950 dark:text-sky-300">GIGW 3.0 & UX4G Verified</span>
            <span className="text-slate-400" aria-hidden="true">|</span>
            <span className="text-slate-600 dark:text-slate-400 hidden sm:inline">Blockchain Public Audit Ready</span>
          </div>

          {/* Accessibility Controls */}
          <div className="flex items-center space-x-3">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:px-2 focus:py-1 focus:bg-amber-400 focus:text-slate-950 font-bold rounded">
              Skip to main content
            </a>

            {/* Font Sizing */}
            <div className="flex items-center space-x-1 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5" role="group" aria-label="Text sizing">
              <button
                type="button"
                onClick={() => applyFontSize('small')}
                aria-label="Decrease font size"
                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'small' ? 'bg-sky-800 text-white font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => applyFontSize('default')}
                aria-label="Standard font size"
                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'default' ? 'bg-sky-800 text-white font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => applyFontSize('large')}
                aria-label="Increase font size"
                className={`px-1.5 py-0.5 rounded text-xs transition-colors ${fontSize === 'large' ? 'bg-sky-800 text-white font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                A+
              </button>
            </div>

            {/* Contrast / Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to high contrast dark mode'}
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 High Contrast'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Institutional Branding Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-11 w-11 rounded-full bg-sky-900 dark:bg-sky-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            IV
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-400">
              {institutionName}
            </p>
            <h1 className="text-lg md:text-xl font-bold text-sky-950 dark:text-sky-100">
              {portalName}
            </h1>
          </div>
        </div>

        {/* Wallet / Auth Status */}
        <div className="flex items-center space-x-2">
          {walletAddress ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
              <span className="text-xs font-mono font-medium text-emerald-900 dark:text-emerald-300">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              className="px-4 py-2 bg-sky-800 hover:bg-sky-900 text-white text-xs font-semibold rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-sky-500"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
