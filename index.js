require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { DISCORD_BOT_TOKEN } = require('./config');
const TiDatabase = require('./TiDatabase'); // Assuming this is your custom DB module
const path = require('path');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🧩 Connect to TiDatabase
TiDatabase.connect()
  .then(() => {
    console.log("✅ Connected to TiDatabase");
  })
  .catch((err) => {
    console.error("❌ Error connecting to TiDatabase:", err);
  });

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', interaction => {
  require('./events/interactionCreate').execute(interaction, client);
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

client.login(DISCORD_BOT_TOKEN);