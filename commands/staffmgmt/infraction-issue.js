const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Infraction = require('../../schema/infractionSchema.js');
const getNextCaseNumber = require('../../utils/getNextCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const LOG_CHANNEL_ID = '1405940504578887690';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infraction-issue')
    .setDescription('Issue an infraction to a user.')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to infract')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for the infraction')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Select the infraction type')
        .setRequired(true)
        .addChoices(
          { name: 'Notice', value: 'Notice' },
          { name: 'Warning', value: 'Warning' },
          { name: 'Strike', value: 'Strike' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Termination', value: 'Termination' }
        )
    )
    .addIntegerOption(opt =>
      opt.setName('expires')
        .setDescription('Expiration time in days (optional)')
        .setRequired(false)
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
    const reason = interaction.options.getString('reason');
    const type = interaction.options.getString('type');
    const expiresInDays = interaction.options.getInteger('expires');
    const expirationDate = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    let targetMember;
    try {
      targetMember = await interaction.guild.members.fetch(target.id);
    } catch {
      return interaction.reply({
        content: '❌ That user is not a member of this server.',
        ephemeral: true
      });
    }

    const caseNumber = await getNextCaseNumber(interaction.guild.id);

    try {
      await Infraction.create({
        guildId: interaction.guild.id,
        userId: target.id,
        moderatorId: interaction.user.id,
        reason,
        type,
        timestamp: new Date(),
        caseNumber,
        expiresAt: expirationDate
      });
    } catch (err) {
      console.error('Failed to create infraction:', err);
      return interaction.reply({
        content: '❌ Could not record the infraction.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle(`Staff Infraction`)
      .addFields(
        { name: '**Case Number**', value: `#${caseNumber}` },
        { name: '**User**', value: `<@${target.id}> (${target.id})` },
        { name: '**Type**', value: type },
        { name: '**Reason**', value: reason }
      )
      .setFooter({
        text: `Issued By: ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    if (expirationDate) {
      embed.addFields({
        name: '**Expires**',
        value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:R>`
      });
    }

    // 🔔 Log to mod channel
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID)
      ?? await interaction.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

    if (logChannel) {
      await logChannel.send({
        content: `<@${target.id}>`,
        embeds: [embed]
      });
    }

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle(`Staff Infraction`)
        .addFields(
          { name: '**Case Number**', value: `#${caseNumber}` },
          { name: '**Type**', value: type },
          { name: '**Reason**', value: reason },
          { name: '**Issued By:**', value: `<@${interaction.user.id}>` }
        )
        .setTimestamp();

      if (expirationDate) {
        dmEmbed.addFields({
          name: '**Expires**',
          value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:R>`
        });
      }

      const serverName = interaction.guild.name;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`From: ${serverName}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await target.send({
        embeds: [dmEmbed],
        components: [row]
      });
    } catch (err) {
      console.warn(`Could not DM ${target.username}:`, err);
    }

    return interaction.reply({
      content: `<:whitecheck:1407773605642764389> <@${target.id}> has successfully been infracted!`,
      ephemeral: true
    });
  }
};
