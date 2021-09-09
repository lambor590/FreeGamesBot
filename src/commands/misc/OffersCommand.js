const { Command } = require('@greencoast/discord.js-extended');
const ProviderFactory = require('../../classes/providers/ProviderFactory');

class OffersCommand extends Command {
  constructor(client) {
    super(client, {
      name: 'offers',
      description: 'Obtén las ofertas actuales de Epic Games o Steam.',
      emoji: ':moneybag:',
      group: 'misc',
      guildOnly: false
    });
  }

  prepareMessageForOffer(header, offers) {
    return offers.reduce((message, offer, i) => {
      return `${message}${i + 1}. ${offer.game} - link: ${offer.url}\n`;
    }, `${header}\n\n`);
  }

  async handleAllProviders(message) {
    const providers = ProviderFactory.getAll();

    for (const provider of providers) {
      const offers = await provider.getOffers();

      if (!offers) {
        message.channel.send(`Algo sucedió al buscar ofertas en ${provider.name}. Inténtalo de nuevo más tarde.`);
        continue;
      }

      if (offers.length < 1) {
        continue;
      }

      message.channel.send(this.prepareMessageForOffer(`Estas són las ofertas disponibles que hay actualmente en ${provider.name}:`, offers));
    }
  }

  async handleSingleProvider(message, providerName) {
    try {
      const provider = ProviderFactory.getInstance(providerName);
      const offers = await provider.getOffers();

      if (!offers) {
        return message.channel.send(`Algo sucedió al buscar ofertas en ${provider.name}. Inténtalo de nuevo más tarde.`);
      }

      if (offers.length < 1) {
        return message.channel.send(`No hay juegos gratis actualmente en ${provider.name}. 😢`);
      }

      return message.channel.send(this.prepareMessageForOffer(`Estas són las ofertas disponibles que hay actualmente en ${provider.name}:`, offers));
    } catch (error) {
      if (error instanceof TypeError) {
        const availableProviders = Object.values(ProviderFactory.providerNames).join(', ');
        return message.channel.send(`No conozco ninguna tienda de juegos que se llame ${providerName}, si existe, puede que en un futuro sea compatible con el bot.\nVuelve a intentarlo con una tienda de las siguientes: **${availableProviders}**`);
      }

      throw error;
    }
  }

  run(message, [providerName]) {
    if (!providerName) {
      return this.handleAllProviders(message);
    }

    return this.handleSingleProvider(message, providerName);
  }
}

module.exports = OffersCommand;
