import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export default function SortableHeader({ label, column, sort, onSort }) {
  const active = sort.key === column;

  const Icon = active
    ? sort.direction === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <th className="sticky top-0 z-10 bg-slate-50 px-4 py-3 md:table-cell">
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-1 rounded-md transition-colors hover:text-slate-800 ${
          active ? 'text-brand-600' : 'text-slate-500'
        }`}
        aria-label={`Sort by ${label}${active ? `, ${sort.direction}ending` : ''}`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </th>
  );
}
