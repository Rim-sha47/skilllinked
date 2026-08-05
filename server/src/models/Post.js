const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
    },
    text: {
      type: String,
      default: '',
    },
    media: [
      {
        url: String, // Cloudinary URL
        type: {
          type: String,
          enum: ['image', 'video', 'document'],
        },
      }
    ],
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }
      ],
      endsAt: Date,
    },
    hashtags: [{ type: String }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        type: {
          type: String,
          enum: ['like', 'love', 'celebrate', 'support', 'funny', 'insightful'],
          default: 'like'
        }
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        text: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        replies: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: String,
            date: { type: Date, default: Date.now }
          }
        ]
      },
    ],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);

