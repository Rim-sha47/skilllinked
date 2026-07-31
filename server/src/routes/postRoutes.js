const express = require('express');
const {
  createPost,
  getPosts,
  likePost,
  commentOnPost,
  savePost,
  updatePost,
} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.post('/', protect, upload.array('files', 10), createPost);
router.get('/', protect, getPosts);
router.put('/like/:id', protect, likePost);
router.post('/comment/:id', protect, commentOnPost);
router.delete('/comment/:id/:commentId', protect, require('../controllers/postController').deleteComment);
router.put('/comment/:id/:commentId', protect, require('../controllers/postController').editComment);
router.post('/comment/reply/:id/:commentId', protect, require('../controllers/postController').replyToComment);
router.put('/save/:id', protect, savePost);
router.post('/share/:id', protect, require('../controllers/postController').sharePost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, require('../controllers/postController').deletePost);

module.exports = router;

