export default function AuthHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </div>
  );
}
