import { getTranslations } from 'next-intl/server';
import type { DocView } from '@/lib/documents/view-model';
import { formatMinor } from '@/lib/money';

type AddressValue = { line1?: string; line2?: string; postalCode?: string; city?: string; region?: string; country?: string };

function Address({ a, countries }: { a?: AddressValue; countries: Intl.DisplayNames }) {
  if (!a) return null;
  return (
    <>
      <span className="block">{a.line1}</span>
      {a.line2 && <span className="block">{a.line2}</span>}
      <span className="block">{[a.postalCode, a.city, a.region].filter(Boolean).join(' ')}</span>
      {a.country && <span className="block">{countries.of(a.country)}</span>}
    </>
  );
}

/** The document as the client sees it, in the document's language (not the UI language). */
export default async function DocumentView({ doc }: { doc: DocView }) {
  const t = await getTranslations({ locale: doc.lang, namespace: 'doc' });
  const tc = await getTranslations({ locale: doc.lang, namespace: 'catalog' });
  const intl = doc.lang === 'fr' ? 'fr-FR' : 'en-GB';
  const date = (iso?: string) => (iso ? new Intl.DateTimeFormat(intl, { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(iso)) : '');
  const money = (minor: number) => formatMinor(minor, doc.currency, intl);
  const qty = (n: number) => new Intl.NumberFormat(intl, { maximumFractionDigits: 3 }).format(n);
  const countries = new Intl.DisplayNames([intl], { type: 'region' });
  const s = doc.seller;
  const b = doc.buyer;
  const showDiscount = doc.lines.some((l) => l.discountPct > 0);
  const isPayable = doc.type === 'invoice' || doc.type === 'deposit_invoice';
  const c = doc.lang === 'fr' ? ' :' : ':';


  return (
    <article lang={doc.lang} className="relative overflow-hidden rounded-2xl border border-line bg-white p-6 text-[13px] leading-relaxed text-slate-900 shadow-sm sm:p-10">
      {doc.isDraft && (
        <span aria-hidden className="pointer-events-none absolute inset-0 grid select-none place-items-center text-7xl font-extrabold tracking-widest text-slate-900/[0.05] sm:text-9xl">
          {t('draft')}
        </span>
      )}

      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          {s?.logoKey && (
            // eslint-disable-next-line @next/next/no-img-element -- user logo from our API
            <img src={`/api/logo/${s.logoKey}`} alt="" className="mb-4 max-h-16 max-w-48 object-contain" />
          )}
          <p className="text-base font-bold">{s?.tradeName || s?.legalName}</p>
          {s?.tradeName && <p>{s.legalName}</p>}
          <p className="text-slate-600">
            <Address a={s?.address} countries={countries} />
          </p>
          <p className="text-slate-600">{[s?.email, s?.phone, s?.website].filter(Boolean).join(' · ')}</p>
          {doc.sellerIds.map((i) => (
            <p key={i.label} className="text-slate-600">
              {i.label}{c} {i.value}
            </p>
          ))}
        </div>
        <div className="sm:text-end">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide">{t(doc.type)}</h2>
          <p className="mt-1 font-semibold">
            {t('number')} {doc.number ?? '—'}
          </p>
          <dl className="mt-2 text-slate-600">
            <div>
              {t('issueDate')}{c} {date(doc.issueDate)}
            </div>
            {doc.dueDate && isPayable && (
              <div>
                {t('dueDate')}{c} {date(doc.dueDate)}
              </div>
            )}
            {doc.validUntil && doc.type === 'quote' && (
              <div>
                {t('validUntil')}{c} {date(doc.validUntil)}
              </div>
            )}
            {doc.serviceDate && (
              <div>
                {t('serviceDate')}{c} {date(doc.serviceDate)}
              </div>
            )}
            {doc.buyerReference && (
              <div>
                {t('reference')}{c} {doc.buyerReference}
              </div>
            )}
          </dl>
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('billTo')}</p>
          <p className="mt-1 font-semibold">{b?.name ?? '—'}</p>
          {b?.contactName && <p>{b.contactName}</p>}
          <p className="text-slate-600">
            <Address a={b?.address} countries={countries} />
          </p>
          {doc.buyerIds.map((i) => (
            <p key={i.label} className="text-slate-600">
              {i.label}{c} {i.value}
            </p>
          ))}
        </div>
        {b?.deliveryAddress && (
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('deliverTo')}</p>
            <p className="mt-1 text-slate-600">
              <Address a={b.deliveryAddress} countries={countries} />
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse sm:min-w-[560px]">
          <thead>
            <tr className="border-b-2 border-slate-900 text-start text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pe-3 text-start font-semibold">{t('description')}</th>
              <th className="px-3 py-2 text-end font-semibold max-sm:hidden">{t('qty')}</th>
              <th className="px-3 py-2 text-end font-semibold max-sm:hidden">{t('unitPrice')}</th>
              {showDiscount && <th className="px-3 py-2 text-end font-semibold max-sm:hidden">{t('discount')}</th>}
              <th className="px-3 py-2 text-end font-semibold max-sm:hidden">{t('vat')}</th>
              <th className="py-2 ps-3 text-end font-semibold">{t('amount')}</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {doc.lines.map((l, i) => (
              <tr key={i} className="border-b border-slate-200 align-top">
                <td className="py-2.5 pe-3 whitespace-pre-line">
                  {l.description}
                  {/* Phones: quantity, unit price, discount and VAT under the description instead of 4 columns */}
                  <span className="mt-0.5 block text-sm text-slate-500 sm:hidden">
                    {qty(l.qty)} {l.unitCode !== 'C62' ? tc(`units.${l.unitCode}`).toLowerCase() : ''} × {money(l.unitPrice)}
                    {l.discountPct ? ` · −${l.discountPct}${c === ':' ? '%' : ' %'}` : ''}
                    {' · '}
                    {l.vatCategory === 'S' ? `${t('vat')} ${l.taxRate}${c === ':' ? '%' : ' %'}` : l.vatCategory}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-end whitespace-nowrap max-sm:hidden">
                  {qty(l.qty)} {l.unitCode !== 'C62' ? tc(`units.${l.unitCode}`).toLowerCase() : ''}
                </td>
                <td className="px-3 py-2.5 text-end whitespace-nowrap max-sm:hidden">{money(l.unitPrice)}</td>
                {showDiscount && <td className="px-3 py-2.5 text-end max-sm:hidden">{l.discountPct ? `${l.discountPct}${c === ':' ? '%' : ' %'}` : ''}</td>}
                <td className="px-3 py-2.5 text-end whitespace-nowrap max-sm:hidden">{l.vatCategory === 'S' ? `${l.taxRate}${c === ':' ? '%' : ' %'}` : l.vatCategory}</td>
                <td className="py-2.5 ps-3 text-end whitespace-nowrap">{money(l.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-6 flex justify-end">
        <dl className="tabular w-full max-w-xs">
          <div className="flex justify-between py-1">
            <dt>{t('totalExcl')}</dt>
            <dd>{money(doc.totals.totalExclTax)}</dd>
          </div>
          {doc.totals.taxBreakdown.map((g) => (
            <div key={`${g.category}-${g.rate}`} className="flex justify-between py-1 text-slate-600">
              <dt>{g.category === 'S' ? t('tax', { rate: g.rate }) : t('taxCategory', { category: tc(`vat.${g.category}`) })}</dt>
              <dd>{money(g.amount)}</dd>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t-2 border-slate-900 py-2 text-base font-extrabold">
            <dt>{t('totalIncl')}</dt>
            <dd>{money(doc.totals.totalInclTax)}</dd>
          </div>
          {isPayable && doc.paid > 0 && (
            <>
              <div className="flex justify-between py-1 text-slate-600">
                <dt>{t('paid')}</dt>
                <dd>− {money(doc.paid)}</dd>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <dt>{t('amountDue')}</dt>
                <dd>{money(doc.amountDue)}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      {isPayable && (s?.bankAccount?.iban || s?.bankAccount?.accountNumber || s?.paymentLinks?.length || doc.dueDate) && (
        <section className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
          <div>
            {doc.dueDate && <p className="font-semibold">{t('paymentTerms', { date: date(doc.dueDate) })}</p>}
            {(s?.bankAccount?.iban || s?.bankAccount?.accountNumber) && (
              <div className="mt-2 text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('bank')}</p>
                {s.bankAccount.holder && <p>{s.bankAccount.holder}</p>}
                {s.bankAccount.bankName && <p>{s.bankAccount.bankName}</p>}
                {s.bankAccount.iban && (
                  <p>
                    {t('iban')}{c} {s.bankAccount.iban.replace(/(.{4})/g, '$1 ').trim()}
                  </p>
                )}
                {s.bankAccount.bic && (
                  <p>
                    {t('bic')}{c} {s.bankAccount.bic}
                  </p>
                )}
                {!s.bankAccount.iban && s.bankAccount.accountNumber && (
                  <p>
                    {t('account')}{c} {s.bankAccount.accountNumber}
                  </p>
                )}
              </div>
            )}
          </div>
          {s?.paymentLinks && s.paymentLinks.length > 0 && (
            <div className="flex flex-col gap-2 sm:items-end">
              {s.paymentLinks.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
                  {t('payOnline')}
                  {l.label ? ` — ${l.label}` : ''}
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {doc.notes && (
        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('notes')}</p>
          <p className="mt-1 whitespace-pre-line">{doc.notes}</p>
        </section>
      )}

      {doc.mentions.length > 0 && (
        <footer className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
          {doc.mentions.map((m) => (
            <p key={m} className="whitespace-pre-line">
              {m}
            </p>
          ))}
        </footer>
      )}
      {s?.footer && <p className="mt-2 text-center text-[11px] text-slate-500">{s.footer}</p>}
      {doc.watermark && <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">{t('madeWith')}</p>}
    </article>
  );
}
