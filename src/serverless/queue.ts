/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import util from 'util'
// eslint-disable-next-line import/no-extraneous-dependencies
import { SQSHandler } from 'aws-lambda'
import start from '../core/start'

let app: Express.Application

export const handle: SQSHandler = async (event, context) => {
	// eslint-disable-next-line no-console
	console.log(util.inspect({ event }, true, 999, true))
	context.callbackWaitsForEmptyEventLoop = false

	try {
		if (!app) {
			const result = await start({
				isListeningDisabled: true
			})
			app = result.app
			// request = supertest(app)
		}

		if (config.AWS_WEBSOCKET_GATEWAY_URL) {
			sockets?.connectLambda({
				endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
			})
		} else {
			log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
		}

		const records = event.Records
		const promises: Promise<any>[] = []

		records.forEach(record => {
			try {
				const e = JSON.parse(record.body)
				promises.push(services.queue.handleEvent({ event: e }))
			} catch (e) {
				log.warn(e)
			}
		})

		const results = await Promise.allSettled(promises)
		results.forEach(result => {
			if (result.status === 'rejected') {
				log.warn(result.reason)
			}
		})
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(e)
	}
}
