const Admin = require('../models/Admin');

/**
 * Seeds a default admin account if none exists.
 * Called once after MongoDB connects successfully.
 * Credentials are stored only in .env and this file — never exposed to users.
 */
const seedAdmin = async () => {
  try {
    // Remove old admin if exists (migration)
    await Admin.deleteMany({ email: 'admin72@gmail.com' });

    const adminExists = await Admin.findOne({ email: 'admin21@gmail.com' });
    if (!adminExists) {
      await Admin.create({
        fullName: 'Super Admin',
        username: 'superadmin21',
        email: 'admin21@gmail.com',
        password: 'admin@2172',
        role: 'Admin',
      });
      console.log('✅ Default admin account created.');
    } else {
      adminExists.password = 'admin@2172';
      await adminExists.save();
      console.log('✅ Admin account updated with new password.');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
