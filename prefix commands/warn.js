const { EmbedBuilder } = require('discord.js');
const Moderation = require('../schema/moderationSchema.js');
const getNextModCaseNumber = require('../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const MODLOG_CHANNEL_ID = '1405942493081767988';

module.exports = {
  name: 'warn',
  aliases: [],
  description: 'Warn a user and log the infraction',
  usage: '<@user> <reason>',
  async execute(message, args) {
    // 🔐 Permission check
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) {
      return message.reply('❌ You do not have permission to use this command.');
    }

    // 🎯 Target & Reason
    const target = message.mentions.users.first();
    const reason = args.slice(1).join(' ');
    if (!target || !reason) {
      return message.reply('Usage: `!warn @user <reason>`');
    }

    // 🧾 Case Number & DB Logging
    const caseNumber = await getNextModCaseNumber(message.guild.id);
    await Moderation.create({
      guildId: message.guild.id,
      userId: target.id,
      moderatorId: message.author.id,
      action: 'warn',
      reason,
      caseNumber,
      timestamp: new Date()
    });

    // 📋 Modlog Embed
    const modlogEmbed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle('<:njrp:1405946538097643580> User Warned')
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case Number:**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User:**', value: `<@${target.id}> (${target.username})` },
        { name: '<:arrow:1403083049822060644> **Reason:**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator:**', value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    const logChannel = message.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({ embeds: [modlogEmbed] });
    }

    // 📬 DM Embed
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle(`<:njrp:1405946538097643580> You’ve been warned in ${message.guild.name}`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case Number:**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **Reason:**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator:**', value: `${message.author.tag}` }
      )
      .setTimestamp();

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.tag}: ${err.message}`);
    }

    // ✅ Confirmation
    message.reply(`**Case Number: #${caseNumber}: ${target.username} has been warned!**`);
  }
};