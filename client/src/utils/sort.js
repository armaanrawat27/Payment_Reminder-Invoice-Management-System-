/** Parse YYYY-MM-DD as local midnight for reliable chronological compare. */
function parseLocalDate(isoDate) {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export const INITIAL_SORT = { key: null, direction: 'asc' };

/**
 * Sort a copy of invoices after filters are applied.
 * @param {{ key: 'amount' | 'dueDate' | null, direction: 'asc' | 'desc' }} sort
 */
export function sortInvoices(invoices, sort) {
  if (!sort.key) return invoices;

  const dir = sort.direction === 'desc' ? -1 : 1;

  return [...invoices].sort((a, b) => {
    if (sort.key === 'amount') {
      return (Number(a.amount) - Number(b.amount)) * dir;
    }

    if (sort.key === 'dueDate') {
      const timeA = parseLocalDate(a.dueDate)?.getTime() ?? 0;
      const timeB = parseLocalDate(b.dueDate)?.getTime() ?? 0;
      return (timeA - timeB) * dir;
    }

    return 0;
  });
}

export function toggleSort(current, column) {
  if (current.key === column) {
    return { key: column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  return { key: column, direction: 'asc' };
}
