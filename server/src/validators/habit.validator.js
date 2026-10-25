import { body, param, query } from 'express-validator';

const categories = ['health', 'study', 'fitness', 'mindfulness', 'other'];
const frequencies = ['daily', 'weekly'];

export const idRule = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer').toInt(),
];

const commonRules = [
  body('description').optional({ nullable: true }).isString().isLength({ max: 200 }),
  body('category').optional().isIn(categories).withMessage('category is invalid'),
  body('frequency').optional().isIn(frequencies).withMessage('frequency must be daily or weekly'),
  body('targetPerWeek').optional().isInt({ min: 1, max: 7 }).toInt(),
  body('tags').optional().isArray({ max: 5 }),
  body('tags.*').optional().isString().trim().isLength({ max: 30 }),
];

export const createHabitRules = [
  body('name')
    .isString().withMessage('name must be text')
    .trim()
    .notEmpty().withMessage('name is required')
    .isLength({ min: 3, max: 60 }).withMessage('name must be 3 to 60 characters'),
  ...commonRules,
];

export const updateHabitRules = [
  body('name').optional().isString().trim().isLength({ min: 3, max: 60 }),
  body('archived').optional().isBoolean().toBoolean(),
  ...commonRules,
];

export const listRules = [
  query('category').optional().isIn(categories),
  query('sort').optional().isIn(['createdAt', 'name', 'category']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('archived').optional().isBoolean().toBoolean(),
  query('q').optional().isString().trim().isLength({ max: 60 }),
];
