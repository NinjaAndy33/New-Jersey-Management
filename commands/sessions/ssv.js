const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType
} = require('discord.js');
const voteHandler = require('../components/vote.js'); 

// 🔒 Allowed role IDs
const allowedRoles = ['1405237617515298978']; // Replace with actual role IDs

// 📢 Target channel ID
const targetChannelId = '1405234503664013543'; // Replace with actual channel ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName('session-vote')
    .setDescription('Start a session vote')
    .addIntegerOption(option =>
      option.setName('votes')
        .setDescription('Number of votes required to start the session')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const voteThreshold = interaction.options.getInteger('votes');
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermission = allowedRoles.some(roleId => member.roles.cache.has(roleId));

      if (!hasPermission) {
        return interaction.reply({
          content: '❌ You do not have permission to run this command.',
          ephemeral: true
        });
      }

      const channel = interaction.guild.channels.cache.get(targetChannelId);
      if (!channel || channel.type !== ChannelType.GuildText) {
        return interaction.reply({
          content: '⚠️ Target channel not found or is not a text channel.',
          ephemeral: true
        });
      }

      // ✅ Vote button
      const voteButton = new ButtonBuilder()
        .setCustomId('vote')
        .setLabel('✅ Vote')
        .setStyle(ButtonStyle.Primary);

      // 📊 Voter Count button
      const countButton = new ButtonBuilder()
        .setCustomId('vote_count')
        .setLabel('📊 Voter Count')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(voteButton, countButton);

      const messageEmbed = new EmbedBuilder()
        .setColor(0xFFFFFF)
        .setTitle('Session Vote')
        .setDescription(`NJRP High Ranks are initiating a Session Vote! Please vote please to secure your spot for the SSU!!\n**Required Votes:** **${voteThreshold}**\n**Initiator:** <@${interaction.user.id}>`)
        .setTimestamp();

      const message = await channel.send({
        content: '@here <@&1407060155455242272>',
        embeds: [messageEmbed],
        components: [row],
        allowedMentions: { parse: ['everyone'] }
      });

      voteHandler.registerSession(message, voteThreshold);

      await interaction.reply({
        content: `✅ Session vote started in <#${targetChannelId}>`,
        ephemeral: true
      });
    } catch (err) {
      console.error('Session vote error:', err);
      const errorReply = { content: '⚠️ Something went wrong.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorReply);
      } else {
        await interaction.reply(errorReply);
      }
    }
  }
};