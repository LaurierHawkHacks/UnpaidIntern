import { REST, Routes } from "discord.js";
import command from "./commands/emails.js";
import "dotenv/config";

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_BOT_USER_ID = process.env.DISCORD_BOT_USER_ID;
const SERVER_ID = process.env.DISCORD_SERVER_ID;

const commands = [];
commands.push(command.data.toJSON());

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
