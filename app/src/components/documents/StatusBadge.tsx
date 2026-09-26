import { useTranslations } from 'next-intl';
import { statusTone } from '@/lib/documents/status';

export default function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('documents.statuses');
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status] ?? statusTone.draft}`}>{t(status as 'draft')}</span>;
}
