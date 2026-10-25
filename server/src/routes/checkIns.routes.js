import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import {
  habitIdRule,
  checkInRules,
  checkInDateRules,
  listCheckInRules,
} from '../validators/checkIn.validator.js';
import * as controller from '../controllers/checkIns.controller.js';

const router = Router();

router.get('/', listCheckInRules, validate, asyncHandler(controller.list));
router.put('/habits/:id', habitIdRule, checkInRules, validate, asyncHandler(controller.upsert));
router.delete('/habits/:id/:date', checkInDateRules, validate, asyncHandler(controller.remove));

export default router;
