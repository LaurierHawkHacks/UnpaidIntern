import { Client, Events, EmbedBuilder, GatewayIntentBits } from "discord.js";
import { initializeApp as initFirebaseAdmin } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { cert } from "firebase-admin/app";

import { gcpServiceAccountConfig } from "./config.js";
import 'dotenv/config';

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const SERVER_ID = process.env.DISCORD_SERVER_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const VP_CHANNEL_ID = process.env.DISCORD_VP_CHANNEL_ID;
const UPDATE_INTERVAL = 60000;
let lastUpdateAutomatic = true;

const main = async () => {
    client.once(Events.ClientReady, async (readyClient) => {
        console.log("🚀 UnpaidIntern v2 is online!");
        updateMessage();
    } );

    client.on(Events.Error, err => {
        const vpChannel = client.guilds.cache.get(SERVER_ID).channels.cache.get(VP_CHANNEL_ID);
        vpChannel.send(`❌ Client.onError: An error occurred: ${err}`);
        console.log("❌ Client.onError: An error occurred!");
        console.error(err);
        process.exit(1);
    });

    client.login(TOKEN);
};

const init = () => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    const firebase = initFirebaseAdmin({ credential: cert(gcpServiceAccountConfig) });
    const firestore = getFirestore(firebase);
    const auth = getAuth(firebase);

    return [client, firebase, firestore, auth];
}

const updateMessage = async () => {
    const channel = client.guilds.cache.get(SERVER_ID).channels.cache.get(CHANNEL_ID);
    const [message, apps, users] = await createMessage();
    if (channel.messages.cache.size === 0)
        channel.send({ embeds: [message] });

    else
        channel.messages.cache.first().edit({ embeds: [message] });

    console.log(`🔄 Updated message at ${new Date().toLocaleString()}, apps=${apps}, users=${users}`);
    setTimeout(updateMessage, UPDATE_INTERVAL);
}

const createMessage = async () => {
    const applicationCount = await getApplicationCount();
    const userCount = await getRegisteredUserCount();
    return [
        new EmbedBuilder()
            .setTitle("📊 **Statistics**")
            .setDescription(`Updates automatically once every ${UPDATE_INTERVAL / 1000} seconds.`)
            .addFields(
                { name: "👥 Registered Users", value: `${userCount}`, inline: true },
                { name: "📝 Applications", value: `${applicationCount}`, inline: true } )
            .setFooter({ text: `Last Updated: ${new Date().toLocaleString()} ${lastUpdateAutomatic ? "(auto)" : "(manual)"}` }),
        applicationCount,
        userCount
    ];
};

const getApplicationCount = async () => {
    const collectionRef = firestore.collection("applications");
    const snapshot = await collectionRef.get();
    return snapshot.size;
};

const getRegisteredUserCount = async () => {
    const users = await auth.listUsers(1000);
    return users.users.length;
}

const [client, firebase, firestore, auth] = init();
main();
