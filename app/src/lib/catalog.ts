/** Code lists from the EN 16931 standard, with UI labels. */

/** UN/ECE Recommendation 20 unit codes (subset used by small businesses). */
export const UNIT_CODES = ['C62', 'HUR', 'DAY', 'WEE', 'MON', 'ANN', 'KGM', 'MTR', 'LTR', 'MTK', 'SET', 'E48'] as const;
export type UnitCode = (typeof UNIT_CODES)[number];

/** VAT category codes (UNCL5305). */
export const VAT_CATEGORIES = ['S', 'Z', 'E', 'AE', 'K', 'G', 'O'] as const;
export type VatCategory = (typeof VAT_CATEGORIES)[number];

export const VAT_REGIMES = ['standard', 'franchise', 'exempt', 'not_registered'] as const;
export type VatRegime = (typeof VAT_REGIMES)[number];

export const DOC_LOCALES = ['en', 'fr'] as const;
export type DocLocale = (typeof DOC_LOCALES)[number];
