/**
 * Format a number as Philippine Peso (PHP) currency.
 */
export function formatMoney(n) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(n) || 0);
}
