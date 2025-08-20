module.exports = {
  name: 'modlog',
  description: 'View a user’s moderation history',
  async execute(message, args, client) {
    const STAFF_ROLE_ID = '1405237617515298978';
    if (!message.member.roles.cache.has(STAFF_ROLE_ID)) return message.reply('❌ You lack permission.');

    const userId = args[0];
    const target = await client.users.fetch(userId).catch(() => null);
    if (!target) return message.reply('User not found.');

    const records = await Moderation.find({ guildId: message.guild.id, userId: target.id }).sort({ caseNumber: -1 });
    if (!records.length) return message.reply(`📭 No infractions found for ${target.tag}.`);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`📄 Moderation History for ${target.tag}`)
      .setFooter({ text: `Total Cases: ${records.length}` })
      .setTimestamp();

    for (const record of records.slice(0, 5)) {
      embed.addFields({
        name: `<:njrp:1405946538097643580> **Case #${record.caseNumber}**`,
        value: `**Action:** ${record.action.toUpperCase()}\n**Reason:** ${record.reason}\n**Moderator:** <@${record.moderatorId}>\n**Date:** <t:${Math.floor(new Date(record.timestamp).getTime() / 1000)}:F>`,
        inline: false
      });
    }

    message.channel.send({ embeds: [embed] });
  }
};