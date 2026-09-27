/**
 * Locale used for Intl formatting. Arabic UI shows Latin digits (123), the norm in the Maghreb
 * and what people type; Arabic-Indic digits typed by users are still accepted (see normalizeDigits).
 */
export const fmtLocale = (locale: string) => (locale === 'ar' ? 'ar-u-nu-latn' : locale);

/** Arabic-Indic / Persian digits and Arabic separators → ASCII, before parsing numbers. */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.') // Arabic decimal separator
    .replace(/٬/g, ''); // Arabic thousands separator
}

export const isRtl = (locale: string) => locale === 'ar';
