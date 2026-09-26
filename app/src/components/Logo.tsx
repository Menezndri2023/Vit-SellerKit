import { Link } from '@/i18n/navigation';

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-lg font-extrabold">
      <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
        M
      </span>
      Margokit
    </Link>
  );
}
