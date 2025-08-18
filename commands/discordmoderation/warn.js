
const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');

const logChannelId = '1405942493081767988';
const requiredRoleId = '1405237617515298978';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user with a reason')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('target').setDescription('User to warn').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),

  async execute(interaction) {
    // 1) Defer immediately to “lock in” the interaction
    await interaction.deferReply({ ephemeral: true });

    // 2) Guild-only guard
    if (!interaction.inGuild()) {
      return interaction.editReply('❌ This command can only run in a server.');
    }

   
    const moderator =
      interaction.member ??
      (await interaction.guild.members.fetch(interaction.user.id).catch(() => null));

   
    if (
      !moderator?.roles?.cache?.has(requiredRoleId) &&
      !moderator?.permissions?.has(PermissionFlagsBits.ModerateMembers)
    ) {
      return interaction.editReply('🚫 You do not have permission to use this command.');
    }


    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason');

    if (!target || target.bot || target.id === interaction.user.id) {
      return interaction.editReply('❌ Invalid target.');
    }

    
    const dmEmbed = new EmbedBuilder()
      .setTitle('⚠️ You have been warned')
      .setDescription(`You received a warning in **${interaction.guild.name}**.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Moderator', value: interaction.user.tag }
      )
      .setColor(0xffcc00)
      .setTimestamp();


    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.tag}:`, err);
    }


    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel?.type === ChannelType.GuildText) {
      const logEmbed = new EmbedBuilder()
        .setTitle('⚠️ Member Warned')
        .addFields(
          { name: 'User', value: `(<@${target.id}>) ${target.id}`, inline: true },
          { name: 'Moderator', value: `(<@${interaction.user.id}>) ${interaction.user.id}`, inline: true },
          { name: 'Reason', value: reason }
        )
        .setColor(0xffcc00)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    } else {
      console.warn(`Log channel ${logChannelId} missing or not text.`);
    }

    return interaction.editReply(`✅ Warned <@${target.id}> for: ${reason}`);
  }
};