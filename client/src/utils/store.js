/**
 * Invoice store backed by Express / PostgreSQL via /api/invoices.
 */

import { getInvoiceStatus, isPaid } from './status.js';

export { DISPLAY_STATUSES } from './status.js';
export { CURRENCIES } from './currency.js';

const API_BASE = '/api/invoices';
const AUTH_TOKEN_KEY = 'payremind_token';

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeInvoice(inv) {
  if (!inv || typeof inv !== 'object') return inv;
  return {
    ...inv,
    currency: inv.currency === 'INR' ? 'INR' : 'USD',
    status: isPaid(inv) ? 'Paid' : 'Pending',
  };
}

function normalizeInvoices(invoices) {
  return Array.isArray(invoices) ? invoices.map(normalizeInvoice) : [];
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export async function loadInvoices() {
  const invoices = await fetchJson(API_BASE);
  return normalizeInvoices(invoices);
}

export async function createInvoice(invoice) {
  const created = await fetchJson(API_BASE, {
    method: 'POST',
    body: JSON.stringify(invoice),
  });
  return normalizeInvoice(created);
}

export async function updateInvoice(id, invoice) {
  const updated = await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(invoice),
  });
  return normalizeInvoice(updated);
}

export async function deleteInvoice(id) {
  await fetchJson(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function invoiceCurrency(invoice) {
  return invoice.currency === 'INR' ? 'INR' : 'USD';
}

export function matchesCurrency(invoice, currency) {
  return invoiceCurrency(invoice) === currency;
}

/** Amount and count totals for one currency — does not mutate invoices. */
export function computeCurrencyTotals(invoices, currency) {
  const code = currency === 'INR' ? 'INR' : 'USD';
  let outstanding = 0;
  let overdue = 0;
  let paid = 0;
  let total = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  let overdueCount = 0;

  for (const inv of invoices) {
    if (!matchesCurrency(inv, code)) continue;
    total += 1;
    const amount = Number(inv.amount);
    if (isPaid(inv)) {
      paid += amount;
      paidCount += 1;
    } else {
      unpaidCount += 1;
      outstanding += amount;
      if (getInvoiceStatus(inv) === 'Overdue') {
        overdue += amount;
        overdueCount += 1;
      }
    }
  }

  return { outstanding, overdue, paid, total, paidCount, unpaidCount, overdueCount };
}