const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    caption: { type: String, default: '' },
    media: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
    },
    viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
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
