import express from 'express';
import {
  getAvailableSlots,
  getTimeSlots,
  getAllTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getDailySlotOverride,
  createOrUpdateDailySlotOverride,
  deleteDailySlotOverride,
  getDailySlotOverridesRange,
} from '../controllers/slotController.js';

const router = express.Router();

// @route   GET /api/slots/available
// @desc    Get available slots for a date range
// @access  Public
// Query params: ?startDate=2024-01-15T00:00:00.000Z&endDate=2024-01-22T00:00:00.000Z
router.get('/available', getAvailableSlots);

// @route   GET /api/slots/times
// @desc    Get all active time slots (for customer app)
// @access  Public
router.get('/times', getTimeSlots);

// @route   GET /api/slots/times/all
// @desc    Get all time slots including inactive (for admin)
// @access  Public (admin panel)
router.get('/times/all', getAllTimeSlots);

// @route   POST /api/slots/times
// @desc    Create a new time slot
// @access  Public (admin panel)
router.post('/times', createTimeSlot);

// @route   PUT /api/slots/times/:id
// @desc    Update a time slot
// @access  Public (admin panel)
router.put('/times/:id', updateTimeSlot);

// @route   DELETE /api/slots/times/:id
// @desc    Delete a time slot
// @access  Public (admin panel)
router.delete('/times/:id', deleteTimeSlot);

// Daily slot overrides
// @route   GET /api/slots/daily/:date
// @desc    Get daily slot override for a specific date
// @access  Public (admin panel)
router.get('/daily/:date', getDailySlotOverride);

// @route   GET /api/slots/daily/range
// @desc    Get daily slot overrides for a date range
// @access  Public (admin panel)
router.get('/daily/range', getDailySlotOverridesRange);

// @route   POST /api/slots/daily
// @desc    Create or update daily slot override
// @access  Public (admin panel)
router.post('/daily', createOrUpdateDailySlotOverride);

// @route   DELETE /api/slots/daily/:date
// @desc    Delete daily slot override
// @access  Public (admin panel)
router.delete('/daily/:date', deleteDailySlotOverride);

export default router;
