const TABS = [
  { id: 'USD', label: 'USD ($)' },
  { id: 'INR', label: 'INR (₹)' },
];

export default function CurrencyTabs({ activeCurrency, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Invoice currency"
      className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner sm:w-auto"
    >
      {TABS.map(({ id, label }) => {
        const active = activeCurrency === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all sm:px-5 ${
              active
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
