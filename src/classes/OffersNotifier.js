const logger = require("@greencoast/logger");
const { CronJob } = require("cron");
const { CRON, GUILD_KEYS } = require("../common/constants");
const { DEV_MODE } = require("../common/context");
const ProviderFactory = require("./providers/ProviderFactory");
const OffersCache = require("./OffersCache");
const discord = require("discord.js");
const { MessageButton } = require("discord-buttons");
const disbut = require("discord-buttons");
const client = new discord.Client();
disbut(client);

class OffersNotifier {
  constructor(client) {
    this.client = client;
    this.notifyJob = null;
    this.cache = new OffersCache(client.dataProvider);
  }

  initialize() {
    const self = this;

    this.notifyJob = new CronJob(
      DEV_MODE ? CRON.EVERY_MINUTE : CRON.EVERY_30_MINS,
      async function () {
        logger.info("(CRON): Notificando servidores...");
        return this.onComplete(await self.notify());
      },
      function (notified) {
        logger.info(
          notified
            ? "(CRON): Notificación completada."
            : "(CRON): Notificación omitida, o no hubo ofertas para notificar o las ofertas ya se notificaron."
        );
        logger.info(
          `(CRON): Próxima ejecución: ${this.nextDate().format(
            CRON.MOMENT_DATE_FORMAT
          )}`
        );
      },
      true
    );

    this.notifyJob.start();
    logger.info("(CRON): Notification job initialized.");
    logger.info(
      `(CRON): Próxima ejecución: ${this.notifyJob
        .nextDate()
        .format(CRON.MOMENT_DATE_FORMAT)}`
    );
  }

  getChannelsForEnabledGuilds() {
    return this.client.guilds.cache.reduce(async (channels, guild) => {
      const channelID = await this.client.dataProvider.get(
        guild,
        GUILD_KEYS.channel,
        null
      );

      if (channelID) {
        const channel = guild.channels.cache.get(channelID);

        if (channel) {
          return [...(await channels), channel];
        }
      }

      return channels;
    }, []);
  }

  filterValidOffers(allOffersByProvider) {
    return allOffersByProvider.reduce((all, offers) => {
      if (offers) {
        all.push(...offers);
      }

      return all;
    }, []);
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                   NOTIFICACIÓN SIN CACHÉ                                                  //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async notifyBypassCache() {
    const providers = ProviderFactory.getAll();
    const channels = await this.getChannelsForEnabledGuilds();
    const currentOffers = this.filterValidOffers(
      await Promise.all(providers.map((provider) => provider.getOffers()))
    );

    let atLeastOneOfferNotified = false;

    for (const offer of currentOffers) {
      const notified = await this.notifySingleOfferBypassCache(offer, channels);

      if (!atLeastOneOfferNotified) {
        atLeastOneOfferNotified = notified;
      }
    }

    this.cache.update(currentOffers);

    return atLeastOneOfferNotified;
  }

  async notifySingleOfferBypassCache(offer, channels) {
    var embedJuego = new discord.MessageEmbed()
      .setTitle(`¡${offer.game} está GRATIS!`)
      .setURL(offer.url)
      .setColor("#2f3136")
      .setImage(offer.image)
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/672907465670787083/820258283293638676/epic.png"
      )
      .setFooter(
        "The Ghost",
        "https://cdn.discordapp.com/avatars/381557925627559937/e34a77806ce9344a2869c676edaeac3e.webp"
      )
      .addField(
        `Abrir Launcher de Epic`,
        `<com.epicgames.launcher://store/es-ES/p/${offer.urlSlug}>`,
        true
      )
      .addField(
        `Precio`,
        `~~${offer.price}~~ → GRATIS`, 
        true
      )
      .setDescription(offer.description)
      .setTimestamp();

    const botónLinkJuego = new MessageButton()
      .setLabel(`Comprar ${offer.game}`)
      .setEmoji("850093946310754424")
      .setStyle("url")
      .setURL(offer.url);

    if (offer.provider === "Steam") {
      var embedJuego = new discord.MessageEmbed()
        .setTitle(`¡Oferta por tiempo limitado!`)
        .setURL(offer.url)
        .setColor("#2f3136")
        .setImage(
          `https://cdn.akamai.steamstatic.com/steam/apps/${offer.id}/header.jpg`
        )
        .setThumbnail(
          "https://media.discordapp.net/attachments/672907465670787083/820258285566820402/steam.png"
        )
        .setFooter(
          "The Ghost",
          "https://cdn.discordapp.com/avatars/381557925627559937/e34a77806ce9344a2869c676edaeac3e.webp"
        )
        .addField(
          `${offer.game}`,
          `Puedes comprar el DLC o juego haciendo [click aquí](${offer.url})`
        )
        .addField(`Comprar abriendo Steam`, `steam://store/${offer.id}`)
        .setTimestamp();
    }

    channels.forEach((channel) => {
      channel.send(embedJuego, botónLinkJuego).catch((error) => {
        logger.error(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}, tal vez no tengo suficientes permisos para enviar el mensaje?`
        );
        logger.error(error);
        this.client.owner.send(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}`
        );
      });
    });

    return true;
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                                   NOTIFICACIÓN NORMAL                                                     //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async notify() {
    const providers = ProviderFactory.getAll();
    const channels = await this.getChannelsForEnabledGuilds();
    const currentOffers = this.filterValidOffers(
      await Promise.all(providers.map((provider) => provider.getOffers()))
    );

    let atLeastOneOfferNotified = false;

    for (const offer of currentOffers) {
      const notified = await this.notifySingleOffer(offer, channels);

      if (!atLeastOneOfferNotified) {
        atLeastOneOfferNotified = notified;
      }
    }

    await this.cache.update(currentOffers);

    return atLeastOneOfferNotified;
  }

  async notifySingleOffer(offer, channels) {
    const alreadyNotified = await this.cache.isOfferCached(offer);

    if (alreadyNotified) {
      return false;
    }

    var embedJuego = new discord.MessageEmbed()
      .setTitle(`¡${offer.game} está GRATIS!`)
      .setURL(offer.url)
      .setColor("#2f3136")
      .setImage(offer.image)
      .setThumbnail(
        "https://cdn.discordapp.com/attachments/672907465670787083/820258283293638676/epic.png"
      )
      .setFooter(
        "The Ghost",
        "https://cdn.discordapp.com/avatars/381557925627559937/e34a77806ce9344a2869c676edaeac3e.webp"
      )
      .addField(
        `Abrir Launcher de Epic`,
        `<com.epicgames.launcher://store/es-ES/p/${offer.urlSlug}>`,
        true
      )
      .addField(
        `Precio`,
        `~~${offer.price}~~ → GRATIS`, 
        true
      )
      .setDescription(offer.description)
      .setTimestamp();

    const botónLinkJuego = new MessageButton()
      .setLabel(`Comprar ${offer.game}`)
      .setEmoji("850093946310754424")
      .setStyle("url")
      .setURL(offer.url);

    if (offer.provider === "Steam") {
      var embedJuego = new discord.MessageEmbed()
        .setTitle(`¡Oferta por tiempo limitado!`)
        .setURL(offer.url)
        .setColor("#2f3136")
        .setImage(
          `https://cdn.akamai.steamstatic.com/steam/apps/${offer.id}/header.jpg`
        )
        .setThumbnail(
          "https://media.discordapp.net/attachments/672907465670787083/820258285566820402/steam.png"
        )
        .setFooter(
          "The Ghost",
          "https://cdn.discordapp.com/avatars/381557925627559937/e34a77806ce9344a2869c676edaeac3e.webp"
        )
        .addField(
          `${offer.game}`,
          `Puedes comprar el DLC o juego haciendo [click aquí](${offer.url})`
        )
        .addField(`Comprar abriendo Steam`, `steam://store/${offer.id}`)
        .setTimestamp();
    }

    channels.forEach((channel) => {
      channel.send(embedJuego, botónLinkJuego).catch((error) => {
        logger.error(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}, tal vez no tengo suficientes permisos para enviar el mensaje?`
        );
        logger.error(error);
        this.client.owner.send(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}`
        );
      });
    });

    return true;
  }
}

module.exports = OffersNotifier;
