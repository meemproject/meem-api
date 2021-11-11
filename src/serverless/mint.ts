/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
import util from 'util'
import supertest, { SuperTest, Test } from 'supertest'
import start from '../core/start'
import { MeemAPI } from '../types/meem.generated'

let server: Express.Application
let request: SuperTest<Test>

export const handle = async (
	event: { body: MeemAPI.v1.MintMeem.IRequestBody },
	context: AWSLambda.Context
) => {
	const { body } = event

	if (process.env.SERVERLESS_LOG_FULL_REQUEST === 'true') {
		// eslint-disable-next-line no-console
		console.log(util.inspect({ event }, true, 999, true))
	} else {
		// eslint-disable-next-line no-console
		console.log(
			util.inspect(
				{
					body
				},
				true,
				999,
				true
			)
		)
	}
	context.callbackWaitsForEmptyEventLoop = false

	if (!request || !server) {
		const result = await start()
		server = result.app
		request = supertest(server)
	}

	// @ts-ignore
	// if (event.source === 'serverless-plugin-warmup') {
	// 	// eslint-disable-next-line no-console
	// 	console.log('WARMED LAMBDA FUNCTION: handler')
	// 	return {
	// 		statusCode: 200,
	// 		body: ''
	// 	}
	// }

	if (config.AWS_WEBSOCKET_GATEWAY_URL) {
		sockets?.connectLambda({
			endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
		})
	} else {
		log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
	}

	const meem = await services.meem.mintMeem(body)

	return meem
}
