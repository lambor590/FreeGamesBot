const { Command } = require("@greencoast/discord.js-extended");
const discord = require("discord.js");

class InviteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "invite",
      description: "¡Añade a este bot a tu servidor!",
      emoji: ":heart:",
      group: "misc",
      guildOnly: false,
    });
  }

  async run(message, args) {
    const usuario =
      message.author.username + "#" + message.author.discriminator;

    const embedComandoInvitado = new discord.MessageEmbed()
      .setDescription(`${usuario} ha ejecutado el comando de invitar`)
      .setColor("#00ff00");

    this.client.owner.send(embedComandoInvitado);

    const embedReporteEnviado = new discord.MessageEmbed()
      .setTitle(`¿Quieres añadirme en tu servidor?`)
      .setDescription(
        `Me puedes añadir haciendo click [aquí](https://discord.com/api/oauth2/authorize?client_id=656601440827211805&permissions=355392&scope=bot)`
      )
      .setColor("#00ff00")
      .setFooter(`Comando usado por ${usuario}`);

    message.channel.send(embedReporteEnviado);
  }
}

module.exports = InviteCommand;
