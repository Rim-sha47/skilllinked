const express = require('express');
const {
  getCompanies,
  getCompanyById,
  createCompany,
  followCompany,
  unfollowCompany,
} = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management and follow endpoints
 */

router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', protect, createCompany);
router.post('/:id/follow', protect, followCompany);
router.delete('/:id/follow', protect, unfollowCompany);

module.exports = router;
