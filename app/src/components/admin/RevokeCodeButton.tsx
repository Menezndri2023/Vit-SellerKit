'use client';

import { useTransition } from 'react';
import { revokeCode } from '@/app/[locale]/admin/actions';

export default function RevokeCodeButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending} onClick={() => start(() => revokeCode(id))} className="text-xs font-medium text-muted hover:text-loss disabled:opacity-50">
      {label}
    </button>
  );
}
