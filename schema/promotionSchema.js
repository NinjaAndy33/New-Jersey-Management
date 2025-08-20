const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  oldRole: { type: String, required: true },
  newRole: { type: String, required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  caseNumber: { type: Number, required: true },
  messageLink: { type: String } // Optional: for jump-to-message or dashboard link
});

module.exports = mongoose.model('Promotion', promotionSchema);