const express = require('express');
const { createStory, getStories, viewStory, updateStory, deleteStory } = require('../controllers/storyController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.route('/')
  .post(protect, upload.single('file'), createStory)
  .get(protect, getStories);

router.route('/:id')
  .put(protect, updateStory)
  .delete(protect, deleteStory);

router.put('/:id/view', protect, viewStory);

module.exports = router;
