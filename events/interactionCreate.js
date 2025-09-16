module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: 'Command not found.', ephemeral: true });

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error executing this command.', ephemeral: true });
    }
  }
};

const { EmbedBuilder } = require('discord.js');

const ticketTypes = {
  support: {
    name: 'General Support',
    staffRoleId: '1406596164094263306',
    categoryId: '1407417421051986020',
    title: 'Support Ticket',
    description: 'Thank you for opening a General Support Ticket! Please state your issue while you wait for Support Staff.',
  },
  IA: {
    name: 'Internal Affairs',
    staffRoleId: '1406596164094263306',
    categoryId: '1407417421051986020',
    title: 'Internal Affairs Ticket',
    description: 'Thank you for opening an Internal Affairs Ticket! Please describe who you\'re reporting and why.',
  },
  management: {
    name: 'Management Support',
    staffRoleId: '1406596164094263306',
    categoryId: '1407417421051986020',
    title: 'Management Support Ticket',
    description: 'Thank you for opening a Management Support Ticket! Please explain your appeal clearly while you wait for a management member.',
  },
};

module.exports = {
  data: {
    name: 'createTicket',
  },
  async execute(interaction) {
    const { user, options, guild } = interaction;
    const type = options.getString('type');
    const config = ticketTypes[type];

    if (!config) {
      return interaction.reply({
        content: `❌ Invalid ticket type: \`${type}\``,
        ephemeral: true,
      });
    }

    // Create channel logic (assumed to be elsewhere)
    const channel = await guild.channels.create({
      name: `${type}-ticket-${user.username}`,
      type: 0, // GuildText
      parent: config.categoryId,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: config.staffRoleId,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setTitle(config.title)
      .setDescription(`${config.description}\n\n**Ticket Opener:** <@${user.id}>\n**Ticket Opener ID:** ${user.id}`)
      .setColor(0x46bf55)
      .setTimestamp();

    await channel.send({
      content: `<@${user.id}>`,
      embeds: [embed],
    });

    await interaction.reply({
      content: `✅ Your ticket has been created: ${channel}`,
      ephemeral: true,
    });

    console.log(`[Ticket Created] Type: ${type}, User: ${user.tag} (${user.id}), Channel: ${channel.name}`);
  },
};
