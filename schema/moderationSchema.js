const mongoose = require('mongoose');

const moderationSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  action: { type: String, enum: ['warn', 'mute', 'kick', 'ban'], required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  caseNumber: { type: Number, required: true },
  duration: { type: Number }, // Optional: for mutes
  messageLink: { type: String } // Optional: for modlog jump
});

module.exports = mongoose.model('Moderation', moderationSchema);