import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CURRENCIES } from '../utils/store';
import { getInvoiceStatus } from '../utils/status';

const EMPTY = {
  clientName: '',
  clientEmail: '',
  amount: '',
  currency: 'USD',
  dueDate: '',
  markPaid: false,
};

export default function InvoiceModal({ open, invoice, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const isEdit = Boolean(invoice?.id);

  useEffect(() => {
    if (!open) return;
    if (invoice) {
      setForm({
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail || '',
        amount: String(invoice.amount),
        currency: invoice.currency === 'INR' ? 'INR' : 'USD',
        dueDate: invoice.dueDate,
        markPaid: invoice.status === 'Paid',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, invoice]);

  if (!open) return null;

  const previewStatus =
    isEdit && invoice
      ? getInvoiceStatus({
          ...invoice,
          status: form.markPaid ? 'Paid' : 'Pending',
          dueDate: form.dueDate || invoice.dueDate,
        })
      : form.dueDate
        ? getInvoiceStatus({ status: form.markPaid ? 'Paid' : 'Pending', dueDate: form.dueDate })
        : 'Pending';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      clientName: form.clientName.trim(),
      clientEmail: form.clientEmail.trim(),
      amount: parseFloat(form.amount),
      currency: form.currency,
      dueDate: form.dueDate,
      status: form.markPaid ? 'Paid' : 'Pending',
    });
  };

  const set = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="invoice-modal-title" className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Client name</span>
            <input
              required
              value={form.clientName}
              onChange={set('clientName')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Client email</span>
            <input
              type="email"
              required
              value={form.clientEmail}
              onChange={set('clientEmail')}
              placeholder="for payment reminders"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Amount</span>
              <input
                required
                type="number"
                min="0"
                step={form.currency === 'INR' ? '1' : '0.01'}
                value={form.amount}
                onChange={set('amount')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Currency</span>
              <select
                value={form.currency}
                onChange={set('currency')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c === 'INR' ? 'INR (₹)' : 'USD ($)'}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Due date</span>
            <input
              required
              type="date"
              value={form.dueDate}
              onChange={set('dueDate')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={form.markPaid}
              onChange={set('markPaid')}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-slate-700">Mark as paid</span>
          </label>
          {form.dueDate && (
            <p className="text-xs text-slate-500">
              Status preview:{' '}
              <span className="font-semibold text-slate-700">{previewStatus}</span>
              {!form.markPaid && ' (auto-updates from due date)'}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
            >
              {isEdit ? 'Save changes' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
