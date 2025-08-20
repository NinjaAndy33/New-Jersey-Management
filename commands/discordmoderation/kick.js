const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');
const getNextModCaseNumber = require('../../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const MODLOG_CHANNEL_ID = '1405942493081767988';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(opt =>
      opt.setName('target').setDescription('User to kick').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for kick').setRequired(true)
    ),

  async execute(interaction) {
    // 🔐 Permission check
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const target = interaction.options.getMember('target');
    const reason = interaction.options.getString('reason');
    const caseNumber = await getNextModCaseNumber(interaction.guild.id);

    // ❌ Validation
    if (!target || !target.kickable) {
      return interaction.reply({ content: '❌ Cannot kick this user.', ephemeral: true });
    }

    // 📋 Embed for modlog and DM
    const embed = new EmbedBuilder()
      .setColor(0xFF4500)
      .setTitle('<:njrp:1405946538097643580> User Kicked')
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    // 📬 DM the user before kicking
    try {
      await target.send({
        embeds: [embed.setTitle(`🦵 You’ve been kicked from ${interaction.guild.name}`)]
      });
    } catch (err) {
      console.warn(`⚠️ Failed to DM ${target.user.tag}:`, err.message);
    }

    // 🦵 Kick the user
    await target.kick(reason);

    // 📝 Log to database
    await Moderation.create({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      action: 'kick',
      reason,
      caseNumber
    });

    // 📤 Send to modlog channel
    const logChannel = interaction.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    // ✅ Confirm to moderator
    interaction.reply({
      content: `Case Number: #${caseNumber}: ${target.username} has been kicked!**`,
      ephemeral: true
    });
  }
};