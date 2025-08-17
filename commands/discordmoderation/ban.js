const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const requiredRoleId = '1406596164094263306';
const logChannelId = '1405942493081767988';


module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(true)), // ← Removed the semicolon here

  async execute(interaction) {
    const moderator = interaction.member;

    // Check if moderator has the required role
    if (!moderator.roles.cache.has(requiredRoleId)) {
      return interaction.reply({
        content: `❌ You need the required role to use this command.`,
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    }

    if (!member.bannable) {
      return interaction.reply({ content: '❌ I cannot ban this member.', ephemeral: true });
    }

    const displayName = member.nickname || member.user.username;

    try {
      // Attempt to DM the user
      await target.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('🚫 You have been banned')
            .setDescription(`You were banned from **${interaction.guild.name}**.`)
            .addFields(
              { name: 'Reason', value: reason },
              { name: 'Moderator', value: `<@${interaction.user.id}> (${interaction.user.tag})` }
            )
            .setColor(0xff0000)
            .setTimestamp()
        ]
      }).catch(() => {
        console.warn(`Could not DM ${target.tag}`);
      });

      // Proceed with ban
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setTitle('🚫 Member Banned')
        .addFields(
          { name: 'User', value: `<@${target.id}> (${displayName})`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp();

      await interaction.reply({ content: `✅ ${displayName} (${target.tag}) has been banned.` });

      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        await logChannel.send({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Ban Error:', error);
      await interaction.reply({ content: '❌ Something went wrong while trying to ban.', ephemeral: true });
    }
  },
};