const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
require('dotenv').config();
const fetch = require('node-fetch'); // ✅ Required for Node.js environments

module.exports = {
  data: new SlashCommandBuilder()
    .setName('erlc-server-command')
    .setDescription('Run an ERLC Command from Discord!')
    .addStringOption(opt =>
      opt.setName('command')
         .setDescription('Type the command you want to run')
         .setRequired(true)
    ),

  async execute(interaction) {
    const commandInput = interaction.options.getString('command');

    try {
      const response = await fetch('https://api.policeroleplay.community/v1/server/command', {
        method: 'POST',
        headers: {
          'server-key': process.env.serverToken, 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: commandInput })
      });

      const data = await response.json();

      const embed = new EmbedBuilder()
        .setTitle('Command Sent')
        .setDescription(`✅ Command \`${commandInput}\` was sent successfully.`)
        .setColor(0x00FF00);

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error sending command:', error);

      await interaction.reply({
        content: '❌ Failed to send the command. Please check your API key or try again later.',
        ephemeral: true
      });
    }
  }
};