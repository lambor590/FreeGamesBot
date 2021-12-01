const { Command } = require('@greencoast/discord.js-extended');

class DeleteMsgsCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'deletemsgs',
      aliases: ['dmsg'],
      description:
        'Elimina todos los mensajes enviados por el bot en todos los canales en los que la notificación está activada.',
      emoji: ':globe_with_meridians:',
      group: 'misc',
      guildOnly: false,
    });
  }

  async run(message) {
    if (message.author.id != this.client.owner) {
      return message.channel.send(
        'No tienes permiso para ejecutar este comando.',
      );
    }

    await this.client.notifier.channelsBulkDelete();

    return message.react('✅');
  }
}

module.exports = DeleteMsgsCommand;
