const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  path: {
    type: String,
    required: [true, 'Document path is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  type: {
    type: String,
    enum: ['delivery_note', 'receipt', 'invoice', 'other'],
    default: 'delivery_note'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const DailyLogSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    project: {
      type: String, // ✅ previously was ObjectId — now matches the form's string input
      required: [true, 'Project name is required'],
      trim: true
    },
    employees: [{
      type: String, // ✅ from form: just a string name (not ObjectId of Employee)
      trim: true
    }],
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
    deliveryCertificate: DocumentSchema, // ✅ this matches the uploaded file object
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('DailyLog', DailyLogSchema);
