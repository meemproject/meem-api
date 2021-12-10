import { Server } from 'http'
import path from 'path'
import log, { LogLevel } from '@kengoldfarb/log'
import express, { Express } from 'express'
import globby from 'globby'
import ContractListener from '../listeners/ContractListener'
import TwitterListener from '../listeners/TwitterListener'
import Configuration from './Configuration'
import errorMiddleware from './errorMiddleware'
import Orm from './Orm'

process.on('uncaughtException', err => {
	// eslint-disable-next-line no-console
	console.log('*** UNCAUGHT EXCEPTION ***')
	// eslint-disable-next-line no-console
	console.log(err)
})

function listen(app: Express): Promise<Server> {
	return new Promise(resolve => {
		const server = app.listen(config.PORT, async () => {
			resolve(server)
		})
	})
}

async function loadMiddleware(options: { globPattern: string; app: Express }) {
	const { globPattern, app } = options
	log.trace(`Loading middleware paths with glob: ${globPattern}`)
	const paths = await globby(globPattern)
	const promises = paths.map(async p => {
		log.trace(`Loading middleware: ${p}`)
		try {
			const mw = (await import(p)).default
			mw(app, express)
		} catch (e) {
			log.warn(e)
		}
	})

	await Promise.all(promises)
}

async function loadServices() {
	// @ts-ignore
	global.services = {}
	const servicesPath = path.join(
		configuration.currentPath,
		'/services/**/*.{js,ts}'
	)
	const paths = await globby(servicesPath)
	const promises = paths.map(async servicePath => {
		log.trace(`Loading service: ${servicePath}`)
		let serviceName = servicePath.replace(/^(.*[\\/])/, '')
		serviceName = serviceName.replace(/(\.js|\.ts)/, '')
		serviceName = `${serviceName.charAt(0).toLowerCase()}${serviceName.slice(
			1
		)}`

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const Service = (await import(servicePath)).default
		// @ts-ignore
		global.services[serviceName] = Service
	})

	await Promise.all(promises)
}

async function loadAllMiddleware(app: Express) {
	const routesPath = path.join(
		configuration.currentPath,
		'/routers/**/!(*.map).(js|ts)'
	)
	const middlewarePath = path.join(
		configuration.currentPath,
		'/middleware/**/!(*.map).(js|ts)'
	)
	const afterwarePath = path.join(
		configuration.currentPath,
		'/afterware/**/!(*.map).(js|ts)'
	)
	await loadMiddleware({ globPattern: middlewarePath, app })
	await loadMiddleware({ globPattern: routesPath, app })
	await loadMiddleware({ globPattern: afterwarePath, app })
}

export default async function start() {
	const g = global as any
	g.configuration = new Configuration()
	g.config = await configuration.load()
	const level = (config.LOG_LEVEL as LogLevel) ?? LogLevel.Warn
	log.setOptions({
		useColors: true,
		level
	})

	log.info(`Set log level to: ${level}`)

	g.log = log
	const app = express()
	g.orm = new Orm()
	const promises = [loadServices(), loadAllMiddleware(app)]
	if (!config.ORM_DISABLE) {
		promises.push(orm.init())
	}

	await Promise.all(promises)

	let port = config.PORT
	if (!port) {
		port = 1337
	}

	const server = config.SERVER_LISTENING ? await listen(app) : undefined

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const Sockets = (await import('./Sockets')).default
	const socketsConfig = (await import('../sockets')).default
	if (server) {
		g.sockets = new Sockets({
			server,
			eventHandlers: socketsConfig.eventHandlers,
			canSubscribe: socketsConfig.canSubscribe,
			adapters: socketsConfig.adapters
		})
	}

	if (config.GENERATE_SHARED_TYPES) {
		const typeGeneratorTimer = log.timerStart()
		services.types
			.generateTypesFile()
			.then(() => {
				log.info(
					`Shared types file generated: ${(
						log.timerEnd(typeGeneratorTimer) / 1000
					).toFixed(4)} seconds`
				)
			})
			.catch(e => {
				log.warn('Unable to generate shared types file')
				log.warn(e)
			})
	}

	errorMiddleware(app)

	if (config.ENABLE_CONTRACT_LISTENERS) {
		g.listeners = {
			contract: new ContractListener()
		}

		g.listeners.contract.start()
	}

	if (config.ENABLE_TWITTER_LISTENERS) {
		g.listeners = {
			twitter: new TwitterListener()
		}

		g.listeners.twitter.start()
	}

	return {
		server,
		app
	}
}
