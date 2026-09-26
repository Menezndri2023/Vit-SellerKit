import { getTranslations, setRequestLocale } from 'next-intl/server';
import { escapeRegex } from '@/components/app/ListPage';
import UserActions from '@/components/admin/UserActions';
import { connectDb, mongoClient } from '@/lib/db';
import { grantsAccess } from '@/lib/plan';
import { Subscription } from '@/models/Subscription';

export default async function AdminUsers({ params, searchParams }: PageProps<'/[locale]/admin/users'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.users');
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim().slice(0, 100) : '';
  await connectDb();
  const filter = query ? { $or: [{ email: { $regex: escapeRegex(query), $options: 'i' } }, { name: { $regex: escapeRegex(query), $options: 'i' } }] } : {};
  const users = await mongoClient().db().collection('user').find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  const subs = await Subscription.find({ userId: { $in: users.map((u) => String(u._id)) } }).lean();
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d);

  return (
    <div className="flex flex-col gap-4">
      <form role="search">
        <input type="search" name="q" defaultValue={query} placeholder={t('search')} className="h-11 w-full max-w-md rounded-xl border border-line bg-surface px-4 text-base outline-none focus:border-primary-ink" />
      </form>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {users.map((u) => {
          const id = String(u._id);
          const active = subs.filter((s) => s.userId === id && grantsAccess(s));
          const best = active.sort((a, b) => (b.expiresAt ? +new Date(b.expiresAt) : Infinity) - (a.expiresAt ? +new Date(a.expiresAt) : Infinity))[0];
          return (
            <li key={id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {u.email as string} {u.role === 'admin' && <span className="ms-1 rounded bg-ink px-1.5 py-0.5 text-[10px] text-bg">{t('admin')}</span>}
                </p>
                <p className="text-sm text-muted">
                  {u.name as string} · {t('created')} {date(u.createdAt as Date)}
                  {!u.emailVerified && <span className="text-warn"> · {t('unverified')}</span>}
                </p>
                <p className="text-sm">
                  <strong>{best ? 'Pro' : t('free')}</strong>
                  {best && (
                    <span className="text-muted">
                      {' '}
                      · {best.provider}/{best.plan} · {best.expiresAt ? `${t('until')} ${date(new Date(best.expiresAt))}` : best.plan === 'monthly' ? t('renews') : t('lifetime')}
                    </span>
                  )}
                </p>
              </div>
              <UserActions userId={id} isPro={Boolean(best)} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
