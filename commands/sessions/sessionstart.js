const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const requiredRoleId = '1405237617515298978'; // Replace with your actual role ID
const logChannelId = '1405234503664013543';   // Replace with your actual log channel ID
const erlcLink = 'https://policeroleplay.community/join/fsrpst'; // Replace with your actual ERLC link

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessionlow')
    .setDescription('Announces that the ERLC session is low.'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: '⚠️ This command can only be used in a server.',
        ephemeral: true
      });
    }

    const member = interaction.member;
    const hasRole = member.roles.cache.has(requiredRoleId);
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!hasRole && !isAdmin) {
      return interaction.reply({
        content: '🚫 You do not have permission to send a session low announcement.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#ffffff')
      .setTitle('Session Low')
      .setDescription('The current ERLC session is now low. Join up for more awesome roleplays!')
      .setFooter({ text: 'Make sure to read all rules before joining!' })
      .setTimestamp();

    const button = new ButtonBuilder()
      .setLabel('Join ERLC Server')
      .setStyle(ButtonStyle.Link)
      .setURL(erlcLink);

    const row = new ActionRowBuilder().addComponents(button);

    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
      console.warn(`❌ Log channel with ID ${logChannelId} not found.`);
      return interaction.editReply({
        content: '⚠️ Could not find the log channel.'
      });
    }

    try {
      await logChannel.send({
        content: `<@&1407060155455242272> @here`, // Optional ping
        embeds: [embed],
        components: [row]
      });

      return interaction.editReply({
        content: '✅ Session Low announcement has been sent!',
        ephemeral: true
      });
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return interaction.editReply({
        content: '⚠️ Something went wrong while sending the session low announcement.',
        ephemeral: true
      });
    }
  }
};