const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Infraction = require('../../schema/infractionSchema.js');
const getNextCaseNumber = require('../../utils/getNextCaseNumber.js');

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

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle(`✅ Infraction Issued`)
      .addFields(
        { name: 'Case Number', value: `#${caseNumber}`, inline: true },
        { name: 'User', value: `<@${target.id}> (${target.tag})`, inline: true },
        { name: 'Type', value: type, inline: true },
        { name: 'Reason', value: reason }
      )
      .setFooter({
  text: `Issued By: <@${interaction.user.id}>`,
  iconURL: interaction.user.displayAvatarURL()
})
      .setTimestamp();

    if (expirationDate) {
      embed.addFields({
        name: 'Expires',
        value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:R>`,
        inline: true
      });
    }

    // 🔔 Log to mod channel
    const logChannelId = '1405940504578887690'; // Replace with your actual channel ID
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({
        content: `<@${target.id}>`,
        embeds: [embed]
      });
    }

    // 📩 DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle(`⚠️ You’ve received an infraction in ${interaction.guild.name}`)
        .addFields(
          { name: 'Case Number', value: `#${caseNumber}` },
          { name: 'Type', value: type },
          { name: 'Reason', value: reason },
          { name: 'Moderator', value: `${interaction.user.tag}` }
        )
        .setTimestamp();

      if (expirationDate) {
        dmEmbed.addFields({
          name: 'Expires',
          value: `<t:${Math.floor(expirationDate.getTime() / 1000)}:R>`
        });
      }

      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.tag}:`, err);
    }

    return interaction.reply({ embeds: [embed] });
  }
};