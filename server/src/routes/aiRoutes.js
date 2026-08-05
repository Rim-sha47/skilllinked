const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// 1. Core Chat Endpoint (supports text and conversation history)
router.post('/chat', protect, aiController.chat);

// 2. Fetch Conversation History
router.get('/history', protect, aiController.getHistory);

// 3. Clear Chat History
router.delete('/history', protect, aiController.clearHistory);

// 4. File / Image analysis (Vision, OCR, Code review)
router.post('/analyze-file', protect, upload.single('file'), aiController.analyzeFile);

// (Legacy endpoints kept intact)
router.post('/career-chat', protect, aiController.careerChat);
router.post('/meta-ai', protect, aiController.metaAiChat);
router.post('/analyze-resume', protect, upload.single('resume'), aiController.analyzeResume);

module.exports = router;
