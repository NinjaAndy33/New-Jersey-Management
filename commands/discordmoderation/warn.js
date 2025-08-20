const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');
const getNextModCaseNumber = require('../../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978'; // Replace with your staff role ID
const MODLOG_CHANNEL_ID = '1405942493081767988'; // Replace with your modlog channel ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to warn')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔐 Permission check
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // 🎯 Target & Reason
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const caseNumber = await getNextModCaseNumber(interaction.guild.id);

    // 🧾 Log to DB
    await Moderation.create({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
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

    // 📬 DM Embed
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle(`<:njrp:1405946538097643580> You’ve been warned in ${interaction.guild.name}`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case Number:**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **Reason:**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator:**', value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    // 🛰 Send to modlog channel
    const logChannel = interaction.guild.channels.cache.get(MODLOG_CHANNEL_ID)
      ?? await interaction.guild.channels.fetch(MODLOG_CHANNEL_ID).catch(() => null);

    if (logChannel) {
      await logChannel.send({ embeds: [modlogEmbed] });
    }

    // 📤 DM the user
    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.username}:`, err.message);
    }

    // ✅ Confirmation
    return interaction.reply({
  content: `**Case Number: #${caseNumber}: ${target.username} has been warned!**`,
  ephemeral: true
});
  }
};