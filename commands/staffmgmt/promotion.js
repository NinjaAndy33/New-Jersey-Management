const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const logChannelId = '1405940091502858240';
const allowedRoles = ['1405237617515298978'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promote')
    .setDescription('Issues a Staff Promotion within the Staff Team')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to promote')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to promote the user to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes for the promotion')
        .setRequired(true)),

  async execute(interaction) {
    const member = interaction.member;

    // Permission check
    const hasRole = allowedRoles.some(role => member.roles.cache.has(role));
    const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!hasRole && !isAdmin) {
      return interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true
      });
    }

    // Get command options
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const notes = interaction.options.getString('notes');

    // Promote user
    const targetMember = await interaction.guild.members.fetch(user.id);
    await targetMember.roles.add(role);

    // Build embed
    const promotionEmbed = new EmbedBuilder()
      .setColor(role?.hexColor || '#2F3136') // use role color or fallback
      .setTitle('🎉 Staff Promotion')
      .addFields(
        { name: 'User', value: `<@${user.id}>`, inline: false },
        { name: 'New Role', value: `<@&${role.id}>`, inline: false },
        { name: 'Notes', value: notes || 'No additional notes provided.', inline: false }
      )
      .setFooter({ text: `Promoted by ${interaction.user.tag}` })
      .setTimestamp();

    // Send confirmation
    await interaction.reply({
      content: `✅ <@&${role.id}> has been promoted to ${role.name}.`,
      ephemeral: true
    });

    // Send embed to mod-log channel
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({
        content: `<@${user.id}>`, // ping the promoted user
        embeds: [promotionEmbed]
      });
    } else {
      console.warn(`Log channel with ID ${logChannelId} not found.`);
    }
  }
};