const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessionlow')
    .setDescription('Announces that the ERLC session is low.')
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const modLogChannelId = config.channels.modLog;
    const allowedRoleIds = [config.roles.sessionHost, config.roles.staff];

    // Role check
    const hasAllowedRole = interaction.member.roles.cache.some(role =>
      allowedRoleIds.includes(role.id)
    );

    if (!hasAllowedRole) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // Fetch mod log channel
    const modLogChannel = interaction.guild.channels.cache.get(modLogChannelId);
    if (!modLogChannel) {
      return interaction.reply({
        content: '❌ Mod log channel not found. Please check your config.',
        ephemeral: true
      });
    }

    // Build embed + button
    const embed = new EmbedBuilder()
      .setTitle('🔻 ERLC Session Low')
      .setDescription('The current ERLC session is now low. You may begin wrapping up your roleplay or prepare for session end.')
      .setColor(0xFF0000)
      .setFooter({ text: 'Please follow all server rules until the session officially ends.' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('Join ERLC Server')
      .setStyle(ButtonStyle.Link)
      .setURL('https://your-erlc-server-link.com'); // ← Replace with your actual link

    const row = new ActionRowBuilder().addComponents(button);

    // Send to mod log channel
    await modLogChannel.send({ embeds: [embed], components: [row] });

    // Confirm to user
    await interaction.reply({
      content: `✅ Session Low announcement sent to <#${modLogChannelId}>.`,
      ephemeral: true
    });
  }
};