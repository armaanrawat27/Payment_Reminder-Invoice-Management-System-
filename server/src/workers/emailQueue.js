import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Resend } from 'resend';
import { formatCurrency } from '../utils/currency.js';
import { getInvoiceStatus } from '../utils/status.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const queue = new Queue('email-queue', { connection });

const PLACEHOLDER_KEYS = new Set(['dummy_key', 'your_resend_api_key', 're_your_key_here']);

function getResendApiKey() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key)) return null;
  return key;
}

function getResendClient() {
  const apiKey = getResendApiKey();
  return apiKey ? new Resend(apiKey) : null;
}

function formatDate(isoDate, currency = 'USD') {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Date(isoDate).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function processSendReminder(job) {
  const { invoice } = job.data || {};
  if (!invoice) throw new Error('Job missing invoice data');

  const resend = getResendClient();
  if (!resend) {
    throw Object.assign(
      new Error('RESEND_API_KEY missing or placeholder; cannot send email'),
      { status: 503 },
    );
  }

  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const intendedTo = invoice.clientEmail || process.env.REMINDER_TO_EMAIL || 'delivered@resend.dev';
  const to = process.env.REMINDER_TO_EMAIL?.trim() || intendedTo;

  console.info(`[PayRemind][worker] Sending reminder for ${invoice.id} (to: ${to})`);

  const { data, error } = await resend.emails.send({
    from: `PayRemind <${from}>`,
    to: [to],
    subject: `Payment reminder: Invoice for ${invoice.clientName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
        <h2 style="color: #0f172a;">Payment Reminder</h2>
        <p>Hello,</p>
        <p>This is a friendly reminder that an invoice for <strong>${invoice.clientName}</strong> is outstanding.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Invoice ID</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${invoice.id}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Amount Due</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${formatCurrency(invoice.amount, invoice.currency)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Currency</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${invoice.currency === 'INR' ? 'INR (₹)' : 'USD ($)'}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Due Date</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${formatDate(invoice.dueDate, invoice.currency)}</strong></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Status</td>
            <td style="padding: 8px 0; text-align: right;"><strong>${getInvoiceStatus(invoice)}</strong></td>
          </tr>
        </table>
        <p style="color: #64748b; font-size: 14px;">Please arrange payment at your earliest convenience. Thank you.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">Sent via PayRemind</p>
      </div>
    `,
  });

  if (error) {
    console.error('[PayRemind][worker] Resend API returned an error:', error);
    throw new Error(error.message || 'Resend API error');
  }

  return { success: true, emailId: data?.id, sentAt: new Date().toISOString() };
}

const worker = new Worker(
  'email-queue',
  async (job) => {
    try {
      if (job.name === 'send-reminder') {
        return await processSendReminder(job);
      }
      throw new Error(`Unknown job name: ${job.name}`);
    } catch (err) {
      console.error('[PayRemind][worker] Job failed:', err);
      throw err;
    }
  },
  { connection },
);

worker.on('completed', (job, returnvalue) => {
  console.info(`[PayRemind][worker] Job ${job.id} (${job.name}) completed`, returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`[PayRemind][worker] Job ${job?.id} (${job?.name}) failed:`, err);
});

export default worker;
