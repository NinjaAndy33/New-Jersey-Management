const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');
const getNextModCaseNumber = require('../../utils/getNextModCaseNumber.js');

const STAFF_ROLE_ID = '1405237617515298978';
const MODLOG_CHANNEL_ID = '1405942493081767988';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to ban')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for ban')
        .setRequired(true)
    ),

  async execute(interaction) {
    const { member, options, guild, user } = interaction;

    if (!member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const target = options.getUser('target');
    const reason = options.getString('reason');
    const caseNumber = await getNextModCaseNumber(guild.id);

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle('<:njrp:1405946538097643580> You’ve been banned')
      .setDescription(`You have been banned from **${guild.name}**.`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: user.tag }
      )
      .setTimestamp();

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`[WARN] Could not DM ${target.tag}: ${err.message}`);
    }

    // Ban the user
    await guild.members.ban(target.id, { reason });

    // Log to database
    await Moderation.create({
      guildId: guild.id,
      userId: target.id,
      moderatorId: user.id,
      action: 'ban',
      reason,
      caseNumber
    });

    // Send modlog embed
    const logEmbed = new EmbedBuilder()
      .setColor(0x8B0000)
      .setTitle('<:njrp:1405946538097643580> User Banned')
      .addFields(
        { name: '<:arrow:1403083049822060644> **Case**', value: `#${caseNumber}` },
        { name: '<:arrow:1403083049822060644> **User**', value: `<@${target.id}>` },
        { name: '<:arrow:1403083049822060644> **Reason**', value: reason },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${user.id}>` }
      )
      .setTimestamp();

    const logChannel = guild.channels.cache.get(MODLOG_CHANNEL_ID);
    if (logChannel) logChannel.send({ embeds: [logEmbed] });

    // Confirm to moderator
    interaction.reply({ content: `**Case Number: #${caseNumber}: ${target.username} has been banned!**`, ephemeral: true });
  }
};