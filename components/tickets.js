const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

// 🎯 Ticket Configuration
const ticketConfig = {
  general: {
    categoryId: '1407417215979880581',
    staffRoleId: '1407417876138299493',
    title: 'General Support Ticket',
    description: 'Please describe your issue. A staff member will assist you shortly.',
    color: 0x00BFFF
  },
  internal: {
    categoryId: '1407417302424748165',
    staffRoleId: '1405237617515298978',
    title: 'Internal Affairs Ticket',
    description: 'This ticket is to report a staff member. Please provide who you are reporting, and why.',
    color: 0xFFD700
  },
  management: {
    categoryId: '1407417421051986020',
    staffRoleId: '1406596164094263306',
    title: 'Management Support Ticket',
    description: 'For escalations or management-related concerns. Please explain.',
    color: 0x8A2BE2
  }
};

module.exports = {
  async execute(interaction) {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'ticket_select') return;

    const type = interaction.values[0];
    const user = interaction.user;
    const guild = interaction.guild;

    const config = ticketConfig[type];
    if (!config) {
      return interaction.reply({ content: 'Invalid ticket type selected.', ephemeral: true });
    }

    const sanitizedUsername = user.username.toLowerCase().replace(/[^a-z0-9]/gi, '-');

    // 🔍 Count existing tickets of this type for the user
    const userTickets = guild.channels.cache.filter(channel =>
      channel.parentId === config.categoryId &&
      channel.name.startsWith(`${type}-`) &&
      channel.permissionOverwrites.cache.has(user.id)
    );

    if (userTickets.size >= 5) {
      return interaction.reply({
        content: `❌ You already have 5 open tickets in the **${type}** category.`,
        ephemeral: true
      });
    }

    // 🆕 Generate a unique channel name
    const ticketNumber = userTickets.size + 1;
    const channelName = `${type}-${sanitizedUsername}-${ticketNumber}`;

    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.categoryId,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        },
        {
          id: config.staffRoleId,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(config.title)
      .setDescription(
        `${config.description}\n\n` +
        `**Opened By:** <@${user.id}>\n` +
        `**User ID:** ${user.id}`
      )
      .setColor(config.color);

    await channel.send({
      content: `<@${user.id}> <@&${config.staffRoleId}>`,
      embeds: [embed]
    });

    await interaction.reply({
      content: `✅ Ticket created: ${channel}`,
      ephemeral: true
    });
  }
};
