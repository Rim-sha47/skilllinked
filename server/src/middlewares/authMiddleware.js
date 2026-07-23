const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Admin = require('../models/Admin');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    let entity;
    if (decoded.role === 'User') {
      entity = await User.findById(decoded.id).select('-password');
    } else if (decoded.role === 'Company') {
      entity = await Company.findById(decoded.id).select('-password');
    } else if (decoded.role === 'Admin') {
      entity = await Admin.findById(decoded.id).select('-password');
    }

    if (!entity) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Attach user
    req.user = entity;
    req.user.role = decoded.role; // ensuring role is explicitly set on req.user

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

