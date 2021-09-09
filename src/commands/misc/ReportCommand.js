const { Command } = require("@greencoast/discord.js-extended");
const discord = require("discord.js");

class ReportCommand extends Command {
  constructor(client) {
    super(client, {
      name: "report",
      description: "Reporta errores del bot directamente al creador del bot.",
      emoji: ":mega:",
      group: "misc",
      guildOnly: false,
    });
  }

  async run(message, args) {
    if (!args[0]) {
      return message.channel.send("No has escrito argumentos");
    }

    const usuario =
      message.author.username + "#" + message.author.discriminator;

    let muchoTexto = args.join(" ");

    const embedReporte = new discord.MessageEmbed()
      .setTitle(`Reporte de ${usuario}`)
      .setDescription(`\n\n${muchoTexto}`)
      .setColor("#ff0000");

    this.client.owner.send(embedReporte);

    const embedReporteEnviado = new discord.MessageEmbed()
      .setTitle(`Reporte enviado`)
      .setDescription(`\n\n${muchoTexto}`)
      .setColor("#00ff00")
      .setFooter(`Reporte de ${usuario}`);

    message.channel.send(embedReporteEnviado);
  }
}

module.exports = ReportCommand;
