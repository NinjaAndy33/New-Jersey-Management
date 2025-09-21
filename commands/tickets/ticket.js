const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');

// 🔒 Role and Channel Configuration
const allowedRoleId = '1405228615859310693';     // Replace with actual role ID
const targetChannelId = '1405233678703005868'; // Replace with actual channel ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Send the ticket creation menu'),

  async execute(interaction) {
    // 🔐 Role Check
    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Create a Ticket')
      .setDescription('Select the type of support you need from the menu below.')
      .setColor(0x5865F2);

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Choose a ticket type...')
      .addOptions([
        {
          label: 'General Support',
          value: 'general',
          description: 'For basic help and questions',
        },
        {
          label: 'Internal Affairs',
          value: 'internal',
          description: 'To report a staff member',
        },
        {
          label: 'Management Support',
          value: 'management',
          description: 'For escalations or management issues',
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    // 📤 Send to target channel
    const targetChannel = interaction.guild.channels.cache.get(targetChannelId);
    if (!targetChannel) {
      return interaction.reply({
        content: 'Target channel not found. Please check the configuration.',
        ephemeral: true
      });
    }

    await targetChannel.send({ embeds: [embed], components: [row] });

    await interaction.reply({
      content: `✅ Ticket menu sent to <#${targetChannelId}>`,
      ephemeral: true
    });
  }
};
