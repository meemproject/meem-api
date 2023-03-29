import { REST } from '@discordjs/rest'
import log, { LogLevel } from '@kengoldfarb/log'
import { SlashCommandBuilder, Routes } from 'discord.js'
import Configuration from '../core/Configuration'

async function run() {
	const g = global as any
	g.configuration = new Configuration()
	g.config = await configuration.load()
	log.setOptions({
		useColors: true,
		level: LogLevel.Debug
	})

	g.log = log

	const commands = [
		new SlashCommandBuilder()
			.setName('activate')
			.addStringOption(option =>
				option
					.setName('code')
					.setDescription('The activation code')
					.setRequired(true)
			)
			.setDescription('Activates the Symphony (by Meem) bot for your server'),
		new SlashCommandBuilder()
			.setName('rules')
			.setDescription('Get the Symphony rules for your server.')
	].map(command => command.toJSON())

	const rest = new REST({ version: '10' }).setToken(config.DISCORD_APP_TOKEN)

	await rest.put(
		Routes.applicationCommands(
			config.DISCORD_APP_ID
			// config.DISCORD_DEV_SERVER
		),
		{ body: commands }
	)

	const newCommands = await rest.get(
		Routes.applicationCommands(config.DISCORD_APP_ID)
	)
	log.info(newCommands)
}

run()
	.then(() => log.info('Done!'))
	.catch(e => log.crit(e))
