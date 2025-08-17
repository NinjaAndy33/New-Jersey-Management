// commands/kick.js
const { EmbedBuilder, PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const requiredRoleId = '1405237617515298978';
const logChannelId = '1405942493081767988';


module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(true)
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        // Permission check
        if (!interaction.member.roles.cache.has(requiredRoleId) &&
            !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return interaction.reply('🚫 You do not have permission to use this command.');
        }

        const member = await interaction.guild.members.fetch(target.id);
        if (!member) {
            return interaction.reply('❌ User not found.');
        }

        if (!member.kickable) {
            return interaction.reply('❌ I cannot kick this member.');
        }

        try {
            // DM the user
            await target.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🚫 You have been kicked')
                        .setDescription(`You were kicked from **${interaction.guild.name}**.`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: `<@${interaction.user.id}> (${interaction.user.tag})` }
                        )
                        .setColor(0xff9900)
                        .setTimestamp()
                ]
            }).catch(() => {
                console.warn(`Could not DM ${target.tag}`);
            });

            // Kick the user
            await member.kick(reason);

            // Confirmation
            await interaction.reply(`✅ ${target.tag} has been kicked.`);

            // Log to mod channel
            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const kickembed = new EmbedBuilder()
                    .setTitle('👢 Member Kicked')
                    .addFields(
                        { name: 'User', value: `<@${target.id}> (${target.tag})`, inline: true },
                        { name: 'Moderator', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
                        { name: 'Reason', value: reason }
                    )
                    .setColor(0xff9900)
                    .setTimestamp();

                await logChannel.send({ embeds: [kickembed] });
            }
        } catch (error) {
            console.error('Kick Error:', error);
            await interaction.reply('❌ Something went wrong while trying to kick.');
        }
    }
};
