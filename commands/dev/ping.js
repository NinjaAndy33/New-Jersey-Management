const { SlashCommandBuilder } = require('discord.js');

const pingCommand = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Shows bot and API latency.');

module.exports = {
  data: pingCommand,
  async execute(interaction) {
    const sent = await interaction.reply('🏓 Pinging...');
    const botLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply(`🏓 Pong!\nBot Latency: \`${botLatency}ms\`\nAPI Latency: \`${apiLatency}ms\``);
  }
};
