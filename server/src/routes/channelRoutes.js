const express = require('express');
const { getChannels, getFollowingChannels, toggleFollow, createChannel, getChannel } = require('../controllers/channelController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getChannels);
router.get('/following', protect, getFollowingChannels);
router.post('/', protect, createChannel);
router.get('/:channelId', protect, getChannel);
router.put('/:channelId/follow', protect, toggleFollow);

module.exports = router;
