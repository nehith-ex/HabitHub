import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { idRule, createHabitRules, updateHabitRules, listRules } from '../validators/habit.validator.js';
import * as controller from '../controllers/habits.controller.js';

const router = Router();

router.post('/', createHabitRules, validate, asyncHandler(controller.create));
router.get('/', listRules, validate, asyncHandler(controller.list));
router.get('/:id', idRule, validate, asyncHandler(controller.getOne));
router.patch('/:id', idRule, updateHabitRules, validate, asyncHandler(controller.update));
router.delete('/:id', idRule, validate, asyncHandler(controller.remove));

export default router;
