import express from 'express';
import * as reportController from '../controllers/report.controller.js';
import * as reportValidator from '../validators/report.validator.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// all routes are protected
router.use(authenticate);

// route   GET /api/reports/my
// desc    get user's submitted reports
// access  private
router.get('/my', reportController.getMyReports);

// route   POST /api/reports
// desc    create report
// access  private
router.post('/', reportValidator.createReportValidator, reportController.createReport);

// route   GET /api/reports/:reportId
// desc    get single report
// access  private
router.get('/:reportId', reportValidator.reportIdValidator, reportController.getReport);

export default router;