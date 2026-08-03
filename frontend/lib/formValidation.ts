export function fieldError(value: string, error: string, touched: boolean): string {
  if (error && value.trim() === '' && !touched) return '';
  return error;
}
