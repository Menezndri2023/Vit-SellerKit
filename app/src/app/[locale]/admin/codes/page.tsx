import { ObjectId } from 'mongodb';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import CodesForm from '@/components/admin/CodesForm';
import RevokeCodeButton from '@/components/admin/RevokeCodeButton';
import { connectDb, mongoClient } from '@/lib/db';
import { ActivationCode } from '@/models/ActivationCode';

export default async function AdminCodes({ params }: PageProps<'/[locale]/admin/codes'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.codes');
  await connectDb();
  const codes = await ActivationCode.find().sort({ createdAt: -1 }).limit(200).lean();
  const userIds = codes.map((c) => c.usedBy).filter((x): x is string => Boolean(x && ObjectId.isValid(x)));
  const emails = new Map((await mongoClient().db().collection('user').find({ _id: { $in: userIds.map((x) => new ObjectId(x)) } }, { projection: { email: 1 } }).toArray()).map((u) => [String(u._id), u.email as string]));
  const date = (d?: Date | null) => (d ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(d) : '');

  return (
    <div className="flex flex-col gap-6">
      <CodesForm />
      <section className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-start text-xs uppercase text-muted">
              {[t('hint'), t('duration'), t('batch'), t('status'), ''].map((h) => (
                <th key={h} className="px-4 py-3 text-start font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={String(c._id)} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono">MK-…-{c.hint}</td>
                <td className="px-4 py-3">{c.durationDays ? `${c.durationDays} j` : t('lifetime')}</td>
                <td className="px-4 py-3 text-muted">
                  {c.batch}
                  {c.note ? ` · ${c.note}` : ''}
                </td>
                <td className="px-4 py-3">
                  {c.revokedAt ? (
                    <span className="text-muted">{t('revoked')}</span>
                  ) : c.usedBy ? (
                    <span className="text-profit">
                      {t('used')} {date(c.usedAt)} {emails.get(c.usedBy) ? t('by', { email: emails.get(c.usedBy)! }) : ''}
                    </span>
                  ) : (
                    t('available')
                  )}
                </td>
                <td className="px-4 py-3 text-end">{!c.usedBy && !c.revokedAt && <RevokeCodeButton id={String(c._id)} label={t('revoke')} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
