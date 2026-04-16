const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ticketId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    media: { type: String },
    status: { type: String, enum: ["Pending", "In Progress", "Resolved", "Rejected"], default: "Pending" },
    isEvaluated: { type: Boolean, default: false },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    assignedOfficer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    remarks: { type: String, default: "" },
    proof: { type: String, default: "" },
    isDuplicate: { type: Boolean, default: false },
    linkedTicketId: { type: String, default: null },
    recurringIssue: { type: Boolean, default: false },
    adminFlagged: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
