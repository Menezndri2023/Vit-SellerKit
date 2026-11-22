import { startTrial } from '@/app/[locale]/activate/actions';

/** One-click start of the 7-day Pro trial (server action, no client JavaScript needed). */
export default function TrialButton({ label, className }: { label: string; className: string }) {
  return (
    <form action={startTrial}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
