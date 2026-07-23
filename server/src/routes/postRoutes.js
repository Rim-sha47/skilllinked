const express = require('express');
const {
  createPost,
  getPosts,
  likePost,
  commentOnPost,
  savePost,
} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/', protect, upload.array('files', 10), createPost);
router.get('/', protect, getPosts);
router.put('/like/:id', protect, likePost);
router.post('/comment/:id', protect, commentOnPost);
router.put('/save/:id', protect, savePost);

module.exports = router;
