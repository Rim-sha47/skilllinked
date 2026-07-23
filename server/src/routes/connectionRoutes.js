const express = require('express');
const {
  sendRequest,
  acceptRequest,
  getMyConnections,
  getPendingRequests,
  getSuggestions,
  removeConnection,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require('../controllers/connectionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Connections
 *   description: Connection management
 */

router.get('/suggestions', protect, getSuggestions);
router.get('/pending', protect, getPendingRequests);
router.get('/followers/:id', getFollowers);
router.get('/following/:id', getFollowing);
router.get('/', protect, getMyConnections);
router.post('/request/:id', protect, sendRequest);
router.post('/follow/:id', protect, followUser);
router.delete('/follow/:id', protect, unfollowUser);
router.put('/accept/:id', protect, acceptRequest);
router.delete('/:id', protect, removeConnection);

module.exports = router;
