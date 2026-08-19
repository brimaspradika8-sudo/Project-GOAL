export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'Hubungi';
  return `Rp${value.toLocaleString('id-ID')}`;
}
