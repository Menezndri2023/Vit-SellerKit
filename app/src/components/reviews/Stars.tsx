/** Read-only star rating. `value` can be decimal (4.3 fills 4 stars and 30 % of the fifth). */
export default function Stars({ value, size = 'size-4', label }: { value: number; size?: string; label: string }) {
  return (
    <span role="img" aria-label={label} className="inline-flex items-center gap-0.5 text-amber-500">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <svg key={i} aria-hidden viewBox="0 0 20 20" className={size}>
            <defs>
              <linearGradient id={`s${i}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path fill={`url(#s${i}-${Math.round(fill * 100)})`} d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.5l-5.4 3 1.3-5.9-4.5-4 6-.6L10 1.5Z" />
          </svg>
        );
      })}
    </span>
  );
}
