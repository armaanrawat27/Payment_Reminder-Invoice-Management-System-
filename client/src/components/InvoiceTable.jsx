import { useMemo, useState } from 'react';
import { Bell, Pencil, Plus, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import SearchFilter from './SearchFilter';
import SortableHeader from './SortableHeader';
import ReminderCount from './ReminderCount';
import { sendReminder } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import { isPaid } from '../utils/status';
import {
  filterInvoices,
  hasActiveFilters,
  INITIAL_FILTERS,
} from '../utils/filters';
import { matchesCurrency } from '../utils/store';
import { INITIAL_SORT, sortInvoices, toggleSort } from '../utils/sort';

const TEXT_CELL =
  'break-words tracking-normal antialiased text-slate-900';
const MOBILE_LABEL = 'md:hidden font-semibold text-gray-500 text-xs shrink-0';
const TD_MOBILE =
  'flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0 md:table-cell md:border-0 md:px-4 md:py-3 md:align-middle';
const TR_MOBILE =
  'mb-4 flex flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm last:mb-0 md:mb-0 md:table-row md:border-0 md:bg-transparent md:p-0 md:shadow-none md:hover:bg-slate-50/80';

function formatDate(iso, currency = 'USD') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function MobileFieldLabel({ children }) {
  return <span className={MOBILE_LABEL}>{children}</span>;
}

export default function InvoiceTable({
  invoices,
  currency = 'USD',
  onTogglePaid,
  onMarkPaid,
  onEdit,
  onDelete,
  onReminderSent,
  onCreateClick,
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState(INITIAL_SORT);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState(null);

  const currencyInvoices = useMemo(
    () => invoices.filter((inv) => matchesCurrency(inv, currency)),
    [invoices, currency],
  );

  const rows = useMemo(() => {
    const filtered = filterInvoices(currencyInvoices, filters);
    return sortInvoices(filtered, sort);
  }, [currencyInvoices, filters, sort]);

  const handleSort = (column) => {
    setSort((prev) => toggleSort(prev, column));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSendReminder = async (invoice) => {
    if (isPaid(invoice)) return;
    setSendingId(invoice.id);
    try {
      const result = await sendReminder(invoice);
      onReminderSent(invoice.id, result.sentAt);
      showToast(
        `Reminder #${(invoice.reminderHistory?.length ?? 0) + 1} sent to ${invoice.clientName}`,
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleMarkPaid = (invoice) => {
    if (isPaid(invoice)) return;
    onMarkPaid(invoice.id);
    showToast(`${invoice.clientName} marked as paid`);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm antialiased tracking-normal">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 break-words">
          <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
          <p className="text-sm text-slate-500">Manage records and send payment reminders</p>
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New invoice
        </button>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <SearchFilter
          filters={filters}
          onFiltersChange={setFilters}
          resultCount={rows.length}
          totalCount={currencyInvoices.length}
        />

        <div className="rounded-lg border border-slate-100 md:scrollbar-thin md:max-h-[min(520px,60vh)] md:overflow-auto">
          <table className="block w-full text-left text-sm md:table md:min-w-[800px]">
            <thead className="hidden bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 md:sticky md:top-0 md:z-10 md:table-header-group">
              <tr className="md:table-row">
                <th className="bg-slate-50 px-4 py-3 md:table-cell">Client</th>
                <SortableHeader label="Amount" column="amount" sort={sort} onSort={handleSort} />
                <SortableHeader label="Due" column="dueDate" sort={sort} onSort={handleSort} />
                <th className="bg-slate-50 px-4 py-3 md:table-cell">Status</th>
                <th className="bg-slate-50 px-4 py-3 md:table-cell">Reminders</th>
                <th className="bg-slate-50 px-4 py-3 text-right md:table-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group md:divide-y md:divide-slate-100">
              {rows.length === 0 ? (
                <tr className="block md:table-row">
                  <td
                    colSpan={6}
                    className="block px-2 py-12 text-center md:table-cell md:px-4"
                  >
                    {hasActiveFilters(filters) ? (
                      <>
                        <p className={`${TEXT_CELL} text-slate-500`}>
                          No {currency} invoices match your filters.
                        </p>
                        <button
                          type="button"
                          onClick={() => setFilters(INITIAL_FILTERS)}
                          className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Clear all filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p className={`${TEXT_CELL} text-slate-500`}>
                          No {currency} invoices yet.
                        </p>
                        <button
                          type="button"
                          onClick={onCreateClick}
                          className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Create your first invoice
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((inv) => (
                  <tr key={inv.id} className={TR_MOBILE}>
                    <td className={`${TD_MOBILE} md:max-w-none`}>
                      <MobileFieldLabel>Client: </MobileFieldLabel>
                      <div className="min-w-0 space-y-0.5">
                        <p className={`font-medium ${TEXT_CELL}`}>{inv.clientName}</p>
                        <p className="break-all text-xs tracking-normal text-slate-400 antialiased">
                          {inv.id}
                        </p>
                      </div>
                    </td>
                    <td className={TD_MOBILE}>
                      <MobileFieldLabel>Amount: </MobileFieldLabel>
                      <div className={`min-w-0 ${TEXT_CELL}`}>
                        <span className="font-medium">
                          {formatCurrency(inv.amount, inv.currency)}
                        </span>
                        <span className="ml-1.5 text-xs text-slate-400">{inv.currency}</span>
                      </div>
                    </td>
                    <td className={TD_MOBILE}>
                      <MobileFieldLabel>Due: </MobileFieldLabel>
                      <span className={`${TEXT_CELL} text-slate-600`}>
                        {formatDate(inv.dueDate, inv.currency)}
                      </span>
                    </td>
                    <td className={TD_MOBILE}>
                      <MobileFieldLabel>Status: </MobileFieldLabel>
                      <div className="min-w-0">
                        <StatusBadge invoice={inv} onTogglePaid={onTogglePaid} />
                      </div>
                    </td>
                    <td className={TD_MOBILE}>
                      <MobileFieldLabel>Reminders: </MobileFieldLabel>
                      <div className="min-w-0">
                        <ReminderCount history={inv.reminderHistory} />
                      </div>
                    </td>
                    <td className={`${TD_MOBILE} !border-b-0 pt-1 md:text-right`}>
                      <MobileFieldLabel>Actions: </MobileFieldLabel>
                      <div className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
                        
                        {/* EDIT BUTTON */}
                        <button
                          type="button"
                          onClick={() => onEdit(inv)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit invoice"
                          aria-label={`Edit ${inv.clientName}'s invoice`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        
                        {/* MARK PAID BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(inv)}
                          disabled={isPaid(inv)}
                          className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-30"
                          title="Mark as paid"
                          aria-label={`Mark ${inv.clientName}'s invoice as paid`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        
                        {/* REMIND BUTTON */}
                        <button
                          type="button"
                          disabled={isPaid(inv) || sendingId === inv.id}
                          onClick={() => handleSendReminder(inv)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium tracking-normal text-slate-700 antialiased hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={isPaid(inv) ? 'Already paid' : 'Send reminder email'}
                          aria-label={`Send reminder to ${inv.clientName}`}
                        >
                          {sendingId === inv.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Bell className="h-3.5 w-3.5" />
                          )}
                          Remind
                        </button>
                        
                        {/* DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => onDelete(inv.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete invoice"
                          aria-label={`Delete ${inv.clientName}'s invoice`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}