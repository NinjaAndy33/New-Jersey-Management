const Moderation = require('../schema/moderationSchema.js');
const getNextModCaseNumber = require('../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978'; // Replace with your staff role ID
const MODLOG_CHANNEL_ID = '1405942493081767988'; // Replace with your modlog channel ID

module.exports = {
  name: 'mute',
  aliases: [],
  description: 'Timeout a user for a set duration (in minutes)',
  usage: '<@user> <duration> <reason>',
  async execute(message, args) {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return message.reply('❌ You lack permission.');

    const target = message.mentions.members.first();
    const duration = parseInt(args[1]);
    const reason = args.slice(2).join(' ');
    const caseNumber = await getNextModCaseNumber(message.guild.id);

    if (!target || isNaN(duration) || !reason) {
      return message.reply('Usage: `!mute @user <duration> <reason>`');
    }

    const ms = duration * 60 * 1000;
    await target.timeout(ms, reason).catch(() => null);

    await Moderation.create({
      guildId: message.guild.id,
      userId: target.id,
      moderatorId: message.author.id,
      action: 'mute',
      reason,
      caseNumber,
      duration
    });

    const embed = {
      color: 0xFFA500,
      title: '<:njrp:1405946538097643580> User Muted',
      fields: [
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Duration**', value: `${duration} minutes` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${message.author.id}>` }
      ],
      timestamp: new Date()
    };

    const logChannel = message.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    try {
      await target.send({ embeds: [embed] });
    } catch {}

    message.reply(`**Case Number: #${caseNumber}: ${target.username} has been muted for ${duration} minutes!**`);
  }
};