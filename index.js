const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 🔧 Setup client and collections
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.prefixCommands = new Collection();
client.events = new Collection();

const prefix = process.env.PREFIX || '!';
const commands = [];

// 🌐 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  client.login(process.env.DISCORD_BOT_TOKEN);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// 🔁 Recursively load slash commands
function loadSlashCommands(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadSlashCommands(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          commands.push(command.data.toJSON());
        } else {
          console.warn(`[WARNING] Slash command at ${fullPath} is missing "data" or "execute".`);
        }
      } catch (err) {
        console.error(`[ERROR] Failed to load slash command at ${fullPath}:`, err);
      }
    }
  }
}

loadSlashCommands(path.join(__dirname, 'commands'));

// 🔁 Load prefix commands
function loadPrefixCommands(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadPrefixCommands(fullPath);
    } else if (file.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if ('name' in command && 'execute' in command) {
          client.prefixCommands.set(command.name, command);
        } else {
          console.warn(`[WARNING] Prefix command at ${fullPath} is missing "name" or "execute".`);
        }
      } catch (err) {
        console.error(`[ERROR] Failed to load prefix command at ${fullPath}:`, err);
      }
    }
  }
}

loadPrefixCommands(path.join(__dirname, 'prefixCommands'));

// 🔁 Load events
function loadEvents(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const event = require(fullPath);

    if ('name' in event && 'execute' in event) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.name, (...args) => event.execute(...args, client));
      }
      client.events.set(event.name, event);
    } else {
      console.warn(`[WARNING] Event at ${fullPath} is missing "name" or "execute".`);
    }
  }
}

loadEvents(path.join(__dirname, 'events'));

// 🚀 Clean and deploy slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const guildId = process.env.DISCORD_GUILD_ID; // Optional: only needed for guild commands

    // 🧹 Delete all guild commands (if applicable)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] });
    console.log('🗑️ Successfully deleted all guild commands.');

    // 🧹 Delete all global commands
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log('🗑️ Successfully deleted all global application commands.');

    // 🚀 Deploy active slash commands globally
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ Successfully deployed ${commands.length} active slash commands.`);
  } catch (error) {
    console.error('❌ Error during command cleanup or deployment:', error);
  }
})();

// 🤖 Bot ready
client.once('ready', () => {
  console.log(`✅ Bot is online as ${client.user.tag}`);
});

// 📨 Handle prefix commands
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(`❌ Prefix command error "${commandName}":`, error);
    await message.reply('There was an error executing that command.');
  }
});