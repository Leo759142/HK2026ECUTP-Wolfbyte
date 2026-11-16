export type GlotalChar = 'modifier-apostrophe' | 'saltillo' | 'right-quote';

export const GLOTAL_CHARS = {
  'modifier-apostrophe': '\u02BC',
  'saltillo': '\uA78C',
  'right-quote': '\u2019'
} as const satisfies Record<GlotalChar, string>;

export const GLOTAL_CHAR_LABELS: Record<GlotalChar, string> = {
  'modifier-apostrophe': 'Modifier Letter Apostrophe (U+02BC) - eyectivas',
  'saltillo': 'Latin Small Letter Saltillo (U+A78C) - oclusiva glotal',
  'right-quote': 'Right Single Quotation Mark (U+2019) - puntuación/elisión'
};

const ASCII_APOSTROPHE = '\u0027';

export function normalizeGlottal(text: string, target: GlotalChar = 'modifier-apostrophe'): string {
  if (!text) return text;
  const replacement = GLOTAL_CHARS[target];
  return text.replace(new RegExp(ASCII_APOSTROPHE, 'g'), replacement);
}

export function normalizeGlottalPreservingSelection(
  input: HTMLInputElement | HTMLTextAreaElement,
  target: GlotalChar = 'modifier-apostrophe'
): void {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const originalValue = input.value;
  const normalized = normalizeGlottal(originalValue, target);
  
  if (normalized !== originalValue) {
    input.value = normalized;
    const offset = normalized.length - originalValue.length;
    input.setSelectionRange(start + offset, end + offset);
  }
}

export function createGlottalNormalizer(target: GlotalChar = 'modifier-apostrophe') {
  return (input: HTMLInputElement | HTMLTextAreaElement) => {
    const handleInput = () => normalizeGlottalPreservingSelection(input, target);
    input.addEventListener('input', handleInput);
    
    return {
      destroy() {
        input.removeEventListener('input', handleInput);
      }
    };
  };
}

export const useGlottalNormalization = createGlottalNormalizer();