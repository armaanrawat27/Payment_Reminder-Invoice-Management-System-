import 'dotenv/config';
import express from 'express';
import './workers/emailQueue.js';
import cors from 'cors';
import { sendReminderRouter } from './routes/sendReminder.js';
import { authRouter } from './routes/auth.js';
import { invoicesRouter } from './routes/invoices.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './utils/swagger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'payremind-server' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', authRouter);
app.use('/api', sendReminderRouter);
app.use('/api', invoicesRouter);

app.use((err, _req, res, _next) => {
  console.error('[PayRemind]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  const key = process.env.RESEND_API_KEY?.trim();
  const resendReady =
    key && !['dummy_key', 'your_resend_api_key', 're_your_key_here'].includes(key);
  console.log(`PayRemind server listening on http://localhost:${PORT}`);
  console.log(
    resendReady
      ? '[PayRemind] Resend API key loaded.'
      : '[PayRemind] WARNING: Set a valid RESEND_API_KEY in server/.env (current value is missing or a placeholder).'
  );
});