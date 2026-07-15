import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

function pluralize(count, singular) {
  return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
}

function Card({ icon: Icon, label, value, sub, accent, valueClassName = '' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-12 sm:pr-16">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div
            className={`mt-1.5 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl ${valueClassName}`}
          >
            {value}
          </div>
          {sub && <p className="mt-1.5 text-sm text-gray-500">{sub}</p>}
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ currency, totals }) {
  const formatted = {
    outstanding: formatCurrency(totals.outstanding, currency),
    overdue: formatCurrency(totals.overdue, currency),
    paid: formatCurrency(totals.paid, currency),
  };

  const unpaidSub =
    totals.unpaidCount > 0
      ? `from ${pluralize(totals.unpaidCount, 'unpaid invoice')}`
      : 'no unpaid invoices';
  const overdueSub =
    totals.overdueCount > 0
      ? `across ${pluralize(totals.overdueCount, 'overdue invoice')}`
      : 'no overdue invoices';
  const paidSub =
    totals.paidCount > 0
      ? `from ${pluralize(totals.paidCount, 'paid invoice')}`
      : 'no paid invoices yet';

  return (
    <section aria-label="Invoice summary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Summary
        </h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-gray-500">
          Total Invoices: {totals.total}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 min-[1150px]:grid-cols-3">
        <Card
          icon={Wallet}
          label="Total Outstanding"
          value={formatted.outstanding}
          sub={unpaidSub}
          accent="bg-amber-50 text-amber-600"
        />
        <Card
          icon={AlertTriangle}
          label="Total Overdue"
          value={formatted.overdue}
          sub={overdueSub}
          accent="bg-red-50 text-red-600"
          valueClassName={totals.overdue > 0 ? 'text-red-600' : ''}
        />
        <div className="md:col-span-2 min-[1150px]:col-span-1">
          <Card
            icon={CheckCircle2}
            label="Total Paid"
            value={formatted.paid}
            sub={paidSub}
            accent="bg-emerald-50 text-emerald-600"
            valueClassName="text-emerald-700"
          />
        </div>
      </div>
    </section>
  );
}
