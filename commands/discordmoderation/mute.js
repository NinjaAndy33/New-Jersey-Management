const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');
const getNextModCaseNumber = require('../../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const MODLOG_CHANNEL_ID = '1405942493081767988';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user for a set duration')
    .addUserOption(opt =>
      opt.setName('target').setDescription('User to mute').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('duration').setDescription('Duration in minutes').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for mute').setRequired(true)
    ),

  async execute(interaction) {
    // 🔐 Permission check
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const target = interaction.options.getMember('target');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason');
    const caseNumber = await getNextModCaseNumber(interaction.guild.id);

    // ❌ Invalid target
    if (!target || !target.timeout) {
      return interaction.reply({ content: '❌ Cannot mute this user.', ephemeral: true });
    }

    const ms = duration * 60 * 1000;
    await target.timeout(ms, reason);

    // 📝 Log to database
    await Moderation.create({
      guildId: interaction.guild.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      action: 'mute',
      reason,
      caseNumber,
      duration
    });

    // 📋 Embed for modlog
    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('<:njrp:1405946538097643580> User Muted')
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Duration**', value: `${duration} minutes` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    // 📤 Send to modlog channel
    const logChannel = interaction.guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [embed] });

    // 📬 DM the user
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle(`<:njrp:1405946538097643580> You’ve been muted in ${interaction.guild.name}`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **Duration**', value: `${duration} minutes` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    try {
      await target.send({
        embeds: [dmEmbed]
      });
    } catch (err) {
      console.warn(`⚠️ Failed to DM ${target.user.tag}:`, err.message);
    }

    // ✅ Confirm to moderator
    interaction.reply({
      content: `**Case Number: #${caseNumber}: ${target.username} has been muted for ${duration} minutes!**`,
      ephemeral: true
    });
  }
};