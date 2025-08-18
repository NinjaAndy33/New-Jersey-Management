const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField
} = require('discord.js');

const requiredRoleId = '1405237617515298978';
const logChannelId = '1405234503664013543';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sessionvote')
    .setDescription('Vote for a session')
    .addIntegerOption(option =>
      option.setName('votes')
        .setDescription('The number of votes required to start the session')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: '⚠️ This command can only be used in a server.',
        ephemeral: true
      });
    }

    const votes = interaction.options.getInteger('votes');
    const member = interaction.member;

    const hasRole = member.roles.cache.has(requiredRoleId);
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!hasRole && !isAdmin) {
      return interaction.reply({
        content: '🚫 You do not have permission to start a session.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('✅ Session Start Up')
      .setDescription('A Session Startup has been Initiated! Please react with "✅" to vote!')
      .addFields(
        { name: 'Required Votes', value: `${votes}`, inline: true },
        { name: 'Initiator', value: `<@${member.id}>`, inline: true }
      )
      .setTimestamp();

    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (!logChannel) {
      console.warn(`❌ Log channel with ID ${logChannelId} not found.`);
      return interaction.editReply({
        content: '⚠️ Could not find the log channel.'
      });
    }

    try {
      const message = await logChannel.send({
        content: `<@&1407060155455242272> @here`,
        embeds: [embed]
      });

      await message.react('✅');

      // Final reply to user — only one embed sent
      return interaction.editReply({
        content: '✅ Session Vote has been Initiated!'
      });
    } catch (error) {
      console.error('❌ Failed to send message or react:', error);
      return interaction.editReply({
        content: '⚠️ Something went wrong while sending the session startup.'
      });
    }
  }
};