'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { moderateReview } from '@/app/[locale]/admin/actions';

export default function ReviewModeration({ id, status }: { id: string; status: string }) {
  const t = useTranslations('admin.reviews');
  const [pending, start] = useTransition();
  const btn = 'h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-50';
  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'approved' && status !== 'unconfirmed' && (
        <button type="button" disabled={pending} onClick={() => start(() => moderateReview(id, 'approve'))} className={`${btn} bg-primary text-on-primary hover:brightness-95`}>
          {t('approve')}
        </button>
      )}
      {status !== 'rejected' && status !== 'unconfirmed' && (
        <button type="button" disabled={pending} onClick={() => start(() => moderateReview(id, 'reject'))} className={`${btn} border border-line bg-surface hover:bg-bg`}>
          {status === 'approved' ? t('unpublish') : t('reject')}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(t('confirmDelete'))) start(() => moderateReview(id, 'delete'));
        }}
        className={`${btn} text-muted hover:text-loss`}
      >
        {t('delete')}
      </button>
    </div>
  );
}
