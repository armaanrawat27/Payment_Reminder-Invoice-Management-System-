/**
 * Display statuses shown in the UI and filters.
 * "Sent" is not a status — use reminderHistory for that.
 */
export const DISPLAY_STATUSES = ['Pending', 'Overdue', 'Paid'];

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export function isPaid(invoice) {
  return invoice?.status === 'Paid';
}

/**
 * Derives the badge status from stored payment state + due date.
 * Paid is stored explicitly; otherwise Pending or Overdue is computed.
 */
export function getInvoiceStatus(invoice) {
  if (isPaid(invoice)) return 'Paid';

  const due = startOfDay(new Date(invoice.dueDate));
  const today = startOfDay();

  return due < today ? 'Overdue' : 'Pending';
}
