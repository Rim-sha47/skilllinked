const express = require('express');
const { getDashboardStats, getUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin')); // All routes below require Admin role

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
