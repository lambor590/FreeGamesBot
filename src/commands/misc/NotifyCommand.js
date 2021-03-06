const { Command } = require('@greencoast/discord.js-extended');

class NotifyCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'notify',
      description:
        'Comando para ejecutar de forma manual la notificación de juegos.',
      emoji: ':crown:',
      group: 'misc',
      guildOnly: false,
    });
  }

  async run(message, args) {
    if (message.author.id != this.client.owner) {
      return message.channel.send(
        'No tienes permiso para ejecutar este comando.',
      );
    }

    if (args[0] == '-bc') {
      await this.client.notifier.notifyBypassCache();
    } else {
      await this.client.notifier.notify();
    }

    return this.client.owner.send('Notificación de juegos ejecutada.');
  }
}

module.exports = NotifyCommand;
