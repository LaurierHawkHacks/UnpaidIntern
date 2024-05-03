import { Client, Events, AttachmentBuilder, EmbedBuilder, GatewayIntentBits } from "discord.js";
// import { initializeApp as initFirebase } from "firebase/app";
import { initializeApp as initFirebaseAdmin, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "node:fs";
import "dotenv/config";

const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SERVER_ID = process.env.DISCORD_SERVER_ID;
const PUBLIC_SERVER_ID = process.env.DISCORD_PUBLIC_SERVER_ID;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const VP_CHANNEL_ID = process.env.DISCORD_VP_CHANNEL_ID;
const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutes * 60 seconds * 1000 milliseconds
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

    client.on(Events.InteractionCreate, async (interaction) => {
	    if (!interaction.isChatInputCommand()) return;
        await interaction.reply("🔄 shut up");
        return;

        const count = await createFileForDiscord();
        const channel = interaction.channel;
        const file = new AttachmentBuilder().setFile("./emails.txt");
        await channel.send(`Here are ${count} emails of people who haven't applied`, { files: [file] });
    });

    client.login(DISCORD_TOKEN);
};

const init = () => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    const firebaseAdmin = initFirebaseAdmin({ credential: cert(FIREBASE_CONFIG) });
    const firestore = getFirestore(firebaseAdmin);
    const auth = getAuth(firebaseAdmin);

    return [client, firebaseAdmin, firestore, auth];
}

const updateMessage = async () => {
    const channel = client.guilds.cache.get(SERVER_ID).channels.cache.get(CHANNEL_ID);
    const [message, apps, users] = await createMessage();
    if (channel.messages.cache.size === 0)
        channel.send({ embeds: [message] });

    else
        channel.messages.cache.first().edit({ embeds: [message] });

    console.log(`🔄 Updated message at ${new Date().toLocaleString()}`);
    setTimeout(updateMessage, UPDATE_INTERVAL);
}

const createMessage = async () => {
    const discordMemberCount = await getDiscordMemberCount();
    const userCount = await getRegisteredUserCount();
    const snapshot = await getApplicationSnapshot();

    const applicationCount = getApplicationCount(snapshot);
    const appsTypeCount = getApplicationTypeCount(snapshot);
    const appsTopCountries = getTopCountriesFromApplications(snapshot);
    const appsTopCities = getTopCitiesFromApplications(snapshot);
    const appsTopSchools = getTopSchoolsFromApplications(snapshot);
    const appsTopMajors = getTopMajorsFromApplications(snapshot);
    const appsLevelsOfStudy = getLevelsOfStudyFromApplications(snapshot);

    return [
        new EmbedBuilder()
            .setTitle("📊 **Statistics**")
            .setDescription(`Updates automatically once every ${UPDATE_INTERVAL / 1000} seconds.`)
            .addFields(
                { name: "👥 Website Data", value: `
                Discord Members: ${discordMemberCount}
                Registered Users: ${userCount}
                Applications: ${applicationCount}
                `, inline: false },

                { name: " ", value: " ", inline: false },

                { name: "☀️ Application Data", value:
                appsTypeCount.map(([type, count]) => `${type}: ${count}`).join("\n"),
                inline: false },

                { name: " ", value: " ", inline: false },

                { name: "🌎 Top Countries", value:
                appsTopCountries.map(([country, count]) => `${country}: ${count}`).join("\n"),
                inline: false },

                { name: " ", value: " ", inline: false },

                { name: "🏙️ Top Cities", value:
                appsTopCities.map(([city, count]) => `${city}: ${count}`).join("\n"),
                inline: false },

                { name: " ", value: " ", inline: false },

                { name: "📈 Top Schools", value:
                appsTopSchools.map(([school, count]) => `${school}: ${count}`).join("\n"),
                inline: false },

                { name: " ", value: " ", inline: false },

                { name: "📚 Top Majors", value:
                appsTopMajors.map(([major, count]) => `${major}: ${count}`).join("\n"),
                inline: false },

                { name: " ", value: " ", inline: false },

                { name: "🎓 Levels of Study", value:
                appsLevelsOfStudy.map(([level, count]) => `${level}: ${count}`).join("\n"),
                inline: false }
                )
            .setFooter({ text: `Last Updated: ${new Date().toLocaleString()} ${lastUpdateAutomatic ? "(auto)" : "(manual)"}` }),
        applicationCount,
        userCount
    ];
};

const getDiscordMemberCount = async () => {
    const guild = await client.guilds.fetch(PUBLIC_SERVER_ID);
    return guild.memberCount;
}

const getRegisteredUserCount = async (nextPageToken) => {
    const users = await auth.listUsers(1000, nextPageToken);
    return users.users.length + (users.pageToken ? await getRegisteredUserCount(users.pageToken) : 0);
}

const getApplicationSnapshot = async () => {
    const collectionRef = firestore.collection("applications");
    const snapshot = await collectionRef.get();
    return snapshot;
}

const getApplicationCount = (snapshot) => {
    return snapshot.size;
};

const getSpecificDataFromApplications = (snapshot, key) => {
    const result = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const entry = data[key];
        if (entry in result)
            result[entry] += 1;
        else
            result[entry] = 1;
    });

    const sorted = Object.entries(result).sort((a, b) => b[1] - a[1]);
    return sorted;
}

const getApplicationTypeCount = (snapshot) => {
    return getSpecificDataFromApplications(snapshot, "participatingAs");
}

const getTopCountriesFromApplications = (snapshot) => {
    const countries = getSpecificDataFromApplications(snapshot, "countryOfResidence");
    return countries.slice(0, 5);
}

const getTopCitiesFromApplications = (snapshot) => {
    const cities = getSpecificDataFromApplications(snapshot, "city");
    return cities.slice(0, 5);
}

const getTopSchoolsFromApplications = (snapshot) => {
    const schools = getSpecificDataFromApplications(snapshot, "school");
    return schools.slice(0, 5);
}

const getTopMajorsFromApplications = (snapshot) => {
    const majors = getSpecificDataFromApplications(snapshot, "major");
    return majors.slice(0, 5);
}

const getLevelsOfStudyFromApplications = (snapshot) => {
    return getSpecificDataFromApplications(snapshot, "levelOfStudy");
}

const getRegisteredUsers = async (nextPageToken) => {
    const users = await auth.listUsers(1000, nextPageToken);
    return users.users.concat((users.pageToken ? await getRegisteredUsers(users.pageToken) : 0));
}

const getAppliedUsers = async (snapshot) => {
    const users = [];
    snapshot.forEach(doc => users.push(doc.data()) );
    return users;
}

const getEmailDiff = (registeredData, appliedData) => {
    const filtered = registeredData.filter(user => !appliedData.some(applicant => applicant.applicantId === user.uid));
    return filtered.map(user => user.email);
}

const createFileForDiscord = async () => {
    const registeredUsers = await getRegisteredUsers();
    const snapshot = await getApplicationSnapshot();
    const appliedUsers = await getAppliedUsers(snapshot);

    const emails = getEmailDiff(registeredUsers, appliedUsers);
    const data = emails.join("\n");
    fs.writeFileSync("./emails.txt", data);
    return emails.length;
}


const [client, firebase, firestore, auth] = init();
main();
