'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { grantPro, revokePro } from '@/app/[locale]/admin/actions';

const btn = 'h-9 rounded-lg border border-line px-3 text-xs font-medium hover:bg-bg disabled:opacity-50';

export default function UserActions({ userId, isPro }: { userId: string; isPro: boolean }) {
  const t = useTranslations('admin.users');
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <button type="button" disabled={pending} className={btn} onClick={() => start(() => grantPro(userId, 30))}>
        {t('grant30')}
      </button>
      <button type="button" disabled={pending} className={btn} onClick={() => start(() => grantPro(userId, 365))}>
        {t('grant365')}
      </button>
      <button type="button" disabled={pending} className={btn} onClick={() => start(() => grantPro(userId, null))}>
        {t('grantLifetime')}
      </button>
      {isPro && (
        <button type="button" disabled={pending} className={`${btn} text-loss`} onClick={() => confirm(t('confirmRevoke')) && start(() => revokePro(userId))}>
          {t('revoke')}
        </button>
      )}
    </div>
  );
}
