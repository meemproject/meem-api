/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
import { APIGatewayProxyHandler } from 'aws-lambda'
import supertest, { SuperTest, Test } from 'supertest'
import start from '../core/start'
import CronJob from '../cron/CronJob'

let app: Express.Application
let request: SuperTest<Test>

export type Constructor = new (...args: any[]) => CronJob

export const handle: APIGatewayProxyHandler = async (event, _context) => {
	// eslint-disable-next-line no-console
	console.log({ event })

	if (!request || !app) {
		const result = await start()
		app = result.app
		request = supertest(app)
	}

	// if (config.AWS_WEBSOCKET_GATEWAY_URL) {
	// 	sockets.connectLambda({
	// 		endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
	// 	})
	// } else {
	// 	log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
	// }

	try {
		// @ts-ignore
		const { job } = event
		// eslint-disable-next-line import/no-dynamic-require
		const Cronjob = require(`../cron/jobs/${job}`).default as Constructor
		const cronjob = new Cronjob()
		await cronjob.run()
	} catch (e) {
		log.crit(e)
	}

	const response = {
		statusCode: 200,
		body: ''
	}

	return response
}
