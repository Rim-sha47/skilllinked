const express = require('express');
const { careerChat, analyzeResume } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/career-chat', protect, careerChat);
router.post('/analyze-resume', protect, upload.single('resume'), analyzeResume);

module.exports = router;
