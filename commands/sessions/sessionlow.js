const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

const channels = {
  modLog: '1405234503664013543'
};

const roles = {
  sessionHost: '1405237617515298978',
  staff: '1405229736195784804'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessionlow')
    .setDescription('Announces that the ERLC session is low.')
 ,

  async execute(interaction) {
    const modLogChannelId = channels.modLog;
    const allowedRoleIds = [roles.sessionHost, roles.staff];

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
      .setTitle('Session Low')
      .setDescription('The current ERLC session is now low. Please join the ERLC server to avoid Session Shutdown!')
      .setColor(0xFF0000)
      .setFooter({ text: 'Please follow all server rules until the session officially ends.' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Link)
      .setURL('https://policeroleplay.community/join/njrpst'); 

    const row = new ActionRowBuilder().addComponents(button);

    // Send to mod log channel
    await modLogChannel.send({ 
      content: '@here <@&1385413644795379782>',
      embeds: [embed], 
      components: [row] });

    // Confirm to user
    await interaction.reply({
      content: `✅ Session Low announcement sent to <#${modLogChannelId}>.`,
      ephemeral: true
    });
  }
};