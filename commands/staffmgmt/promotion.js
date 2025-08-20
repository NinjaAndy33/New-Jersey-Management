const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Promotion = require('../../schema/promotionSchema.js');
const getNextPromotionCaseNumber = require('../../utils/getNextPromotionCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978'; // Replace with your actual staff role ID
const LOG_CHANNEL_ID = '1405940091502858240'; // Replace with your mod log channel ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promotion-issue')
    .setDescription('Promote a staff member and log the promotion.')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User being promoted')
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('newrole')
        .setDescription('New role to assign')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the promotion')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 Role check
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const target = interaction.options.getUser('target');
    const newRole = interaction.options.getRole('newrole');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        content: '❌ That user is not a member of this server.',
        ephemeral: true
      });
    }

    const caseNumber = await getNextPromotionCaseNumber(interaction.guild.id);

    // 🧾 Log to DB
    await Promotion.create({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      oldRole: 'N/A', // Optional: you can remove this field from schema if unused
      newRole: newRole.id,
      reason,
      caseNumber,
      timestamp: new Date()
    });

    // 🛡️ Assign role
    await member.roles.add(newRole).catch(err => {
      console.error(`Failed to assign role:`, err);
    });

    // 📄 Embed
    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(`🎖️ Staff Promotion`)
      .addFields(
        { name: '📌 Case Number', value: `#${caseNumber}` },
        { name: '👤 User', value: `<@${target.id}> (${target.username}#${target.discriminator})` },
        { name: '⬆️ Promoted To', value: `<@&${newRole.id}>` },
        { name: '📝 Reason', value: reason }
      )
      .setFooter({
        text: `Issued By: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    // 🔔 Log to mod channel
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID)
      ?? await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

    if (logChannel) {
      await logChannel.send({
        content: `<@${target.id}>`,
        embeds: [embed]
      });
    }

    // 📩 DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setTitle(`🎉 You’ve been promoted in ${interaction.guild.name}!`)
        .addFields(
          { name: '📌 Case Number', value: `#${caseNumber}` },
          { name: '⬆️ New Role', value: `${newRole.name}` },
          { name: '📝 Reason', value: reason },
          { name: '👤 Issued By', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.username}:`, err);
    }

    return interaction.reply({
      content: `✅ <@${target.id}> has been promoted to <@&${newRole.id}>.`,
      ephemeral: true
    });
  }
};