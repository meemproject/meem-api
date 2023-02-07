import { Server } from 'http'
import path from 'path'
import log, { LogLevel } from '@kengoldfarb/log'
import express, { Express } from 'express'
import globby from 'globby'
import Gun from 'gun'
import fetch from 'node-fetch'
import ProviderListener from '../listeners/ProviderListener'
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
		if (config.PORT) {
			const server = app.listen(config.PORT, async () => {
				resolve(server)
			})
		} else {
			const server = app.listen(async () => {
				resolve(server)
			})
		}
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
	const timer = log.timerStart()
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

		if (Service.shouldInitialize) {
			// @ts-ignore
			global.services[serviceName] = new Service()
		} else {
			// @ts-ignore
			global.services[serviceName] = Service
		}
	})

	await Promise.all(promises)
	log.info(`Load Services: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`)
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
	let timer = log.timerStart()
	await loadMiddleware({ globPattern: middlewarePath, app })
	log.info(
		`Load Middleware: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`
	)
	timer = log.timerStart()
	await loadMiddleware({ globPattern: routesPath, app })
	log.info(`Load Routes: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`)
	timer = log.timerStart()
	await loadMiddleware({ globPattern: afterwarePath, app })
	log.info(`Load Afterware: ${(log.timerEnd(timer) / 1000).toFixed(4)} seconds`)
}

export default async function start(options?: {
	isListeningDisabled?: boolean
}) {
	const isListeningDisabled = options?.isListeningDisabled === true
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
	const bootTimer = log.timerStart()
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

	const server =
		config.SERVER_LISTENING && !isListeningDisabled
			? await listen(app)
			: undefined

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

		if (config.ENABLE_GUNDB) {
			// const gunDbPeers = config.GUN_DB_PEERS.split(',')
			g.gun = Gun({
				web: server,
				multicast: false,
				// radisk: false,
				axe: false,
				// super: true,
				// peers: gunDbPeers,
				peers: [],
				s3: {
					bucket: config.GUNDB_S3_BUCKET,
					key: config.APP_AWS_ACCESS_KEY_ID,
					secret: config.APP_AWS_SECRET_ACCESS_KEY,
					region: 'us-east-1'
				}
			})

			g.gun.on('hi', (peer: any) => {
				log.trace(`Gun peer connected: ${peer?.url}`)
			})

			g.gun.on('bye', (peer: any) => {
				log.trace('Gun peer disconnected: ', peer?.url)
			})
		}
	}

	if (config.GENERATE_SHARED_TYPES) {
		const typeGeneratorTimer = log.timerStart()
		services.types
			.generateTypesFiles()
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
	g.listeners = {}

	if (config.ENABLE_PROVIDER_LISTENERS) {
		g.listeners = {
			...g.listeners,
			provider: new ProviderListener()
		}

		g.listeners.provider.start()
	} else {
		log.debug('Provider listener disabled')
	}

	// if (config.ENABLE_TWITTER_LISTENERS) {
	// 	g.listeners = {
	// 		twitter: new TwitterListener()
	// 	}

	// 	g.listeners.twitter.start()
	// }

	if (config.ENABLE_SQS_CONSUMER) {
		// eslint-disable-next-line global-require
		require('../lib/SQSConsumer')
	}

	// Fetch polyfill
	g.fetch = fetch

	log.info(
		`Server boot: ${(log.timerEnd(bootTimer) / 1000).toFixed(4)} seconds`
	)

	return {
		server,
		app
	}
}
