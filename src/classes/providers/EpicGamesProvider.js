const axios = require('axios');
const logger = require('@greencoast/logger');
const fetch = require('node-fetch');
const AbstractProvider = require('./AbstractProvider');
const Cache = require('../Cache');

class EpicGamesProvider extends AbstractProvider {
  constructor() {
    super();

    this.name = 'Epic Games Store';
    this.cache = new Cache(this.name);
  }

  getData() {
    return axios
      .get(
        'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=es-ES&country=ES&allowCountries=ES',
      )
      .then((res) => res.data)
      .catch((error) => {
        throw error;
      });
  }

  getOffers() {
    if (this.cache.shouldFetchFromCache()) {
      return Promise.resolve(this.cache.get());
    }

    function isUrlValid(url) {
      return fetch(url).then((res) => {
        if (res.status === 200) {
          return true;
        }
        return false;
      });
    }

    return this.getData()
      .then((data) => {
        const games = data.data.Catalog.searchStore.elements;

        const offers = games.reduce((offers, game) => {
          if (
            game.promotions
            && game.promotions.promotionalOffers
            && game.promotions.promotionalOffers.length > 0
            && game.price.totalPrice.discountPrice === 0
          ) {
            let url = `https://epicgames.com/store/p/${game.productSlug}`;

            if (isUrlValid(url) == false) {
              url = `https://epicgames.com/store/p/${game.urlSlug}`;
            }

            if (url.endsWith('/home')) {
              url = url.slice(0, -5);
            }

            const rawEndDate = game.promotions.promotionalOffers[0].promotionalOffers[0].endDate;

            const endDate = rawEndDate.split('T')[0];

            const finalDate = new Date(`${endDate} 17:00:00`);
            const time = finalDate.getTime() / 1000.0;

            let image = game.keyImages[1].url;
            for (const { type, url } of game.keyImages) {
              if (type === 'DieselStoreFrontWide') {
                image = url;
                break;
              }
            }

            let price = game.price.totalPrice.fmtPrice.originalPrice;
            if (price === '0') {
              price = 'Desconocido';
            }

            offers.push(
              AbstractProvider.createOffer(
                this.name,
                game.title,
                url,
                game.id,
                game.description,
                image,
                game.urlSlug,
                price,
                game.productSlug,
                time,
              ),
            );
          }
          return offers;
        }, []);

        this.cache.set(offers);
        return offers;
      })
      .catch((error) => {
        logger.error(`Could not fetch offers from ${this.name}!`);
        logger.error(error);
        return null;
      });
  }
}

module.exports = EpicGamesProvider;
