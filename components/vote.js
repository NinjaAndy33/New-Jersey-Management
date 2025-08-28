const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// 🗳️ Store active vote sessions
const activeVotes = new Map(); // messageId => { count, threshold, voters }

module.exports = {
  // Register a new session vote
  registerSession(message, threshold) {
    activeVotes.set(message.id, {
      count: 0,
      threshold,
      voters: new Set()
    });
  },

  // Component interaction handler
  async handle(interaction) {
    if (!interaction.isButton()) return;

    const session = activeVotes.get(interaction.message.id);
    if (!session) {
      return interaction.reply({
        content: '⚠️ This vote session is no longer active.',
        ephemeral: true
      });
    }

    const userId = interaction.user.id;

    // 📊 Handle Voter Count button
    if (interaction.customId === 'vote_count') {
      const voterList = Array.from(session.voters)
        .map(id => `<@${id}>`)
        .join('\n');

      return interaction.reply({
        content: `📊 Current Votes: **${session.count}/${session.threshold}**\n\n**Voters:**\n${voterList || 'No votes yet.'}`,
        ephemeral: true
      });
    }

    // ✅ Handle Vote button
    if (interaction.customId === 'vote') {
      if (session.voters.has(userId)) {
        return interaction.reply({
          content: '❌ You have already voted.',
          ephemeral: true
        });
      }

      session.voters.add(userId);
      session.count++;

      await interaction.reply({
        content: `✅ Your vote has been counted! (${session.count}/${session.threshold})`,
        ephemeral: true
      });

      // 🎉 Threshold met — send session startup embed with join button
      if (session.count >= session.threshold) {
        const embed = new EmbedBuilder()
          .setColor(0xE53822)
          .setTitle('Session Startup!')
          .setDescription(
            'Our session has started! If you voted for the Session Startup, please join within 30 minutes to avoid moderation.\n\nLet’s have a great session at **New Jersey State Roleplay**!'
          )
          .setFooter({ text: 'New Jersey State Roleplay' })
          .setTimestamp();

        const joinLinkButton = new ButtonBuilder()
          .setLabel('Quick Join')
          .setStyle(ButtonStyle.Link)
          .setURL('https://policeroleplay.community/join/njrpst'); // Replace with actual session link

        const row = new ActionRowBuilder().addComponents(joinLinkButton);

        await interaction.channel.send({
          content: '@here <@&1385413644795379782>',
          embeds: [embed],
          components: [row],
          allowedMentions: { parse: ['everyone'] }
        });

        activeVotes.delete(interaction.message.id); 
      }
    }
  }
};
