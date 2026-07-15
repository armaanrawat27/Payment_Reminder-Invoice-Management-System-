import { getInvoiceStatus, isPaid } from '../utils/status';

const STYLES = {
  Pending: 'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100',
  Overdue: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100',
};

export default function StatusBadge({ invoice, onTogglePaid }) {
  const status = getInvoiceStatus(invoice);

  const handleClick = () => {
    onTogglePaid(invoice.id, !isPaid(invoice));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={
        isPaid(invoice)
          ? 'Click to mark as unpaid'
          : 'Click to mark as paid'
      }
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset transition-colors ${STYLES[status]}`}
    >
      {status}
    </button>
  );
}
