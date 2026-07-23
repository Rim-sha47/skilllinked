const Admin = require('../models/Admin');

/**
 * Seeds a default admin account if none exists.
 * Called once after MongoDB connects successfully.
 */
const seedAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ email: 'admin72@gmail.com' });
    if (!adminExists) {
      await Admin.create({
        fullName: 'Super Admin',
        username: 'superadmin72',
        email: 'admin72@gmail.com',
        password: 'admin@7221',
        role: 'Admin',
      });
      console.log('✅ Default admin account created (admin72@gmail.com / admin@7221)');
    } else {
      console.log('✅ Admin account already exists.');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
