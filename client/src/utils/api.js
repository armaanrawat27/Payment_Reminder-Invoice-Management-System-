/**
 * Thin API client — all /api traffic goes through Vite's proxy to Express.
 */

export async function sendReminder(invoice) {
  const res = await fetch('/api/send-reminder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }

  return data;
}
