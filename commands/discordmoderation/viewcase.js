const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Moderation = require('../../schema/moderationSchema.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modlog-case')
    .setDescription('View or edit a specific moderation case')
    .addIntegerOption(opt =>
      opt.setName('case')
        .setDescription('Case number to view')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('edit_reason')
        .setDescription('New reason to update (optional)')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('void')
        .setDescription('Mark this case as voided')
        .setRequired(false)
    ),

  async execute(interaction) {
    const STAFF_ROLE_ID = '1405237617515298978';
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: '❌ You lack permission.', ephemeral: true });
    }

    const caseNumber = interaction.options.getInteger('case');
    const newReason = interaction.options.getString('edit_reason');
    const voidFlag = interaction.options.getBoolean('void');

    const record = await Moderation.findOne({ guildId: interaction.guild.id, caseNumber });
    if (!record) return interaction.reply({ content: `❌ Case #${caseNumber} not found.`, ephemeral: true });

    if (newReason) record.reason = newReason;
    if (voidFlag) record.voided = true;
    if (newReason || voidFlag) await record.save();

    const embed = new EmbedBuilder()
      .setColor(record.voided ? 0x808080 : 0x5865F2)
      .setTitle(`🧾 Case #${record.caseNumber} — ${record.action.toUpperCase()}`)
      .addFields(
        { name: '<:arrow:1403083049822060644> **Reason**', value: record.reason || 'No reason provided' },
        { name: '<:arrow:1403083049822060644> **Moderator**', value: `<@${record.moderatorId}>` },
        { name: '<:arrow:1403083049822060644> **Date**', value: `<t:${Math.floor(new Date(record.timestamp).getTime() / 1000)}:F>` },
        { name: '<:arrow:1403083049822060644> **Voided**', value: record.voided ? '✅' : '❌' }
      )
      .setFooter({ text: `Case Viewer` })
      .setTimestamp();

    interaction.reply({ embeds: [embed], ephemeral: true });
  }
};