import { ZodError, z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const details = result.error.errors.map((issue) => ({
      field: issue.path.length > 0 ? issue.path.join('.') : 'request',
      message: issue.message,
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details,
    });
  }

  req.validated = result.data;
  return next();
};

export const createInvoiceSchema = z.object({
  body: z.object({
    clientName: z.string().min(1, 'clientName is required'),
    amount: z.number().positive('amount must be greater than zero'),
    currency: z
      .string()
      .length(3, 'currency must be exactly 3 characters')
      .default('USD'),
    dueDate: z
      .string()
      .refine(
        (value) => {
          const date = Date.parse(value);
          return !Number.isNaN(date);
        },
        { message: 'dueDate must be a valid ISO 8601 datetime' },
      ),
    status: z
      .enum(['PENDING', 'PAID', 'OVERDUE'])
      .default('PENDING'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
