const { Command } = require('@greencoast/discord.js-extended');
const logger = require('@greencoast/logger');
const { GUILD_KEYS } = require('../../common/constants');

class SetChannelCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'setchannel',
      aliases: ['channel'],
      description:
        'Configura el canal en el que el bot anunciará las ofertas de juegos gratis.',
      emoji: ':loudspeaker:',
      group: 'config',
      guildOnly: true,
      ownerOverride: false,
      userPermissions: ['MANAGE_CHANNELS'],
    });
  }

  async updateChannel(message, channel) {
    const previousChannelID = await this.client.dataProvider.get(
      message.guild,
      GUILD_KEYS.channel,
    );

    if (previousChannelID === channel.id) {
      return message.reply(
        'el canal que mencionaste ya está configurado como canal de anuncios.',
      );
    }

    try {
      await this.client.dataProvider.set(
        message.guild,
        GUILD_KEYS.channel,
        channel.id,
      );

      logger.info(
        `Announcement channel changed for ${message.guild.name} to #${channel.name}.`,
      );
      return message.channel.send(
        `Canal de anuncios establecido en ${channel}.`,
      );
    } catch (error) {
      logger.error(error);
      return message.channel.send(
        'Algo sucedió al intentar actualizar el canal de anuncios.',
      );
    }
  }

  run(message) {
    const channel = message.mentions.channels.first();

    if (!channel) {
      return message.reply('debes mencionar el canal que quieres establecer.');
    }

    if (!channel.viewable) {
      return message.reply(
        'No puedo ver el canal que mencionaste, ¿tengo suficientes permisos para acceder a él?',
      );
    }

    return this.updateChannel(message, channel);
  }
}

module.exports = SetChannelCommand;
