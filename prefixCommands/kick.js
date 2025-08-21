const Moderation = require('../schema/moderationSchema.js');
const getNextModCaseNumber = require('../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const MODLOG_CHANNEL_ID = '1405942493081767988';

module.exports = {
  name: 'kick',
  aliases: [],
  description: 'Kick a user from the server',
  usage: '<@user> <reason>',
  async execute(message, args) {
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
      return message.reply('❌ You lack permission.');
    }

    const target = message.mentions.members.first();
    const reason = args.slice(1).join(' ');
    const caseNumber = await getNextModCaseNumber(message.guild.id);

    if (!target || !reason) {
      return message.reply('Usage: `!kick @user <reason>`');
    }

    if (!target.kickable) {
      return message.reply('❌ Cannot kick this user.');
    }

    const embed = {
      color: 0xFF4500,
      title: '<:njrp:1405946538097643580> User Kicked',
      fields: [
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${message.author.id}>` }
      ],
      timestamp: new Date()
    };

    // 📬 DM the user before kicking
    try {
      await target.send({
        embeds: [embed]
      });
    } catch (err) {
      console.warn(`⚠️ Failed to DM ${target.user.tag}:`, err.message);
    }

    // 🦵 Kick the user
    await target.kick(reason);

    // 📝 Log to database
    await Moderation.create({
      guildId: message.guild.id,
      userId: target.id,
      moderatorId: message.author.id,
      action: 'kick',
      reason,
      caseNumber
    });

    // 📤 Send to modlog channel
    const logChannel = message.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    // ✅ Confirm to moderator
    message.reply(`**Case Number: #${caseNumber}: ${target.username} has been kicked!**`);
  }
};