/** Server-side mirror of client status derivation for emails. */
export function getInvoiceStatus(invoice) {
  if (invoice?.status === 'Paid') return 'Paid';

  const due = new Date(invoice.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today ? 'Overdue' : 'Pending';
}
