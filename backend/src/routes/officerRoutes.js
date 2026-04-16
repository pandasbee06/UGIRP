const express = require("express");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Middleware to ensure user is an officer or admin
const requireOfficer = (req, res, next) => {
  if (req.user.role !== "officer" && req.user.role !== "admin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Officer access required" });
  }
  next();
};

// GET /api/officer/my-complaints
router.get("/my-complaints", authMiddleware, requireOfficer, async (req, res) => {
  try {
    const complaints = await Complaint.find({ assignedOfficer: req.user.userId })
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, data: complaints });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// PUT /api/officer/update/:id
router.put("/update/:id", authMiddleware, requireOfficer, async (req, res) => {
  try {
    const { status, remarks } = req.body || {};
    
    const complaint = await Complaint.findOne({ 
      _id: req.params.id, 
      assignedOfficer: req.user.userId 
    });

    if (!complaint) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found or not assigned to you" });
    }

    // TRUST SCORE EVALUATION
    if (status && (status === "Resolved" || status === "Rejected") && !complaint.isEvaluated) {
      const citizen = await User.findById(complaint.userId);
      const officer = await User.findById(req.user.userId);
      
      if (citizen && officer) {
        // Evaluate Citizen
        if (status === "Resolved") { // Genuine
          citizen.trustScore = (citizen.trustScore || 50) + 5;
        } else if (status === "Rejected") { // Fake/Spam
          citizen.trustScore = (citizen.trustScore || 50) - 10;
        }

        // Evaluate Officer
        const timeToResolveMs = Date.now() - new Date(complaint.createdAt).getTime();
        const hoursToResolve = timeToResolveMs / (1000 * 60 * 60);

        if (hoursToResolve <= 48) { // Fast
          officer.trustScore = (officer.trustScore || 50) + 10;
        } else { // Delay
          officer.trustScore = (officer.trustScore || 50) - 5;
        }

        await citizen.save();
        await officer.save();
      }
      complaint.isEvaluated = true;
    }

    if (status !== undefined && complaint.status !== status) {
      complaint.status = status;
      // Notify Citizen of status update
      await Notification.create({
        userId: complaint.userId,
        title: status === "Resolved" ? "Complaint Resolved" : "Status Updated",
        message: `Your complaint ${complaint.ticketId} status has been updated to: ${status}.`,
        isUnread: true
      });
    }
    
    if (remarks !== undefined) complaint.remarks = remarks;

    await complaint.save();
    return res.status(200).json({ ok: true, message: "Complaint updated successfully", data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// POST /api/officer/upload-proof/:id
router.post("/upload-proof/:id", authMiddleware, requireOfficer, async (req, res) => {
  try {
    const { proof } = req.body || {};
    
    if (!proof) {
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "Proof data is required" });
    }

    const complaint = await Complaint.findOne({ 
      _id: req.params.id, 
      assignedOfficer: req.user.userId 
    });

    if (!complaint) {
      return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found or not assigned to you" });
    }

    complaint.proof = proof;
    await complaint.save();
    
    return res.status(200).json({ ok: true, message: "Proof uploaded successfully", data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

module.exports = router;
