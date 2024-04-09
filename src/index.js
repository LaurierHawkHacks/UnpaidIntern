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
