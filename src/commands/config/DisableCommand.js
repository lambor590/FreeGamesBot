const { Command } = require("@greencoast/discord.js-extended");
const logger = require("@greencoast/logger");
const { GUILD_KEYS } = require("../../common/constants");

class DisableCommand extends Command {
  constructor(client) {
    super(client, {
      name: "disable",
      description: "Desactivar los anuncios de juegos gratis en este servidor.",
      emoji: ":no_entry_sign:",
      group: "config",
      guildOnly: true,
      ownerOverride: false,
      userPermissions: ["MANAGE_CHANNELS"],
    });
  }

  async run(message) {
    const currentChannel = await this.client.dataProvider.get(
      message.guild,
      GUILD_KEYS.channel,
      null
    );

    if (!currentChannel) {
      return message.reply("no hay ningún canal de anuncios establecido.");
    }

    await this.client.dataProvider.set(message.guild, GUILD_KEYS.channel, null);

    logger.info(`Los anuncios se han desactivado en ${message.guild.name}.`);
    return message.channel.send(
      "Se han desactivado los anuncios en este servidor."
    );
  }
}

module.exports = DisableCommand;
