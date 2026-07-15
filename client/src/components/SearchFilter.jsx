import { Search, Filter, X } from 'lucide-react';
import { DISPLAY_STATUSES } from '../utils/status';
import { hasActiveFilters, INITIAL_FILTERS } from '../utils/filters';

export default function SearchFilter({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
}) {
  const active = hasActiveFilters(filters);

  const set = (field) => (e) => {
    onFiltersChange({ ...filters, [field]: e.target.value });
  };

  const clearFilters = () => onFiltersChange({ ...INITIAL_FILTERS });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search by client name, email or invoice ID…"
            value={filters.search}
            onChange={set('search')}
            aria-label="Search invoices by client name"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <select
            value={filters.status}
            onChange={set('status')}
            aria-label="Filter by invoice status"
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="All">All statuses</option>
            {DISPLAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {active && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:shrink-0"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500" aria-live="polite">
        Showing <span className="font-semibold text-slate-700">{resultCount}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalCount}</span> invoices
        {active && ' (filtered)'}
      </p>
    </div>
  );
}
