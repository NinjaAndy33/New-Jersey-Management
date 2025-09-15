const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Infraction = require('../../schema/infractionSchema.js');

const STAFF_ROLE_ID = '1405229736195784804';
const INFRACTIONS_PER_PAGE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('infraction-list')
    .setDescription('View a user’s infraction history.')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to view infractions for')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 Permission check
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const target = interaction.options.getUser('target');
    const infractions = await Infraction.find({
      guildId: interaction.guild.id,
      userId: target.id
    }).sort({ timestamp: -1 });

    if (!infractions.length) {
      return interaction.reply({
        content: `❌ <@${target.id}> has no infractions on record.`,
        ephemeral: true
      });
    }

    let page = 0;

    const generateEmbed = (page) => {
      const start = page * INFRACTIONS_PER_PAGE;
      const end = start + INFRACTIONS_PER_PAGE;
      const current = infractions.slice(start, end);

      const embed = new EmbedBuilder()
        .setColor(0xFF5555)
        .setTitle(`Infractions for ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .setFooter({
          text: `Page ${page + 1} of ${Math.ceil(infractions.length / INFRACTIONS_PER_PAGE)} • Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      for (const infraction of current) {
        const expired = infraction.expiresAt
          ? (infraction.expiresAt < new Date() ? '✅' : '❌')
          : '❌';

        const link = infraction.messageLink
          ? `[View Infraction](${infraction.messageLink})`
          : '[No link available]';

        embed.addFields({
          name: `Case #${infraction.caseNumber}`,
          value: [
            `**Date:** <t:${Math.floor(infraction.timestamp.getTime() / 1000)}:F>`,
            `**Issuer:** <@${infraction.moderatorId}>`,
            `**Type:** ${infraction.type}`,
            `**Reason:** ${infraction.reason}`,
            `**Expired:** ${expired}`,
            `**Link:** ${link}`
          ].join('\n'),
          inline: false
        });
      }

      return embed;
    };

    const getRow = (page) => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev')
          .setLabel('◀ Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId('next')
          .setLabel('Next ▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((page + 1) * INFRACTIONS_PER_PAGE >= infractions.length)
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [getRow(page)],
      fetchReply: true,
      ephemeral: true
    });

    const collector = message.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 60_000
    });

    collector.on('collect', async i => {
      if (i.customId === 'prev') page--;
      if (i.customId === 'next') page++;

      await i.update({
        embeds: [generateEmbed(page)],
        components: [getRow(page)]
      });
    });

    collector.on('end', async () => {
      await message.edit({ components: [] });
    });
  }
};
