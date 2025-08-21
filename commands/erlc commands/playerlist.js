const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playerlist')
    .setDescription('View active players on the ERLC server'),

  async execute(interaction) {
    try {
      const response = await globalThis.fetch('https://api.policeroleplay.community/v1/server/players', {
        method: 'GET',
        headers: {
          'server-key': process.env.serverToken,
          'Accept': '*/*'
        }
      });

      const data = await response.json();

      const rankOrder = {
        'Server Owner': 1,
        'Co Owner': 2,
        'Server Administrator': 3,
        'Server Moderator': 4,
        'Normal': 5
      };

      const sortedPlayers = data.sort((a, b) => {
        const rankA = rankOrder[a.Permission] ?? 999;
        const rankB = rankOrder[b.Permission] ?? 999;
        return rankA - rankB;
      });

      // 🔢 Split into pages of 7 players
      const pages = [];
      for (let i = 0; i < sortedPlayers.length; i += 7) {
        const chunk = sortedPlayers.slice(i, i + 7);
        const description = chunk.map(player => {
          return `👤 **${player.Player}**
🔐 Permission: ${player.Permission}
📞 Callsign: ${player.Callsign || 'N/A'}
🛡️ Team: ${player.Team}`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
          .setTitle('Active Players')
          .setDescription(description)
          .setColor(0x3498DB)
          .setFooter({ text: `Page ${Math.floor(i / 7) + 1} of ${Math.ceil(sortedPlayers.length / 7)}` });

        pages.push(embed);
      }

      let pageIndex = 0;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('next').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({
        embeds: [pages[pageIndex]],
        components: pages.length > 1 ? [row] : [],
        ephemeral: true
      });

      if (pages.length <= 1) return;

      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 60000
      });

      collector.on('collect', async i => {
        await i.deferUpdate();
        if (i.customId === 'prev') pageIndex = pageIndex > 0 ? pageIndex - 1 : pages.length - 1;
        if (i.customId === 'next') pageIndex = pageIndex < pages.length - 1 ? pageIndex + 1 : 0;

        await interaction.editReply({
          embeds: [pages[pageIndex]],
          components: [row]
        });
      });

    } catch (error) {
      console.error('Error fetching player data:', error);
      await interaction.reply({
        content: '❌ Failed to fetch player data. Please try again later.',
        ephemeral: true
      });
    }
  }
};