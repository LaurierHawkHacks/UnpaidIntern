import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_BOT_USER_ID = process.env.DISCORD_BOT_USER_ID;
const SERVER_ID = process.env.DISCORD_SERVER_ID;

const emailCommand = {
	data: new SlashCommandBuilder()
		.setName("emails")
		.setDescription("Get a list of all emails that have registered but not applied."),
	async execute(interaction, discord, firebase, firestore, auth) {
		await interaction.reply('Pong!');
	},
}

const commands = [];
commands.push(emailCommand.data.toJSON());

const rest = new REST().setToken(DISCORD_TOKEN);
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationGuildCommands(DISCORD_BOT_USER_ID, SERVER_ID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);

    } catch (error) {
		console.error(error);
	}

})();

