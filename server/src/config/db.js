const mongoose = require('mongoose');
const seedAdmin = require('./seedAdmin');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed the default admin account after successful connection
    await seedAdmin();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('Server running WITHOUT database connection. Retrying...');
    // Don't exit - allow server to keep running and retry on next request
  }
};

module.exports = connectDB;
