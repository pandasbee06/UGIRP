/**
 * Calculates the complaint priority score based on:
 * - Emergency checked
 * - Category
 * - Repeat complaints
 * - Sensitive area
 * 
 * Returns: "Low" | "Medium" | "High" | "Critical"
 */
function calculateComplaintPriority({ isEmergency, category, isRepeat, isSensitiveArea }) {
  // Direct override
  if (isEmergency) return "Critical";

  let score = 0;

  // 1. Base Score by Category
  const highPriorityCats = ["Public Disturbance", "Water Supply"];
  const mediumPriorityCats = ["Pothole Repair", "Streetlight Outage"];
  // Garbage Collection, Other, etc. are low by default

  if (highPriorityCats.includes(category)) {
    score += 3;
  } else if (mediumPriorityCats.includes(category)) {
    score += 2;
  } else {
    score += 1;
  }

  // 2. Modifiers
  if (isRepeat) score += 2;
  if (isSensitiveArea) score += 2;

  // 3. Thresholds
  if (score >= 6) return "Critical";
  if (score >= 4) return "High";
  if (score >= 3) return "Medium";
  
  return "Low";
}

module.exports = { calculateComplaintPriority };
