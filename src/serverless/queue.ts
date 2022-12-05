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
		}

		const records = event.Records

		for (let i = 0; i < records.length; i++) {
			try {
				const record = records[i]
				const e = JSON.parse(record.body)
				await services.queue.handleEvent({ event: e })
			} catch (e) {
				log.warn(e)
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.log(e)
	}
}
