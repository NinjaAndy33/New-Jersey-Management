const Promotion = require('../schema/promotionSchema.js');

module.exports = async function getNextPromotionCaseNumber(guildId) {
  const latest = await Promotion.findOne({ guildId }).sort({ caseNumber: -1 });
  return latest ? latest.caseNumber + 1 : 1;
};