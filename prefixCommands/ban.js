const Moderation = require('../../schema/moderationSchema.js');
const getNextModCaseNumber = require('../../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978'; // Replace with your staff role ID
const MODLOG_CHANNEL_ID = '1405942493081767988'; // Replace with your modlog channel ID

module.exports = {
  name: 'ban',
  aliases: [],
  description: 'Ban a user from the server',
  usage: '<@user> <reason>',
  async execute(message, args) {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return message.reply('❌ You lack permission.');

    const target = message.mentions.users.first();
    const reason = args.slice(1).join(' ');
    const caseNumber = await getNextModCaseNumber(message.guild.id);

    if (!target || !reason) return message.reply('Usage: `!ban @user <reason>`');

    await message.guild.members.ban(target.id, { reason });

    await Moderation.create({
      guildId: message.guild.id,
      userId: target.id,
      moderatorId: message.author.id,
      action: 'ban',
      reason,
      caseNumber
    });

    const embed = {
      color: 0x8B0000,
      title: '<:njrp:1405946538097643580> User Banned',
      fields: [
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${message.author.id}>` }
      ],
      timestamp: new Date()
    };

    const logChannel = message.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    message.reply(`**Case Number: #${caseNumber}: ${target.username} has been banned!**`);
  }
};