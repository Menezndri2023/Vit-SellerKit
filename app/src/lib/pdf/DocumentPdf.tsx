import path from 'node:path';
import { Document as PdfDocument, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import en from '../../../messages/en.json';
import fr from '../../../messages/fr.json';
import type { DocView } from '../documents/view-model';
import { formatMinor } from '../money';

const fontDir = path.join(process.cwd(), 'assets', 'fonts');
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontDir, 'inter-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(fontDir, 'inter-latin-600-normal.woff'), fontWeight: 600 },
    { src: path.join(fontDir, 'inter-latin-700-normal.woff'), fontWeight: 700 },
  ],
});
// Keep words whole (the default hyphenation cuts French words oddly)
Font.registerHyphenationCallback((word) => [word]);

const INK = '#0F172A';
const MUTED = '#64748B';
const LINE = '#E2E8F0';

const s = StyleSheet.create({
  page: { fontFamily: 'Inter', fontSize: 9, color: INK, padding: 40, paddingBottom: 60, lineHeight: 1.45 },
  row: { flexDirection: 'row' },
  between: { flexDirection: 'row', justifyContent: 'space-between' },
  muted: { color: MUTED },
  bold: { fontWeight: 700 },
  semibold: { fontWeight: 600 },
  label: { fontSize: 7.5, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'right', lineHeight: 1.2, marginBottom: 4 },
  box: { backgroundColor: '#F8FAFC', borderRadius: 6, padding: 10, width: '48%' },
  th: { fontSize: 7.5, fontWeight: 600, color: MUTED, textTransform: 'uppercase', paddingVertical: 5 },
  td: { paddingVertical: 6 },
  num: { textAlign: 'right' },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, fontSize: 7, color: MUTED, textAlign: 'center' },
  watermark: { position: 'absolute', top: 330, left: 0, right: 0, textAlign: 'center', fontSize: 90, fontWeight: 700, color: '#0F172A', opacity: 0.05, transform: 'rotate(-30deg)' },
});

type Messages = typeof en;
const COLS = { desc: '42%', qty: '10%', price: '15%', disc: '8%', vat: '8%', amount: '17%' };

export type PdfExtras = { logo?: { data: Buffer; format: 'png' | 'jpg' }; epcQr?: string | null };

export function DocumentPdf({ doc, extras }: { doc: DocView; extras: PdfExtras }) {
  const m: Messages = doc.lang === 'fr' ? fr : en;
  const t = (key: keyof Messages['doc'], vars: Record<string, string | number> = {}) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), m.doc[key]);
  const intl = doc.lang === 'fr' ? 'fr-FR' : 'en-GB';
  const money = (minor: number) => formatMinor(minor, doc.currency, intl);
  const date = (iso?: string) => (iso ? new Intl.DateTimeFormat(intl, { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(iso)) : '');
  const qty = (n: number) => new Intl.NumberFormat(intl, { maximumFractionDigits: 3 }).format(n);
  const countries = new Intl.DisplayNames([intl], { type: 'region' });
  const unit = (code: string) => (code === 'C62' ? '' : ` ${(m.catalog.units as Record<string, string>)[code]?.toLowerCase() ?? ''}`);
  const vatLabel = (c: string) => (m.catalog.vat as Record<string, string>)[c] ?? c;
  const seller = doc.seller;
  const buyer = doc.buyer;
  const payable = doc.type === 'invoice' || doc.type === 'deposit_invoice';
  const showDiscount = doc.lines.some((l) => l.discountPct > 0);
  const descWidth = showDiscount ? COLS.desc : `${42 + 8}%`;
  const address = (a?: { line1?: string; line2?: string; postalCode?: string; city?: string; region?: string; country?: string }) =>
    a ? [a.line1, a.line2, [a.postalCode, a.city, a.region].filter(Boolean).join(' '), a.country ? countries.of(a.country) : ''].filter(Boolean) : [];
  const title = `${t(doc.type)} ${doc.number ?? ''}`.trim();
  // French typography puts a space before the colon; English doesn't
  const c = doc.lang === 'fr' ? ' :' : ':';

  return (
    <PdfDocument title={title} author={seller?.legalName} creator="Margokit" producer="Margokit" language={doc.lang}>
      <Page size="A4" style={s.page}>
        {(doc.isDraft || doc.watermark) && <Text style={s.watermark} fixed>{doc.isDraft ? t('draft') : 'MARGOKIT'}</Text>}

        {/* Header */}
        <View style={s.between}>
          <View style={{ width: '55%' }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf images have no alt attribute */}
            {extras.logo && <Image src={extras.logo} style={{ maxHeight: 48, maxWidth: 160, objectFit: 'contain', marginBottom: 10 }} />}
            <Text style={[s.bold, { fontSize: 11 }]}>{seller?.tradeName || seller?.legalName}</Text>
            {seller?.tradeName && <Text>{seller.legalName}</Text>}
            {address(seller?.address).map((l) => (
              <Text key={l} style={s.muted}>
                {l}
              </Text>
            ))}
            {[seller?.email, seller?.phone, seller?.website].filter(Boolean).length > 0 && <Text style={s.muted}>{[seller?.email, seller?.phone, seller?.website].filter(Boolean).join(' · ')}</Text>}
            {doc.sellerIds.map((i) => (
              <Text key={i.label} style={s.muted}>
                {i.label}{c} {i.value}
              </Text>
            ))}
          </View>
          <View style={{ width: '42%', alignItems: 'flex-end' }}>
            <Text style={s.title}>{t(doc.type)}</Text>
            <Text style={[s.semibold, { marginTop: 2 }]}>
              {t('number')} {doc.number ?? '—'}
            </Text>
            <Text style={s.muted}>
              {t('issueDate')}{c} {date(doc.issueDate)}
            </Text>
            {payable && doc.dueDate && (
              <Text style={s.muted}>
                {t('dueDate')}{c} {date(doc.dueDate)}
              </Text>
            )}
            {doc.type === 'quote' && doc.validUntil && (
              <Text style={s.muted}>
                {t('validUntil')}{c} {date(doc.validUntil)}
              </Text>
            )}
            {doc.serviceDate && (
              <Text style={s.muted}>
                {t('serviceDate')}{c} {date(doc.serviceDate)}
              </Text>
            )}
            {doc.buyerReference && (
              <Text style={s.muted}>
                {t('reference')}{c} {doc.buyerReference}
              </Text>
            )}
          </View>
        </View>

        {/* Parties */}
        <View style={[s.between, { marginTop: 22 }]}>
          <View style={s.box}>
            <Text style={s.label}>{t('billTo')}</Text>
            <Text style={[s.semibold, { marginTop: 3 }]}>{buyer?.name ?? '—'}</Text>
            {buyer?.contactName && <Text>{buyer.contactName}</Text>}
            {address(buyer?.address).map((l) => (
              <Text key={l} style={s.muted}>
                {l}
              </Text>
            ))}
            {doc.buyerIds.map((i) => (
              <Text key={i.label} style={s.muted}>
                {i.label}{c} {i.value}
              </Text>
            ))}
          </View>
          {buyer?.deliveryAddress ? (
            <View style={s.box}>
              <Text style={s.label}>{t('deliverTo')}</Text>
              {address(buyer.deliveryAddress).map((l) => (
                <Text key={l} style={[s.muted, { marginTop: 1 }]}>
                  {l}
                </Text>
              ))}
            </View>
          ) : (
            <View style={{ width: '48%' }} />
          )}
        </View>

        {/* Lines */}
        <View style={{ marginTop: 22 }}>
          <View style={[s.row, { borderBottomWidth: 1.5, borderBottomColor: INK }]} fixed>
            <Text style={[s.th, { width: descWidth }]}>{t('description')}</Text>
            <Text style={[s.th, s.num, { width: COLS.qty }]}>{t('qty')}</Text>
            <Text style={[s.th, s.num, { width: COLS.price }]}>{t('unitPrice')}</Text>
            {showDiscount && <Text style={[s.th, s.num, { width: COLS.disc }]}>{t('discount')}</Text>}
            <Text style={[s.th, s.num, { width: COLS.vat }]}>{t('vat')}</Text>
            <Text style={[s.th, s.num, { width: COLS.amount }]}>{t('amount')}</Text>
          </View>
          {doc.lines.map((l, i) => (
            <View key={i} style={[s.row, { borderBottomWidth: 0.5, borderBottomColor: LINE }]} wrap={false}>
              <Text style={[s.td, { width: descWidth, paddingRight: 8 }]}>{l.description}</Text>
              <Text style={[s.td, s.num, { width: COLS.qty }]}>
                {qty(l.qty)}
                {unit(l.unitCode)}
              </Text>
              <Text style={[s.td, s.num, { width: COLS.price }]}>{money(l.unitPrice)}</Text>
              {showDiscount && <Text style={[s.td, s.num, { width: COLS.disc }]}>{l.discountPct ? `${l.discountPct}${c === ':' ? '%' : ' %'}` : ''}</Text>}
              <Text style={[s.td, s.num, { width: COLS.vat }]}>{l.vatCategory === 'S' ? `${l.taxRate}${c === ':' ? '%' : ' %'}` : l.vatCategory}</Text>
              <Text style={[s.td, s.num, { width: COLS.amount }]}>{money(l.net)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ alignItems: 'flex-end', marginTop: 12 }} wrap={false}>
          <View style={{ width: 210 }}>
            <View style={[s.between, { paddingVertical: 2 }]}>
              <Text>{t('totalExcl')}</Text>
              <Text>{money(doc.totals.totalExclTax)}</Text>
            </View>
            {doc.totals.taxBreakdown.map((g) => (
              <View key={`${g.category}-${g.rate}`} style={[s.between, { paddingVertical: 2 }]}>
                <Text style={s.muted}>{g.category === 'S' ? t('tax', { rate: g.rate }) : vatLabel(g.category)}</Text>
                <Text style={s.muted}>{money(g.amount)}</Text>
              </View>
            ))}
            <View style={[s.between, { borderTopWidth: 1.5, borderTopColor: INK, marginTop: 4, paddingTop: 5 }]}>
              <Text style={[s.bold, { fontSize: 11 }]}>{t('totalIncl')}</Text>
              <Text style={[s.bold, { fontSize: 11 }]}>{money(doc.totals.totalInclTax)}</Text>
            </View>
            {payable && doc.paid > 0 && (
              <>
                <View style={[s.between, { paddingVertical: 2 }]}>
                  <Text style={s.muted}>{t('paid')}</Text>
                  <Text style={s.muted}>− {money(doc.paid)}</Text>
                </View>
                <View style={[s.between, { paddingVertical: 2 }]}>
                  <Text style={s.bold}>{t('amountDue')}</Text>
                  <Text style={s.bold}>{money(doc.amountDue)}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Payment */}
        {payable && (
          <View style={[s.between, { marginTop: 20, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: LINE }]} wrap={false}>
            <View style={{ width: extras.epcQr ? '70%' : '100%' }}>
              {doc.dueDate && <Text style={s.semibold}>{t('paymentTerms', { date: date(doc.dueDate) })}</Text>}
              {(seller?.bankAccount?.iban || seller?.bankAccount?.accountNumber) && (
                <View style={{ marginTop: 6 }}>
                  <Text style={s.label}>{t('bank')}</Text>
                  {seller.bankAccount.holder && <Text style={s.muted}>{seller.bankAccount.holder}</Text>}
                  {seller.bankAccount.bankName && <Text style={s.muted}>{seller.bankAccount.bankName}</Text>}
                  {seller.bankAccount.iban && (
                    <Text style={s.muted}>
                      {t('iban')}{c} {seller.bankAccount.iban.replace(/(.{4})/g, '$1 ').trim()}
                    </Text>
                  )}
                  {seller.bankAccount.bic && (
                    <Text style={s.muted}>
                      {t('bic')}{c} {seller.bankAccount.bic}
                    </Text>
                  )}
                  {!seller.bankAccount.iban && seller.bankAccount.accountNumber && (
                    <Text style={s.muted}>
                      {t('account')}{c} {seller.bankAccount.accountNumber}
                    </Text>
                  )}
                </View>
              )}
              {seller?.paymentLinks?.map((l) => (
                <Link key={l.url} src={l.url!} style={{ marginTop: 6, color: '#4D7C0F', fontWeight: 600 }}>
                  {t('payOnline')}
                  {l.label ? ` — ${l.label}` : ''}{c} {l.url}
                </Link>
              ))}
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf images have no alt attribute */}
            {extras.epcQr && <Image src={extras.epcQr} style={{ width: 80, height: 80 }} />}
          </View>
        )}

        {doc.notes && (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={s.label}>{t('notes')}</Text>
            <Text style={{ marginTop: 2 }}>{doc.notes}</Text>
          </View>
        )}

        {doc.mentions.length > 0 && (
          <View style={{ marginTop: 18, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: LINE }} wrap={false}>
            {doc.mentions.map((line) => (
              <Text key={line} style={{ fontSize: 7.5, color: MUTED }}>
                {line}
              </Text>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          {seller?.footer && <Text>{seller.footer}</Text>}
          {doc.watermark && <Text style={s.semibold}>{t('madeWith')}</Text>}
          <Text render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${title} — ${pageNumber}/${totalPages}` : '')} />
        </View>
      </Page>
    </PdfDocument>
  );
}
