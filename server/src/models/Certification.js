const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add certification name'],
    },
    issuingOrganization: {
      type: String,
      required: [true, 'Please add issuing organization'],
    },
    issueDate: {
      type: Date,
      required: [true, 'Please add issue date'],
    },
    expirationDate: {
      type: Date,
    },
    credentialId: {
      type: String,
    },
    credentialUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Certification', certificationSchema);
