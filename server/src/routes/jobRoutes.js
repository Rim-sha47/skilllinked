const express = require('express');
const {
  createJob,
  getJobs,
  getJobById,
  applyJob,
  getMyApplications,
  saveJob,
  unsaveJob,
  getSavedJobs,
  getRecommendedJobs,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Specific routes before /:id to avoid conflicts
router.get('/applications/me', protect, getMyApplications);
router.get('/saved', protect, getSavedJobs);
router.get('/recommended', protect, getRecommendedJobs);

// General routes
router.get('/', getJobs);
router.post('/', protect, authorize('Recruiter', 'Company', 'Admin'), createJob);

// Param routes
router.get('/:id', getJobById);
router.post('/:id/apply', protect, applyJob);
router.post('/:id/save', protect, saveJob);
router.delete('/:id/save', protect, unsaveJob);

module.exports = router;
