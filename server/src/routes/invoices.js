import express from 'express';
import { query } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/invoices:
 *   get:
 *     tags:
 *       - Invoices
 *     summary: Get all invoices
 *     description: Retrieves a list of all invoices ordered by creation date.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   clientName:
 *                     type: string
 *                     example: John Doe
 *                   clientEmail:
 *                     type: string
 *                     example: john@example.com
 *                   amount:
 *                     type: number
 *                     format: float
 *                     example: 1500.00
 *                   currency:
 *                     type: string
 *                     enum: [USD, INR]
 *                     example: USD
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-07-31T00:00:00Z
 *                   status:
 *                     type: string
 *                     enum: [Pending, Paid]
 *                     example: Pending
 *                   reminderHistory:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: []
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: 2024-07-15T10:00:00Z
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/invoices', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, client_name AS "clientName", client_email AS "clientEmail", amount, currency, due_date AS "dueDate", status, reminder_history AS "reminderHistory", created_at FROM invoices ORDER BY created_at ASC`,
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/invoices:
 *   post:
 *     tags:
 *       - Invoices
 *     summary: Create a new invoice
 *     description: Creates a new invoice. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *               - amount
 *               - currency
 *               - dueDate
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: John Doe
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 1500.00
 *               currency:
 *                 type: string
 *                 enum: [USD, INR]
 *                 example: USD
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-07-31T00:00:00Z
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid]
 *                 example: Pending
 *               reminderHistory:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 clientName:
 *                   type: string
 *                   example: John Doe
 *                 clientEmail:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                 status:
 *                   type: string
 *                 reminderHistory:
 *                   type: array
 *                 created_at:
 *                   type: string
 *       400:
 *         description: Bad request - missing required fields
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
router.post('/invoices', requireAuth, async (req, res, next) => {
  try {
    const body = req.body || {};
    const reminderHistory = body.reminderHistory || [];
    
    // 🔥 FIX: We removed 'id' from the INSERT and VALUES lists so Postgres handles it automatically!
    const inserted = await query(
      `INSERT INTO invoices (client_name, client_email, amount, currency, due_date, status, reminder_history) 
       VALUES ($1,$2,$3,$4,$5,$6,$7) 
       RETURNING id, client_name AS "clientName", client_email AS "clientEmail", amount, currency, due_date AS "dueDate", status, reminder_history AS "reminderHistory", created_at`,
      [
        body.clientName || body.client_name || null,
        body.clientEmail || body.client_email || null,
        body.amount || null,
        body.currency || null,
        body.dueDate || null,
        body.status || null,
        JSON.stringify(reminderHistory),
      ],
    );
    res.status(201).json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   put:
 *     tags:
 *       - Invoices
 *     summary: Update an invoice
 *     description: Updates an existing invoice by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientName:
 *                 type: string
 *                 example: Jane Doe
 *               clientEmail:
 *                 type: string
 *                 format: email
 *               amount:
 *                 type: number
 *                 format: float
 *               currency:
 *                 type: string
 *                 enum: [USD, INR]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: string
 *                 enum: [Pending, Paid]
 *               reminderHistory:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 clientName:
 *                   type: string
 *                 clientEmail:
 *                   type: string
 *                 amount:
 *                   type: number
 *                 currency:
 *                   type: string
 *                 dueDate:
 *                   type: string
 *                 status:
 *                   type: string
 *                 reminderHistory:
 *                   type: array
 *                 created_at:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Invoice not found
 */
router.put('/invoices/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const reminderHistory = body.reminderHistory || null;
    const updated = await query(
      `UPDATE invoices SET client_name=$1, client_email=$2, amount=$3, currency=$4, due_date=$5, status=$6, reminder_history=COALESCE($7, reminder_history) WHERE id=$8 
       RETURNING id, client_name AS "clientName", client_email AS "clientEmail", amount, currency, due_date AS "dueDate", status, reminder_history AS "reminderHistory", created_at`,
      [
        body.clientName || body.client_name || null,
        body.clientEmail || body.client_email || null,
        body.amount || null,
        body.currency || null,
        body.dueDate || null,
        body.status || null,
        reminderHistory ? JSON.stringify(reminderHistory) : null,
        id,
      ],
    );
    if (!updated || updated.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/invoices/{id}:
 *   delete:
 *     tags:
 *       - Invoices
 *     summary: Delete an invoice
 *     description: Deletes an invoice by ID. Requires authentication.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       204:
 *         description: Invoice deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Invoice not found
 */
router.delete('/invoices/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await query(`DELETE FROM invoices WHERE id=$1 RETURNING id`, [id]);
    if (!deleted || deleted.length === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export { router as invoicesRouter };