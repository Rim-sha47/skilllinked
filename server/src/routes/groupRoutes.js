const express = require('express');
const { getGroups, createGroup, getGroup, toggleJoin, getGroupPosts } = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(protect, getGroups)
  .post(protect, createGroup);

router.route('/:id')
  .get(protect, getGroup);

router.route('/:id/join')
  .put(protect, toggleJoin);

router.route('/:id/posts')
  .get(protect, getGroupPosts);

module.exports = router;
