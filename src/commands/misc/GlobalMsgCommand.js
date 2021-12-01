const { Command } = require('@greencoast/discord.js-extended');

class GlobalMsgCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'globalmsg',
      aliases: ['gm'],
      description:
        'Envía un mensaje personalizado a todos los canales en los que la notificación está activada.',
      emoji: ':globe_with_meridians:',
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

    if (!args[0]) {
      return message.channel.send('El uso es: $gm <título> <desc> <imagen> <footer>');
    }

    let [title, description, image, footer] = args.join(' ').split('" "');

    const find = '"';
    const re = new RegExp(find, 'g');

    if (title) {
      title = title.replace(re, '');
    } else {
      title = '';
    }

    if (description) {
      description = description.replace(re, '');
    } else {
      description = '';
    }

    if (image) {
      image = image.replace(re, '');
    } else {
      image = '';
    }

    if (footer) {
      footer = footer.replace(re, '');
    } else {
      footer = '';
    }

    await this.client.notifier.customGlobalMessage(title, description, image, footer);
    return message.react('✅');
  }
}

module.exports = GlobalMsgCommand;
