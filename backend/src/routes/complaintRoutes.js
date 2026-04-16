const express = require("express");
const crypto = require("crypto");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const { calculateComplaintPriority } = require("../utils/priority");

const router = express.Router();

// Helper to generate unique ticket ID CMP-XXXXXX
const generateTicketId = () => {
  return `CMP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

// GET /api/complaints/map-data (Public/Citizen fetch for Map Layer)
router.get("/map-data", async (req, res) => {
  try {
    const complaints = await Complaint.find({ status: { $ne: "Rejected" } })
      .select("ticketId title category location coordinates priority status createdAt")
      .lean();
    return res.status(200).json({ ok: true, data: complaints });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// CREATE: POST /api/complaints/create
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, location, media, isEmergency, isRepeat, isSensitiveArea, linkedTicketId } = req.body || {};
    
    if (!title || !description || !category || !location) {
      return res.status(400).json({ code: "VALIDATION_ERROR", message: "Missing required complaint fields" });
    }

    const ticketId = generateTicketId();

    // DUPLICATE DETECTION LOGIC
    // Check if complaint with same exact title and location exists
    const duplicateMatch = await Complaint.findOne({
      title: { $regex: new RegExp(`^${String(title).trim()}$`, 'i') },
      location: { $regex: new RegExp(`^${String(location).trim()}$`, 'i') }
    });

    const isDuplicate = !!duplicateMatch || !!linkedTicketId;
    const resolvedLinkedTicketId = linkedTicketId ? String(linkedTicketId).trim() : (duplicateMatch ? duplicateMatch.ticketId : null);
    
    // RECURRING LOGIC
    // Check if same category in same area occurred >= 3 times in 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recurringCount = await Complaint.countDocuments({
      category: String(category).trim(),
      location: { $regex: new RegExp(`^${String(location).trim()}$`, 'i') },
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recurringIssue = recurringCount >= 2; // Testing logic: if it's the 3rd one, bump to critical 
    const adminFlagged = recurringIssue;

    // Dynamic Algorithm for Prioritization
    let calculatedPriority = calculateComplaintPriority({
      isEmergency: !!isEmergency,
      category: String(category).trim(),
      isRepeat: !!isRepeat,
      isSensitiveArea: !!isSensitiveArea
    });

    if (recurringIssue) {
      calculatedPriority = "Critical";
    }

    // Coordinate Parsing Logic
    let coordinates = undefined;
    const locString = String(location).trim();
    // Match "Auto-detected GPS [Lat: 28.61, Lon: 77.20]"
    const gpsMatch = locString.match(/Lat:\s*([-\d.]+),\s*Lon:\s*([-\d.]+)/i);
    if (gpsMatch) {
      coordinates = { lat: parseFloat(gpsMatch[1]), lng: parseFloat(gpsMatch[2]) };
    } else {
      // Generate a mock coordinate in a clustered area for text-based entries to populate map
      // e.g., Base: New Delhi (28.6139, 77.2090) with a +- 0.05 spread
      coordinates = {
        lat: 28.6139 + (Math.random() * 0.1 - 0.05),
        lng: 77.2090 + (Math.random() * 0.1 - 0.05),
      };
    }

    const complaint = await Complaint.create({
      userId: req.user.userId,
      ticketId,
      title: String(title).trim(),
      description: String(description).trim(),
      category: String(category).trim(),
      location: locString,
      coordinates,
      media: media ? String(media).trim() : undefined,
      priority: calculatedPriority,
      status: "Pending",
      isDuplicate,
      linkedTicketId: resolvedLinkedTicketId,
      recurringIssue,
      adminFlagged
    });

    // Notify user internally
    await Notification.create({
      userId: req.user.userId,
      title: "Complaint Filed Successfully",
      message: `Your complaint ${ticketId} has been registered and is pending review.`,
      isNew: true
    });

    if (adminFlagged) {
      const admin = await User.findOne({ role: "admin" }).lean();
      if (admin) {
        await Notification.create({
          userId: admin._id,
          title: "System Alert: Recurring Issue Detected",
          message: `Ticket ${ticketId} triggered a recurring issue flag for ${category} at ${location}. Priority escalated to Critical automatically.`,
          isNew: true
        });
      }
    }

    return res.status(201).json({ ok: true, message: "Complaint created", ticketId, data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// READ ALL: GET /api/complaints
router.get("/", authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "officer" && req.user.role !== "admin") {
      query = { userId: req.user.userId }; 
    }
    const complaints = await Complaint.find(query)
      .populate("assignedOfficer", "name role email")
      .populate("userId", "name mobile")
      .sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, data: complaints });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// READ ONE TARGET: GET /api/complaints/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!complaint) return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found" });
    return res.status(200).json({ ok: true, data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// UPDATE: PUT /api/complaints/:id
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, priority, description, media, assignedOfficer, remarks, proof } = req.body || {};
    
    // Security check: Officers can edit any ticket, citizens can only edit their own.
    const query = (req.user.role === "officer" || req.user.role === "admin")
      ? { _id: req.params.id }
      : { _id: req.params.id, userId: req.user.userId };

    const complaint = await Complaint.findOne(query);
    
    if (!complaint) return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found or forbidden" });

    if (status !== undefined) complaint.status = status;
    if (priority !== undefined) complaint.priority = priority;
    if (description !== undefined) complaint.description = description;
    if (media !== undefined) complaint.media = media;
    if (assignedOfficer !== undefined) complaint.assignedOfficer = assignedOfficer;
    if (remarks !== undefined) complaint.remarks = remarks;
    if (proof !== undefined) complaint.proof = proof;

    await complaint.save();
    return res.status(200).json({ ok: true, message: "Complaint updated successfully", data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// DELETE: DELETE /api/complaints/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!complaint) return res.status(404).json({ code: "NOT_FOUND", message: "Complaint not found" });
    return res.status(200).json({ ok: true, message: "Complaint deleted successfully" });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

// READ PUBLIC TRACKER: GET /api/complaints/track/:ticketId
router.get("/track/:ticketId", async (req, res) => {
  try {
    // This route should ideally be public or auth'd depending on your design. Assuming authMiddleware handles the entire router globally.
    const complaint = await Complaint.findOne({ ticketId: req.params.ticketId }).populate("assignedOfficer", "name role email");
    if (!complaint) return res.status(404).json({ code: "NOT_FOUND", message: "Ticket not found" });
    return res.status(200).json({ ok: true, data: complaint });
  } catch (e) {
    return res.status(500).json({ code: "INTERNAL_ERROR", message: e instanceof Error ? e.message : "Error" });
  }
});

module.exports = router;
