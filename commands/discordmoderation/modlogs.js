// /modlog-view.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlog-view')
    .setDescription('View a user’s moderation history with pagination')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to view')
        .setRequired(true)
    ),

  async execute(interaction) {
    const STAFF_ROLE_ID = '1405237617515298978';
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const target = interaction.options.getUser('target');
    const records = await Moderation.find({ guildId: interaction.guild.id, userId: target.id }).sort({ caseNumber: -1 });

    if (!records.length) {
      return interaction.reply({ content: `📭 No infractions found for ${target.tag}.`, ephemeral: true });
    }

    let index = 0;
    const generateEmbed = (record) => new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`<:njrp:1405946538097643580> **Case** #${record.caseNumber} — ${record.action.toUpperCase()}`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Reason**', value: record.reason || 'No reason provided' },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${record.moderatorId}>` },
        { name: '<:arrow:1403083049822060644> **Date**', value: `<t:${Math.floor(new Date(record.timestamp).getTime() / 1000)}:F>` },
        { name: '<:arrow:1403083049822060644> **Expired**', value: record.expired ? '✅' : '❌' }
      )
      .setFooter({ text: `Viewing ${target.tag}'s moderations (${index + 1}/${records.length})` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('⬅️ Previous').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('next').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [generateEmbed(records[index])], components: [row], ephemeral: true });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60000
    });

    collector.on('collect', async i => {
      i.deferUpdate();
      if (i.customId === 'prev') index = index > 0 ? index - 1 : records.length - 1;
      if (i.customId === 'next') index = index < records.length - 1 ? index + 1 : 0;
      await interaction.editReply({ embeds: [generateEmbed(records[index])], components: [row] });
    });
  }
};