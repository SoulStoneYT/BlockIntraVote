import React from 'react';

/**
 * UX4G Compliant Ballot Selection Card
 * Meets WCAG 2.1 AA accessibility guidelines with full keyboard navigation,
 * aria-checked indicators, and high contrast selection states.
 */
export default function BallotCard({ candidate, isSelected, onSelect, disabled = false }) {
  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(candidate.id);
    }
  };

  return (
    <article
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onSelect(candidate.id)}
      onKeyDown={handleKeyDown}
      className={`relative p-5 rounded-lg border-2 transition-all cursor-pointer flex flex-col justify-between
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : ''}
        ${!disabled && isSelected 
          ? 'border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 dark:border-sky-400 shadow-md ring-1 ring-sky-800 dark:ring-sky-400' 
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-600 dark:hover:border-sky-500'
        }
      `}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            {/* Custom accessible radio bullet */}
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                ${isSelected ? 'border-sky-800 bg-sky-800 dark:border-sky-400 dark:bg-sky-400' : 'border-slate-400'}`}
              aria-hidden="true"
            >
              {isSelected && <div className="w-2 h-2 rounded-full bg-white dark:bg-slate-950" />}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {candidate.name}
              </h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {candidate.department || candidate.party}
              </p>
            </div>
          </div>

          <span className="text-xs px-2.5 py-0.5 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            #{candidate.id}
          </span>
        </div>

        {candidate.manifesto && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
            {candidate.manifesto}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
          Eligibility: Verified
        </span>

        <span
          className={`font-semibold ${
            isSelected
              ? 'text-sky-800 dark:text-sky-400'
              : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Click to select'}
        </span>
      </div>
    </article>
  );
}
