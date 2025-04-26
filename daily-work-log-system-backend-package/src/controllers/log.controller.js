// 📂 controllers/log.controller.js

const DailyLog = require('../models/dailyLog.model');
const { validationResult } = require('express-validator');
const notificationController = require('./notification.controller');
const PDFDocument = require('pdfkit');
const moment = require('moment');

// Get all logs (with filtering)
exports.getAllLogs = async (req, res) => {
  try {
    const { startDate, endDate, project, status, teamLeader, searchTerm } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      filter.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { $lte: new Date(endDate) };
    }

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (teamLeader) filter.teamLeader = teamLeader;
    if (searchTerm) filter.workDescription = { $regex: searchTerm, $options: 'i' };

    if (req.userRole === 'Team Leader') {
      filter.teamLeader = req.userId;
    }

    const logs = await DailyLog.find(filter).sort({ date: -1 });

    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error retrieving logs' });
  }
};

// Get logs for current team leader
exports.getMyLogs = async (req, res) => {
  try {
    const logs = await DailyLog.find({ teamLeader: req.userId }).sort({ date: -1 });
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error retrieving logs' });
  }
};

// Get log by ID
exports.getLogById = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (req.userRole !== 'Manager' && log.teamLeader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this log' });
    }

    return res.status(200).json(log);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error retrieving the log' });
  }
};

// Create a new log
exports.createLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, project, employees, startTime, endTime, workDescription, deliveryCertificate, status } = req.body;

    const existingLog = await DailyLog.findOne({
      date: new Date(date),
      teamLeader: req.userId,
      project: project.trim()
    });

    if (existingLog) {
      await notificationController.createDuplicateWarningNotification(req.userId, date, project);
      return res.status(400).json({ message: 'A log already exists for this date and project', existingLogId: existingLog._id });
    }

    const newLog = new DailyLog({
      date: new Date(date),
      project: project.trim(),
      employees: employees.map(emp => emp.trim()),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      workDescription: workDescription.trim(),
      deliveryCertificate,
      teamLeader: req.userId,
      status: status || 'draft'
    });

    const savedLog = await newLog.save();

    return res.status(201).json(savedLog);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error creating the log' });
  }
};

// Update a log
exports.updateLog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const log = await DailyLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.teamLeader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this log' });
    }

    if (log.status === 'approved') {
      return res.status(400).json({ message: 'Cannot update an approved log' });
    }

    const updateData = req.body;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedLog = await DailyLog.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    return res.status(200).json(updatedLog);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating the log' });
  }
};

// Submit a log
exports.submitLog = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.teamLeader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to submit this log' });
    }

    if (log.status !== 'draft') {
      return res.status(400).json({ message: `Log is already ${log.status}` });
    }

    log.status = 'submitted';
    await log.save();

    return res.status(200).json({ message: 'Log submitted successfully', id: log._id, status: log.status });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error submitting the log' });
  }
};

// Approve a log
exports.approveLog = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.status !== 'submitted') {
      return res.status(400).json({ message: 'Only submitted logs can be approved' });
    }

    log.status = 'approved';
    log.approvedBy = req.userId;
    log.approvedAt = new Date();
    await log.save();

    await notificationController.createLogApprovedNotification(log._id);

    return res.status(200).json({ message: 'Log approved successfully', id: log._id, status: log.status });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error approving the log' });
  }
};

// Delete a log
exports.deleteLog = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (req.userRole !== 'Manager' && log.teamLeader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this log' });
    }

    if (log.status === 'approved' && req.userRole !== 'Manager') {
      return res.status(400).json({ message: 'Cannot delete an approved log' });
    }

    await DailyLog.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: 'Log deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting the log' });
  }
};

// Export log to PDF
exports.exportLogToPdf = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);

    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (req.userRole !== 'Manager' && log.teamLeader.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to export this log' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=daily-log-${log._id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Daily Work Log', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Date: ${moment(log.date).format('DD/MM/YYYY')}`);
    doc.text(`Project: ${log.project}`);
    doc.text(`Team Leader ID: ${log.teamLeader}`);
    doc.text(`Work Hours: ${moment(log.startTime).format('HH:mm')} - ${moment(log.endTime).format('HH:mm')}`);
    doc.text(`Status: ${log.status}`);
    doc.moveDown();

    doc.fontSize(14).text('Employees Present:');
    doc.fontSize(12);
    if (log.employees.length === 0) {
      doc.text('No employees recorded.');
    } else {
      log.employees.forEach(emp => doc.text(`- ${emp}`));
    }

    doc.moveDown();
    doc.fontSize(14).text('Work Description:');
    doc.fontSize(12).text(log.workDescription);
    doc.end();

  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error exporting log to PDF' });
  }
};
