const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a skill name'],
      trim: true,
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Expert'],
      default: 'Beginner',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Skill', skillSchema);
