import path from 'node:path';
import { Font } from '@react-pdf/renderer';

/*
 * PDF fonts. Everything printed must use an embedded font: when no font in the stack has a glyph,
 * react-pdf falls back to the standard (non-embedded) Helvetica, which can't draw non-Latin text
 * and breaks PDF/A-3 (Factur-X).
 *
 * react-pdf handles the rest natively: a fontFamily array is a per-character fallback stack, and
 * textkit runs bidi (bidi-js) and fontkit's Arabic shaping, so mixed "Atelier Nour — مشغل نور"
 * comes out joined and in the right order. Limitations: paragraphs are always laid out LTR
 * (documents are fr/en), and characters no font covers (CJK, emoji, ...) print as "?".
 */
const fontDir = path.join(process.cwd(), 'assets', 'fonts');
const WEIGHTS = [400, 600, 700] as const;

// Primary face first: Latin text renders with the same Inter latin subset as before.
const FACES: [family: string, file: string][] = [
  ['Inter', 'inter-latin'],
  ['Inter Latin Ext', 'inter-latin-ext'],
  ['Inter Vietnamese', 'inter-vietnamese'],
  ['Inter Cyrillic', 'inter-cyrillic'],
  ['Inter Greek', 'inter-greek'],
  ['IBM Plex Sans Arabic', 'ibm-plex-sans-arabic-arabic'],
];

for (const [family, file] of FACES) {
  Font.register({ family, fonts: WEIGHTS.map((fontWeight) => ({ src: path.join(fontDir, `${file}-${fontWeight}-normal.woff`), fontWeight })) });
}
// Keep words whole (the default hyphenation cuts French words oddly)
Font.registerHyphenationCallback((word) => [word]);

export const PDF_FONT_FAMILY = FACES.map(([family]) => family);

export type PdfTextCleaner = (text: string, multiline?: boolean) => string;
let cleaner: Promise<PdfTextCleaner> | null = null;

/**
 * Returns a function making user text printable with the embedded fonts only:
 * - fr-FR number formatting uses U+202F, missing from Inter: a regular no-break space looks the same;
 * - "\n" has no glyph either (textkit would typeset it with Helvetica): kept only for multiline
 *   text, which DocumentPdf splits into one <Text> per line, else turned into a space;
 * - any other character no font covers is dropped if invisible (format/control) or printed as "?".
 */
export function pdfTextCleaner(): Promise<PdfTextCleaner> {
  cleaner ??= (async () => {
    await Promise.all(FACES.map(([fontFamily]) => Font.load({ fontFamily, fontWeight: 400 })));
    const fonts = FACES.map(([fontFamily]) => Font.getFont({ fontFamily, fontWeight: 400 }).data!);
    const cache = new Map<string, string>();
    const printable = (ch: string): string => {
      let out = cache.get(ch);
      if (out === undefined) {
        const cp = ch.codePointAt(0)!;
        out = fonts.some((f) => f.hasGlyphForCodePoint(cp)) ? ch : /\p{Cc}|\p{Cf}/u.test(ch) ? '' : '?';
        cache.set(ch, out);
      }
      return out;
    };
    return (text, multiline = false) =>
      text
        .normalize('NFC')
        .replace(/\r\n?/g, '\n')
        .replace(/\u202F/g, '\u00A0')
        .replace(/\t/g, ' ')
        .split('\n')
        .map((line) => Array.from(line, printable).join(''))
        .join(multiline ? '\n' : ' ');
  })();
  cleaner.catch(() => (cleaner = null));
  return cleaner;
}

// Fields DocumentPdf prints line by line (see Multiline there)
const MULTILINE_KEYS = new Set(['notes', 'description', 'mentions', 'footer']);

/** Deep copy of a (JSON-serialisable) view model with every string made printable. */
export function pdfSafe<T>(value: T, clean: PdfTextCleaner): T {
  const walk = (v: unknown, multiline: boolean): unknown => {
    if (typeof v === 'string') return clean(v, multiline);
    if (Array.isArray(v)) return v.map((x) => walk(x, multiline));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, MULTILINE_KEYS.has(k))]));
    return v;
  };
  // The JSON round trip turns Mongoose subdocuments and dates into plain values first
  return walk(JSON.parse(JSON.stringify(value)), false) as T;
}
