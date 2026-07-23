const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      url: { type: String, required: true },
      type: { type: String, enum: ['image', 'video'], default: 'image' },
    },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '24h' // TTL index to automatically delete the story after 24 hours
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Story', storySchema);
