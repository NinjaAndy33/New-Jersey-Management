const Infraction = require('../schema/infractionSchema.js');

async function getNextCaseNumber(guildId) {
  const lastInfraction = await Infraction.find({ guildId })
    .sort({ caseNumber: -1 })
    .limit(1);

  return lastInfraction.length ? lastInfraction[0].caseNumber + 1 : 1;
}

module.exports = getNextCaseNumber;