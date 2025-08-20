const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Promotion = require('../../schema/promotionSchema.js');
const getNextPromotionCaseNumber = require('../../utils/getNextPromotionCaseNumber.js');

const STAFF_ROLE_ID = '1405229736195784804'; // Replace with your actual staff role ID
const PROMOTIONS_PER_PAGE = 5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promotion-list')
    .setDescription('View a user’s promotion history.')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('User to view promotions for')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this command.',
        ephemeral: true
      });
    }

    const target = interaction.options.getUser('target');
    const promotions = await Promotion.find({
      guildId: interaction.guild.id,
      userId: target.id
    }).sort({ timestamp: -1 });

    if (!promotions.length) {
      return interaction.reply({
        content: `❌ <@${target.id}> has no promotions on record.`
      });
    }

    let page = 0;

    const generateEmbed = (page) => {
      const start = page * PROMOTIONS_PER_PAGE;
      const end = start + PROMOTIONS_PER_PAGE;
      const current = promotions.slice(start, end);

      const embed = new EmbedBuilder()
        .setColor(0x00BFFF)
        .setTitle(`📈 Promotion History for ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .setFooter({
          text: `Page ${page + 1} of ${Math.ceil(promotions.length / PROMOTIONS_PER_PAGE)} • Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      for (const promo of current) {
        const link = promo.messageLink || '[No link available]';

        embed.addFields({
          name: `🎖️ Case #${promo.caseNumber}`,
          value: [
            `**Date:** <t:${Math.floor(promo.timestamp.getTime() / 1000)}:F>`,
            `**Promoted By:** <@${promo.moderatorId}>`,
            `**From:** <@&${promo.oldRole}>`,
            `**To:** <@&${promo.newRole}>`,
            `**Reason:** ${promo.reason}`,
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
          .setDisabled((page + 1) * PROMOTIONS_PER_PAGE >= promotions.length)
      );
    };

    const message = await interaction.reply({
      embeds: [generateEmbed(page)],
      components: [getRow(page)],
      fetchReply: true
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