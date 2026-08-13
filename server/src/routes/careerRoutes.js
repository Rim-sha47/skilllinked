const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const careerController = require('../controllers/careerController');

// All career insights routes are protected
router.use(protect);

router.get('/insights', careerController.getInsights);
router.post('/resume/analyze', careerController.analyzeResume);
router.post('/coach', careerController.careerCoach);

module.exports = router;
