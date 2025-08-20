const Moderation = require('../schema/moderationSchema.js');

module.exports = async function getNextModCaseNumber(guildId) {
  const latest = await Moderation.findOne({ guildId }).sort({ caseNumber: -1 });
  return latest ? latest.caseNumber + 1 : 1;
};