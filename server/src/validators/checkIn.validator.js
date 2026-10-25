import { body, param, query } from 'express-validator';

const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

const dateValidator = (field) => (value) => {
  if (!validDate(value)) throw new Error(`${field} must be a valid YYYY-MM-DD date`);
  return true;
};

export const habitIdRule = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
];

export const checkInRules = [
  body('date').isString().custom(dateValidator('date')),
  body('note').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
];

export const checkInDateRules = [
  ...habitIdRule,
  param('date').isString().custom(dateValidator('date')),
];

export const listCheckInRules = [
  query('from').optional().isString().custom(dateValidator('from')),
  query('to').optional().isString().custom(dateValidator('to')),
  query('habitId').optional().isInt({ min: 1 }).toInt(),
  query('to').custom((to, { req }) => {
    if (req.query.from && to && req.query.from > to) {
      throw new Error('to must be on or after from');
    }
    return true;
  }),
];
