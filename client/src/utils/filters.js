import { getInvoiceStatus } from './status';

export const INITIAL_FILTERS = {
  search: '',
  status: 'All',
};

export function hasActiveFilters(filters) {
  return filters.search.trim() !== '' || filters.status !== 'All';
}

export function matchesFilters(invoice, filters) {
  const query = filters.search.trim().toLowerCase();
  if (query) {
    const q = query.toLowerCase();
    const match =
      invoice.clientName.toLowerCase().includes(q) ||
      invoice.id.toLowerCase().includes(q) ||
      (invoice.clientEmail || '').toLowerCase().includes(q);
    if (!match) return false;
  }

  if (filters.status !== 'All' && getInvoiceStatus(invoice) !== filters.status) {
    return false;
  }

  return true;
}

export function filterInvoices(invoices, filters) {
  return invoices.filter((inv) => matchesFilters(inv, filters));
}
