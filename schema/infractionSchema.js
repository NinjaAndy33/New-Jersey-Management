const mongoose = require('mongoose');

const infractionSchema = new mongoose.Schema({
  guildId: String,
  userId: String,
  moderatorId: String,
  reason: String,
  timestamp: Date,
  caseNumber: Number
});

module.exports = mongoose.model('Infraction', infractionSchema);