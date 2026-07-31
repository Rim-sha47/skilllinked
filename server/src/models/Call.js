const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
  {
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['voice', 'video'],
      default: 'voice',
    },
    status: {
      type: String,
      enum: ['missed', 'answered', 'rejected', 'ongoing', 'cancelled'],
      default: 'missed',
    },

    duration: {
      type: Number, // seconds
      default: 0,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Call', callSchema);
