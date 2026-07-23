const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Post = require('../models/Post');

// @desc    Global Search
// @route   GET /api/search?q=query&type=users|jobs|companies|posts|all
// @access  Public
exports.globalSearch = async (req, res) => {
  try {
    const query = req.query.q || '';
    const type = req.query.type || 'all';
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const regex = new RegExp(query, 'i');
    let results = {};

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [{ fullName: regex }, { username: regex }, { headline: regex }]
      }).select('fullName username profilePicture headline location bio');
    }

    if (type === 'all' || type === 'jobs') {
      results.jobs = await Job.find({ 
        $or: [{ title: regex }, { description: regex }] 
      }).populate('company', 'name logo');
    }

    if (type === 'all' || type === 'companies') {
      results.companies = await Company.find({ name: regex }).select('name logo industry');
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({ text: regex }).populate('user', 'name avatar');
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
