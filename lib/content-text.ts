/** Ignore editor spacer characters, without removing meaningful emoji joiners. */
export function visibleText(text: string) {
  const value = text.replace(/[\u200B\uFEFF]/g, '').replace(/\u00a0/g, ' ');
  return /[^\s\u200C\u200D\u2060]/u.test(value) ? value.trim() : '';
}
