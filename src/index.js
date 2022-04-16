<<<<<<< HEAD
import { Client, Events, GatewayIntentBits } from "discord.js";
import { initializeApp as initFirebase } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { initializeApp as initFirebaseAdmin } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SERVER_ID = process.env.DISCORD_SERVER_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const VP_CHANNEL_ID = process.env.DISCORD_VP_CHANNEL_ID;

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

let client;
let firebase;
let firebaseAdmin;
let firestore;
let auth;

const main = async () => {
    init();
    client.once(Events.ClientReady, async (readyClient) => {
        console.log("🚀 UnpaidIntern v2 is online!");
        // try {
            const channel = readyClient.guilds.cache.get(SERVER_ID).channels.cache.get(CHANNEL_ID);
            const message = await createMessage();
            setInterval(() => {
                if (channel.messages.cache.size === 0) {
                    channel.send("Hello, world!").then(sentMessage => {
                        message = sentMessage;
                    });
                } else {
                    message.edit("Hello, world!");
                }
            }, 60000);

        // } catch (err) {
            // const vpChannel = readyClient.guilds.cache.get(SERVER_ID).channels.cache.get(VP_CHANNEL_ID);
            // vpChannel.send(`❌ Client.onceReady: An error occurred: ${error}`);
        // }
    } );

    // client.on("error", error => {
    //     const vpChannel = client.guilds.cache.get(SERVER_ID).channels.cache.get(VP_CHANNEL_ID);
    //     vpChannel.send(`❌ Client.onError: An error occurred: ${error}`);
    //     console.error(error);
    // });

    client.login(TOKEN);
};

const init = () => {
    client = new Client({ intents: [GatewayIntentBits.Guilds] });
    firebase = initFirebase(firebaseConfig);
    firestore = getFirestore(firebase);
    firebaseAdmin = initFirebaseAdmin();
    auth = getAuth(firebaseAdmin);
}

const createMessage = async () => {
    const applicationCount = await getApplicationCount();
    const userCount = await getRegisteredUserCount();
    const message = `📊 **Statistics**\n\n👥 Registered Users: ${userCount}\n📝 Applications: ${applicationCount}`;
    return message;
};

const getApplicationCount = async () => {
    const docRef = collection(firestore, "applications");
    const snapshot = await getDocs(docRef);
    return snapshot.size
};

const getRegisteredUserCount = async () => {
    const users = await auth.listUsers({ maxResults: 1000 });
    return users.users.length;
}

main();
=======
const fs = require("node:fs");
const logger = require("js-logger");

const { Client, Collection, Intents } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require("dotenv").config();

const TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

function main() {
    logger.useDefaults({
        defaultLevel: logger.DEBUG,
        formatter: (messages, context) =>
            messages.unshift(`[${new Date().toUTCString()}] [${context.level.name}]: `)
    });

    client.once("ready", () => {
        registerCommands();
        handleCommands();
        logger.info("Bot loaded!");
    });

    client.login(TOKEN);
}

/**
 * Load all command files from the "commands" folder, and POST them to the Discord 
 * command endpoint for the specific server.
 * 
 * @private
 * 
 */
function registerCommands() {
    logger.info("Loading commands!");
    client.commands = new Collection();

    const files = fs.readdirSync("./src/commands")
        .filter(file => file.endsWith(".js") && file != "example.command.js");

    for (const file of files) {
        const command = require(`./commands/${file}`);
        if (!command.enabled)
            continue;

        client.commands.set(command.data.name, command);
        logger.info(`Loaded command from file: commands/${file}`);
    }

    const rest = new REST({ version: "9" }).setToken(TOKEN);
    (async () => {
        try {
            logger.info("Started refreshing application (/) commands.");
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: client.commands.map(command => command.data.toJSON()) },
            );

            logger.info("Successfully reloaded application (/) commands.");
        } catch (error) {
            logger.error(error);
        }
    })();
}

function handleCommands() {
    client.on("interactionCreate", async interaction => {
        if (!interaction.isCommand())
            return;
        
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        
        try {
            await command.execute(interaction);
        
        } catch (error) {
            logger.error(error);
            await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    });

}

main();
>>>>>>> ccfcd72 (Add boilerplate for Discord commands, firebase, and gsheets)
