const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    project: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true
    },
    employees: [
      {
        type: String,
        trim: true
      }
    ],
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    workDescription: {
      type: String,
      required: [true, 'Work description is required'],
      trim: true
    },
    deliveryCertificate: {
      type: String, // 📁 path to file
      default: null
    },
    workPhotos: {
      type: [String], // 📸 array of file paths
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved'],
      default: 'draft',
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    teamLeader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DailyLog', DailyLogSchema);
