const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const logChannelId = '1405940504578887690'; // mod-log channel ID
const allowedRoles = ['1405237617515298978']; // allowed role IDs

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infraction-issue')
    .setDescription('Issue an infraction to a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to issue an infraction to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('The reason for the infraction')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the infraction in days')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('type')
        .setDescription('The type of infraction')
        .setRequired(true)
        .addChoices(
          { name: 'Notice', value: 'Notice' },
          { name: 'Warning', value: 'Warning' },
          { name: 'Strike', value: 'Strike' },
          { name: 'Suspension', value: 'Suspension' },
          { name: 'Termination', value: 'Termination' }
        )),

  async execute(interaction) {
    const member = interaction.member;

    // Permission check
    const hasRole = allowedRoles.some(role => member.roles.cache.has(role));
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!hasRole && !isAdmin) {
      return interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // Get command options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    const duration = interaction.options.getInteger('duration');
    const type = interaction.options.getString('type');

    // Calculate expiration timestamp
    const durationMs = duration * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs);
    const discordTimestamp = `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`;

    // Build embed
    const infractionEmbed = new EmbedBuilder()
      .setColor('#FFFFFF')
      .setTitle('Staff Infraction')
      .addFields(
        { name: 'User', value: user.tag, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Expires At', value: discordTimestamp, inline: true },
        { name: 'Type', value: type, inline: true }
      )
      .setFooter({ text: `Issued by ${interaction.user.tag}` })
      .setTimestamp();

    // Send to mod-log channel
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({ embeds: [infractionEmbed] });
    } else {
      console.warn(`Log channel with ID ${logChannelId} not found.`);
    }

    // Confirm to command issuer
    await interaction.reply({
      content: `✅ Infraction issued to ${user.tag} and logged.`,
      ephemeral: true
    });
  }
};