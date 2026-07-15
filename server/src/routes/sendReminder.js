import { Router } from 'express';
import { queue } from '../workers/emailQueue.js';
import { reminderLimiter } from '../middleware/rateLimiter.js';

export const sendReminderRouter = Router();

function validateInvoice(invoice) {
  if (!invoice || typeof invoice !== 'object') {
    const error = new Error('Invoice payload is required');
    error.status = 400;
    throw error;
  }

  const { id, clientName, amount, dueDate } = invoice;
  if (!id || !clientName || amount == null || !dueDate) {
    const error = new Error('Invoice must include id, clientName, amount, and dueDate');
    error.status = 400;
    throw error;
  }
}

function respondWithError(res, err, defaultStatus = 500) {
  const status = err.status || defaultStatus;
  const message = err.message || 'Internal server error';
  return res.status(status).json({ error: message });
}

sendReminderRouter.post('/send-reminder', reminderLimiter, async (req, res) => {
  try {
    const { invoice } = req.body;
    validateInvoice(invoice);

    if (invoice.status === 'Paid') {
      return respondWithError(
        res,
        Object.assign(new Error('Cannot send reminders for paid invoices'), { status: 400 }),
      );
    }

    // BullMQ job creation logic goes here
    await queue.add('send-reminder', { invoice });

    return res.status(202).json({
      success: true,
      message: 'Reminder enqueued for delivery',
    });
  } catch (err) {
    console.error('[PayRemind] send-reminder enqueue failed:', err);
    return respondWithError(res, err, 400);
  }
});
