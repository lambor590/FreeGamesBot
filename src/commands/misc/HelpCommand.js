const { Command } = require("@greencoast/discord.js-extended");
const { MessageEmbed } = require("discord.js");
const { MESSAGE_EMBED } = require("../../common/constants");

class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      aliases: ["h"],
      description:
        "Obtén una descripción de todos los comandos que puedes usar.",
      emoji: ":question:",
      group: "misc",
      guildOnly: false,
    });
  }

  prepareFields() {
    return this.client.registry.groups.map((group) => {
      const listOfCommands = group.commands.reduce((text, command) => {
        return text.concat(
          `${command.emoji} **${this.client.prefix}${command.name}** - ${command.description}\n`
        );
      }, "");

      return { title: group.name, text: listOfCommands };
    });
  }

  run(message) {
    const fields = this.prepareFields();
    const embed = new MessageEmbed()
      .setTitle("Ayuda del notificador de juegos gratis")
      .setColor(MESSAGE_EMBED.color)
      .setThumbnail(MESSAGE_EMBED.thumbnail);

    for (const key in fields) {
      const field = fields[key];
      embed.addField(field.title, field.text);
    }

    embed.addField(
      "Encontraste un bug?",
      `Repórtalo con el comando \`report\`.`
    );
    embed.setFooter("Bot creado por The Ghost");

    return message.channel.send(embed);
  }
}

module.exports = HelpCommand;
