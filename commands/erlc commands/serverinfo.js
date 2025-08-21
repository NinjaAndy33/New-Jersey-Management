const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View your ERLC server information'),

  async execute(interaction) {
    try {
      const response = await globalThis.fetch('https://api.policeroleplay.community/v1/server', {
        method: 'GET',
        headers: {
          'server-key': process.env.serverToken,
          'Accept': '*/*'
        }
      });

      const data = await response.json();

      const embed = new EmbedBuilder()
        .setTitle(`📊 ERLC Server Info: ${data.Name}`)
        .setColor(0x2ECC71)
        .addFields(
          { name: '👑 Owner ID', value: `${data.OwnerId}`, inline: true },
          { name: '🧑‍🤝‍🧑 Co-Owner IDs', value: data.CoOwnerIds.length ? data.CoOwnerIds.join(', ') : 'None', inline: true },
          { name: '🎮 Players Online', value: `${data.CurrentPlayers} / ${data.MaxPlayers}`, inline: true },
          { name: '🔑 Join Key', value: data.JoinKey || 'N/A', inline: true },
          { name: '✅ Account Verification', value: data.AccVerifiedReq || 'Unknown', inline: true },
          { name: '⚖️ Team Balance Enabled', value: data.TeamBalance ? 'Yes' : 'No', inline: true }
        )
        .setFooter({ text: 'Last updated on request' });

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error fetching server info:', error);
      await interaction.reply({
        content: '❌ Failed to fetch server info. Please check your API key or try again later.',
        ephemeral: true
      });
    }
  }
};