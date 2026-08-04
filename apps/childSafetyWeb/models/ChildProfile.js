const mongoose = require('mongoose');

const childProfileSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dob: { type: String, required: true },
  description: { type: String, default: '' },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChildProfile', childProfileSchema);
