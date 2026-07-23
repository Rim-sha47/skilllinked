const express = require('express');
const { createJob, getJobs, getJobById, applyJob, getMyApplications } = require('../controllers/jobController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management
 */

router.get('/applications/me', protect, getMyApplications);
router.get('/', getJobs);
router.get('/:id', getJobById);
router.post('/', protect, authorize('Recruiter', 'Company', 'Admin'), createJob);
router.post('/:id/apply', protect, applyJob);

module.exports = router;
