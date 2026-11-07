// Money is always an integer number of so'm. Never use floats for amounts.

/** "1250000" -> "1 250 000" */
export function groupDigits(n: number): string {
  const s = Math.abs(Math.trunc(n)).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 1250000 -> "1 250 000 so'm", -5000 -> "-5 000 so'm" */
export function formatMoney(n: number, opts: { sign?: boolean } = {}): string {
  const sign = n < 0 ? '-' : opts.sign && n > 0 ? '+' : '';
  return `${sign}${groupDigits(n)} so'm`;
}

/** Keeps digits only: "1 250 000" -> 1250000. Empty -> 0. Caps at 1 trillion. */
export function parseAmount(input: string): number {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '').slice(0, 13);
  if (!digits) return 0;
  return Math.min(Number(digits), 1_000_000_000_000);
}

/** For a live input field: what the user typed, re-grouped. */
export function formatAmountInput(input: string): string {
  const n = parseAmount(input);
  return n === 0 ? '' : groupDigits(n);
}

/** Uzbek mobile number: 9 digits after +998. */
export function parsePhone(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('998') && d.length > 9) d = d.slice(3);
  return d.slice(0, 9);
}

export function isValidPhone(digits9: string): boolean {
  return /^\d{9}$/.test(digits9);
}

/** "901234567" -> "+998 90 123 45 67" (partial input formats partially) */
export function formatPhone(digits: string): string {
  const d = parsePhone(digits);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.length ? `+998 ${parts.join(' ')}` : '';
}
