/**
 * EPC QR code payload ("SEPA credit transfer" QR, European Payments Council guideline 069-12, v002).
 * Banking apps in the euro area scan it to pre-fill the transfer. Only for EUR amounts to an IBAN.
 */
export function epcPayload({ name, iban, bic, amountMinor, reference }: { name: string; iban: string; bic?: string; amountMinor: number; reference: string }): string | null {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(cleanIban)) return null;
  if (amountMinor < 1 || amountMinor > 99_999_999_999) return null;
  const amount = `EUR${(amountMinor / 100).toFixed(2)}`;
  return ['BCD', '002', '1', 'SCT', (bic ?? '').replace(/\s/g, '').toUpperCase(), name.slice(0, 70), cleanIban, amount, '', '', reference.slice(0, 140)].join('\n');
}
