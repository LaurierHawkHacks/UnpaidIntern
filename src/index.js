import { Client, Events, EmbedBuilder, GatewayIntentBits } from "discord.js";
// import { initializeApp as initFirebase } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

import { initializeApp as initFirebaseAdmin, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import "dotenv/config";

const FIREBASE_CONFIG = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const SERVER_ID = process.env.DISCORD_SERVER_ID;
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

    client.login(DISCORD_TOKEN);
};

const init = () => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    const firebaseAdmin = initFirebaseAdmin({ credential: cert(FIREBASE_CONFIG) });
    const firebase = null; //initFirebase(FIREBASE_CONFIG);

    const firestore = getFirestore(firebaseAdmin);
    const auth = getAuth(firebaseAdmin);
    const analytics = null; //getAnalytics(firebase);

    return [client, firebaseAdmin, firestore, analytics, auth];
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
    const websiteViews = NaN;
    const userCount = await getRegisteredUserCount();
    const snapshot = await getApplicationSnapshot();

    const applicationCount = getApplicationCount(snapshot);
    const appsTypeCount = getApplicationTypeCount(snapshot);
    const appsTopCountries = getTopCountriesFromApplications(snapshot);
    const appsTopCities = getTopCitiesFromApplications(snapshot);
    const appsTopSchools = getTopSchoolsFromApplications(snapshot);
    const appsTopMajors = getTopMajorsFromApplications(snapshot);

    return [
        new EmbedBuilder()
            .setTitle("📊 **Statistics**")
            .setDescription(`Updates automatically once every ${UPDATE_INTERVAL / 1000} seconds.`)
            .addFields(
                { name: "👥 Website Data", value: `
                Registered Users: ${userCount}
                Applications: ${applicationCount}
                Website Views: ${websiteViews}
                `, inline: false },

                { name: " ", value: " ", inline: false },

                { name: "☀️ Application Data", value: `
                Hackers: ${appsTypeCount.Hacker}
                Mentors: ${appsTypeCount.Mentor}
                Volunteers: ${appsTypeCount.Volunteer}
                `, inline: false },

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
                inline: false }
                )
            .setFooter({ text: `Last Updated: ${new Date().toLocaleString()} ${lastUpdateAutomatic ? "(auto)" : "(manual)"}` }),
        applicationCount,
        userCount
    ];
};

const getRegisteredUserCount = async () => {
    const users = await auth.listUsers(1000);
    return users.users.length;
}

const getApplicationSnapshot = async () => {
    const collectionRef = firestore.collection("applications");
    const snapshot = await collectionRef.get();
    return snapshot;
}

const getApplicationCount = (snapshot) => {
    return snapshot.size;
};

const getApplicationTypeCount = (snapshot) => {
    const types = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const type = data.participatingAs;
        if (type in types)
            types[type] += 1;
        else
            types[type] = 1;
    });

    return types;
}

const getTopCountriesFromApplications = (snapshot) => {
    const countries = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const country = data.countryOfResidence;
        if (country in countries)
            countries[country] += 1;
        else
            countries[country] = 1;
    });

    const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5);
}

const getTopCitiesFromApplications = (snapshot) => {
    const cities = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const city = data.city;
        if (city in cities)
            cities[city] += 1;
        else
            cities[city] = 1;
    });

    const sorted = Object.entries(cities).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5);
}

const getTopSchoolsFromApplications = (snapshot) => {
    const schools = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const school = data.school;
        if (school in schools)
            schools[school] += 1;
        else
            schools[school] = 1;
    });

    const sorted = Object.entries(schools).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5);
}

const getTopMajorsFromApplications = (snapshot) => {
    const majors = {};
    snapshot.forEach(doc => {
        const data = doc.data();
        const major = data.major;
        if (major in majors)
            majors[major] += 1;
        else
            majors[major] = 1;
    });

    const sorted = Object.entries(majors).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 5);
}

const [client, firebase, firestore, analytics, auth] = init();
main();
