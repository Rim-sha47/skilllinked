const express = require('express');
const {
  getMyProfile,
  createOrUpdateProfile,
  getAllProfiles,
  getProfileByUserId,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addSkill,
  deleteSkill,
  addCertification,
  deleteCertification,
  updateAvatar
} = require('../controllers/profileController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profiles
 *   description: Profile management
 */

/**
 * @swagger
 * /profiles/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       404:
 *         description: Profile not found
 */
router.get('/me', protect, getMyProfile);

/**
 * @swagger
 * /profiles/dashboard:
 *   get:
 *     summary: Get user dashboard stats
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', protect, require('../controllers/profileController').getDashboardStats);

/**
 * @swagger
 * /profiles:
 *   post:
 *     summary: Create or update a profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               headline:
 *                 type: string
 *               bio:
 *                 type: string
 *               location:
 *                 type: string
 *               website:
 *                 type: string
 *               github:
 *                 type: string
 *               linkedin:
 *                 type: string
 *               twitter:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile created/updated
 */
router.post('/', protect, createOrUpdateProfile);

/**
 * @swagger
 * /profiles:
 *   get:
 *     summary: Get all profiles
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: List of all profiles
 */
router.get('/', getAllProfiles);

/**
 * @swagger
 * /profiles/user/{user_id}:
 *   get:
 *     summary: Get profile by user ID
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *       404:
 *         description: Profile not found
 */
router.get('/user/:user_id', getProfileByUserId);

// Experience routes
router.post('/experience', protect, addExperience);
router.delete('/experience/:exp_id', protect, deleteExperience);

// Education routes
router.post('/education', protect, addEducation);
router.delete('/education/:edu_id', protect, deleteEducation);

// Skills routes
router.post('/skills', protect, addSkill);
router.delete('/skills/:skill_name', protect, deleteSkill);

// Certifications routes
router.post('/certifications', protect, addCertification);
router.delete('/certifications/:cert_id', protect, deleteCertification);

// Avatar route
router.put('/avatar', protect, upload.single('file'), updateAvatar);

module.exports = router;
