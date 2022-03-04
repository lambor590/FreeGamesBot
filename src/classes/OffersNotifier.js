const logger = require('@greencoast/logger');
const { CronJob } = require('cron');
const discord = require('discord.js');
const { MessageButton } = require('discord-buttons');
const disbut = require('discord-buttons');
const { CRON, GUILD_KEYS } = require('../common/constants');
const { DEV_MODE } = require('../common/context');
const ProviderFactory = require('./providers/ProviderFactory');
const OffersCache = require('./OffersCache');

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
      async function log() {
        logger.info('(CRON): Notificando servidores...');
        return this.onComplete(await self.notify());
      },
      function log2(notified) {
        logger.info(
          notified
            ? '(CRON): Notificación completada.'
            : '(CRON): Notificación omitida, o no hubo ofertas para notificar o las ofertas ya se notificaron.',
        );
        logger.info(
          `(CRON): Próxima ejecución: ${this.nextDate().format(
            CRON.MOMENT_DATE_FORMAT,
          )}`,
        );
      },
      true,
    );

    this.notifyJob.start();
    logger.info('(CRON): Proceso de notificación iniciado.');
    logger.info(
      `(CRON): Próxima ejecución: ${this.notifyJob
        .nextDate()
        .format(CRON.MOMENT_DATE_FORMAT)}`,
    );
  }

  getChannelsForEnabledGuilds() {
    return this.client.guilds.cache.reduce(async (channels, guild) => {
      const channelID = await this.client.dataProvider.get(
        guild,
        GUILD_KEYS.channel,
        null,
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

  async customGlobalMessage(title, description, image, footer) {
    const channels = await this.getChannelsForEnabledGuilds();
    const embed = new discord.MessageEmbed()
      .setColor('#2f3136')
      .setTitle(title)
      .setDescription(description)
      .setImage(image)
      .setFooter(footer)
      .setTimestamp();

    for (const channel of channels) {
      channel.send(embed);
    }

    return true;
  }

  async channelsBulkDelete() {
    const channels = await this.getChannelsForEnabledGuilds();

    const messages = await Promise.all(
      channels.map((channel) => channel.messages.fetch({ limit: 100 })),
    );

    const messagesToDelete = messages.reduce((all, messages) => {
      all.push(...messages.filter((message) => message.author.bot));
      return all;
    }, []);

    const messagesToDeleteIds = messagesToDelete.map((message) => message[0]);

    for (const channel of channels) {
      if (messagesToDeleteIds.length > 0) {
        await channel.bulkDelete(messagesToDeleteIds, { filterOld: true });
      } else {
        await this.client.owner.send('No hay mensajes que eliminar.');
        return false;
      }
    }

    return true;
  }

  //* NOTIFICACIÓN SIN CACHÉ //

  async notifyBypassCache() {
    const providers = ProviderFactory.getAll();
    const channels = await this.getChannelsForEnabledGuilds();
    const currentOffers = this.filterValidOffers(
      await Promise.all(providers.map((provider) => provider.getOffers())),
    );

    let atLeastOneOfferNotified = false;

    for (const offer of currentOffers) {
      const notified = await this.notifySingleOfferBypassCache(offer, channels);

      if (!atLeastOneOfferNotified) {
        atLeastOneOfferNotified = notified;
      }
    }

    await this.cache.update(currentOffers);

    return atLeastOneOfferNotified;
  }

  async notifySingleOfferBypassCache(offer, channels) {
    let embedJuego;
    let slugfinal;

    if (offer.productSlug === null) {
      slugfinal = offer.urlSlug;
    } else {
      slugfinal = offer.productSlug;
    }

    embedJuego = new discord.MessageEmbed()
      .setTitle(`¡${offer.game} está GRATIS!`)
      .setURL(offer.url)
      .setColor('#2f3136')
      .setImage(offer.image)
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/672907465670787083/820258283293638676/epic.png',
      )
      .addField(
        'Abrir Launcher de Epic',
        `<com.epicgames.launcher://store/es-ES/p/${slugfinal}>`,
        true,
      )
      .setDescription(offer.description)
      .setTimestamp();

    if (offer.price !== 'PrecioDesconocido') {
      embedJuego.addField('Precio', `~~${offer.price}~~ → GRATIS`, true);
    }

    const botónLinkJuego = new MessageButton()
      .setLabel(`Comprar ${offer.game}`)
      .setEmoji('850093946310754424')
      .setStyle('url')
      .setURL(offer.url);

    if (offer.provider === 'Steam') {
      embedJuego = new discord.MessageEmbed()
        .setTitle('¡Oferta por tiempo limitado!')
        .setURL(offer.url)
        .setColor('#2f3136')
        .setImage(
          `https://cdn.akamai.steamstatic.com/steam/apps/${offer.id}/header.jpg`,
        )
        .setThumbnail(
          'https://media.discordapp.net/attachments/672907465670787083/820258285566820402/steam.png',
        )
        .addField(
          `${offer.game}`,
          `Puedes comprar el DLC o juego haciendo [click aquí](${offer.url})`,
        )
        .addField('Comprar abriendo Steam', `steam://store/${offer.id}`)
        .setTimestamp();
    }

    channels.forEach((channel) => {
      channel.send(embedJuego, botónLinkJuego).catch((error) => {
        logger.error(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}, tal vez no tengo suficientes permisos para enviar el mensaje?`,
        );
        logger.error(error);
        this.client.owner.send(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}`,
        );
      });
    });

    return true;
  }

  //* NOTIFICACIÓN NORMAL //

  async notify() {
    const providers = ProviderFactory.getAll();
    const channels = await this.getChannelsForEnabledGuilds();
    const currentOffers = this.filterValidOffers(
      await Promise.all(providers.map((provider) => provider.getOffers())),
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

    let embedJuego;
    let slugfinal;

    if (offer.productSlug === null) {
      slugfinal = offer.urlSlug;
    } else {
      slugfinal = offer.productSlug;
    }

    embedJuego = new discord.MessageEmbed()
      .setTitle(`¡${offer.game} está GRATIS!`)
      .setURL(offer.url)
      .setColor('#2f3136')
      .setImage(offer.image)
      .setThumbnail(
        'https://cdn.discordapp.com/attachments/672907465670787083/820258283293638676/epic.png',
      )
      .addField(
        'Abrir Launcher de Epic',
        `<com.epicgames.launcher://store/es-ES/p/${slugfinal}>`,
        true,
      )
      .setDescription(offer.description)
      .setTimestamp();

    if (offer.price !== 'PrecioDesconocido') {
      embedJuego.addField('Precio', `~~${offer.price}~~ → GRATIS`, true);
    }

    const botónLinkJuego = new MessageButton()
      .setLabel(`Comprar ${offer.game}`)
      .setEmoji('850093946310754424')
      .setStyle('url')
      .setURL(offer.url);

    if (offer.provider === 'Steam') {
      embedJuego = new discord.MessageEmbed()
        .setTitle('¡Oferta por tiempo limitado!')
        .setURL(offer.url)
        .setColor('#2f3136')
        .setImage(
          `https://cdn.akamai.steamstatic.com/steam/apps/${offer.id}/header.jpg`,
        )
        .setThumbnail(
          'https://media.discordapp.net/attachments/672907465670787083/820258285566820402/steam.png',
        )
        .addField(
          `${offer.game}`,
          `Puedes comprar el DLC o juego haciendo [click aquí](${offer.url})`,
        )
        .addField('Comprar abriendo Steam', `steam://store/${offer.id}`)
        .setTimestamp();
    }

    channels.forEach((channel) => {
      channel.send(embedJuego, botónLinkJuego).catch((error) => {
        logger.error(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}, tal vez no tengo suficientes permisos para enviar el mensaje?`,
        );
        logger.error(error);
        this.client.owner.send(
          `Algo sucedió al intentar notificar ${channel.name} en ${channel.guild.name}`,
        );
      });
    });

    return true;
  }
}

module.exports = OffersNotifier;
