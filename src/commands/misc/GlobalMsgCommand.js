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
      return message.channel.send('El uso es: $gm <título> <desc> <imagen>');
    }

    let [title, description, image, footer] = args.join(' ').split('" "');

    if (title) {
      title = title.replace('"', '');
    } else {
      title = null;
    }

    if (description) {
      description = description.replace('"', '');
    } else {
      description = null;
    }

    if (image) {
      image = image.replace('"', '');
    } else {
      image = null;
    }

    if (footer) {
      footer = footer.replace('"', '');
    } else {
      footer = null;
    }

    await this.client.notifier.customGlobalMessage(title, description, image, footer);
    return message.react('✅');
  }
}

module.exports = GlobalMsgCommand;
