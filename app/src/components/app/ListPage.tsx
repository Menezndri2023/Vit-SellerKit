import { Link } from '@/i18n/navigation';

/** Search box that submits as ?q=… (works without JavaScript). */
export function SearchBox({ placeholder, defaultValue }: { placeholder: string; defaultValue?: string }) {
  return (
    <form className="w-full sm:max-w-xs" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={100}
        className="h-11 w-full rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40"
      />
    </form>
  );
}

export function EmptyState({ title, text, cta, href }: { title: string; text: string; cta: string; href: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <div aria-hidden className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-2xl">
        ✦
      </div>
      <h2 className="mt-4 font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-muted">{text}</p>
      <Link href={href} className="mt-6 grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
        {cta}
      </Link>
    </div>
  );
}

export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="grid h-11 place-items-center rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95">
      + {label}
    </Link>
  );
}

/** Escapes user input before using it in a MongoDB regex. */
export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
