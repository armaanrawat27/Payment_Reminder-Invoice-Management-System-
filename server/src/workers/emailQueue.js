import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { escapeHtml } from '../utils/escapeHtml.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const queue = new Queue('email-queue', { connection });

async function processSendReminder(job) {
  const { clientName, amount } = job.data || {};
  if (clientName === undefined || amount === undefined) {
    throw new Error('Job missing required invoice fields');
  }

  const safeClientName = escapeHtml(clientName);
  const safeAmount = escapeHtml(amount);

  const emailHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1>Payment Reminder</h1>
      <p>Hello ${safeClientName},</p>
      <p>This is a reminder that your invoice for <strong>${safeAmount}</strong> is due soon.</p>
      <p>Thank you for your prompt attention.</p>
    </div>
  `;

  // Email provider sending logic goes here
  console.info('[PayRemind][worker] Prepared sanitized email HTML', { safeClientName, safeAmount });

  return {
    success: true,
    html: emailHtml,
    sentAt: new Date().toISOString(),
  };
}

const worker = new Worker(
  'email-queue',
  async (job) => {
    if (job.name === 'send-reminder') {
      return await processSendReminder(job);
    }
    throw new Error(`Unknown job name: ${job.name}`);
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
