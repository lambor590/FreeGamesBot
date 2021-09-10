const path = require("path");
const {
  ExtendedClient,
  ConfigProvider,
} = require("@greencoast/discord.js-extended");
const LevelDataProvider =
  require("@greencoast/discord.js-extended/dist/providers/LevelDataProvider").default;
const OffersNotifier = require("./classes/OffersNotifier");
const { DEBUG_ENABLED } = require("./common/context");
const discord = require("discord.js");

const config = new ConfigProvider({
  configPath: path.join(__dirname, "../config/settings.json"),
  env: process.env,
  default: {
    PREFIX: "$",
    OWNER_ID: null,
    OWNER_REPORTING: false,
    PRESENCE_REFRESH_INTERVAL: 15 * 60 * 1000, // 15 Minutes
  },
  types: {
    TOKEN: "string",
    PREFIX: "string",
    OWNER_ID: ["string", "null"],
    OWNER_REPORTING: "boolean",
    PRESENCE_REFRESH_INTERVAL: ["number", "null"],
  },
});

const prefix = config.get("PREFIX");

const client = new ExtendedClient({
  config,
  debug: DEBUG_ENABLED,
  errorOwnerReporting: config.get("OWNER_REPORTING"),
  owner: config.get("OWNER_ID"),
  prefix: config.get("PREFIX"),
  presence: {
    refreshInterval: config.get("PRESENCE_REFRESH_INTERVAL"),
    templates: [
      `Juegos Gratis 👀`,
      `${prefix}help para comandos.`,
      `Epic Games Store`,
      `Steam`,
    ],
  },
});

const provider = new LevelDataProvider(client, path.join(__dirname, "../data"));

client.registerDefaultEvents().registerExtraDefaultEvents();

client.registry
  .registerGroups([
    ["misc", "Misceláneos"],
    ["config", "Comandos de configuración"],
  ])
  .registerCommandsIn(path.join(__dirname, "./commands"));

client.on("ready", async () => {
  await client.setDataProvider(provider);

  client.notifier = new OffersNotifier(client);
  client.notifier.initialize();
});

client.on("guildDelete", (guild) => {
  client.dataProvider.clear(guild);
});

client.login(config.get("TOKEN"));
