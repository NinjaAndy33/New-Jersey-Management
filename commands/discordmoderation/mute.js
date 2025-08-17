const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const ms = require('ms');
const logChannelId = '1405942493081767988';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Log a temporary mute without applying a role')
    .addUserOption(option =>
      option.setName('target').setDescription('User to mute').setRequired(true))
    .addStringOption(option =>
      option.setName('duration').setDescription('Mute duration (e.g. 10m, 1h)').setRequired(true))
    .addStringOption(option =>
      option.setName('reason').setDescription('Reason for mute').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('target');
    const member = await interaction.guild.members.fetch(target.id);
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const timeMs = ms(duration);

    if (!member) return interaction.editReply('❌ Member not found.');
    if (!timeMs) return interaction.editReply('❌ Invalid duration format.');
    if (target.bot || target.id === interaction.user.id) return interaction.editReply('❌ Invalid target.');
    if (member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.editReply('❌ Cannot mute someone with equal or higher role.');

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setTitle('⚠️ You have been muted')
      .setDescription(`You were muted in **${interaction.guild.name}**.`)
      .addFields(
        { name: 'Duration', value: duration, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true }
      )
      .setColor(0xffcc00)
      .setTimestamp();

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${target.tag}:`, err);
    }

    // Log to mod channel
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel?.type === ChannelType.GuildText) {
      const muteEmbed = new EmbedBuilder()
        .setTitle('User Muted (Logged Only)')
        .setColor(0x808080)
        .addFields(
          { name: 'User', value: `${member}`, inline: true },
          { name: 'Duration', value: duration, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setFooter({ text: `Muted by ${interaction.user.tag}` })
        .setTimestamp();

      await logChannel.send({ embeds: [muteEmbed] }).catch(() =>
        console.warn(`Log channel ${logChannelId} missing or not text.`));
    }

    // Optional: Schedule follow-up action
    setTimeout(() => {
      console.log(`Mute expired for ${target.tag} after ${duration}`);
      // You could notify staff or log expiration here
    }, timeMs);

    return interaction.editReply(`✅ Logged mute for ${target.tag} (${duration})`);
  }
};