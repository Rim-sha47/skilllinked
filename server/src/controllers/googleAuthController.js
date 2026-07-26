const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateTokens } = require('./authController');

// Instantiate client without hardcoded ID to rely on audience parameter
const client = new OAuth2Client();

exports.googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID token required' });

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = payload.email;
    const fullName = payload.name || '';
    const picture = payload.picture || '';
    const googleSub = payload.sub;

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      const baseUsername = email.split('@')[0];
      const uniqueUsername = `${baseUsername}${Date.now()}`;
      const placeholderPhone = `google_${googleSub}`;
      const placeholderPassword = Math.random().toString(36).slice(-8);
      user = await User.create({
        fullName,
        username: uniqueUsername,
        email,
        phoneNumber: placeholderPhone,
        password: placeholderPassword,
        role: 'User',
        profilePicture: picture,
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message });
  }
};
