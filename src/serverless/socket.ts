/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line import/no-extraneous-dependencies
import { APIGatewayProxyHandler } from 'aws-lambda'
import supertest, { SuperTest, Test } from 'supertest'
import start from '../core/start'

let app: Express.Application
let request: SuperTest<Test>

export const handle: APIGatewayProxyHandler = async (event, _context) => {
	try {
		// eslint-disable-next-line no-console
		console.log({ event })

		if (!request || !app) {
			const result = await start()
			app = result.app
			request = supertest(app)
		}

		const { requestContext, body } = event
		const { eventType, connectionId } = requestContext

		if (config.AWS_WEBSOCKET_GATEWAY_URL) {
			sockets?.connectLambda({
				endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
			})
		} else {
			log.crit('AWS_WEBSOCKET_GATEWAY_URL is not set')
		}

		if (connectionId) {
			switch (eventType) {
				case 'CONNECT':
					break

				case 'DISCONNECT':
					sockets?.handleDisconnect({ socketId: connectionId })
					break

				case 'MESSAGE': {
					if (body) {
						log.debug('parsing body')
						try {
							const { eventName, data } = JSON.parse(body)
							switch (eventName) {
								case 'subscribe':
									log.debug('calling subscribe')
									// await sockets?.subscribe(connectionId, data)
									await sockets?.subscribe({
										socketId: connectionId,
										events: data
									})
									break

								case 'unsubscribe':
									log.debug('calling unsubscribe')
									// await sockets?.unsubscribe(connectionId, data)
									await sockets?.unsubscribe({
										socketId: connectionId,
										events: data
									})
									break

								default:
									log.warn(`No handler for eventName: ${eventName}`)
									break
							}
						} catch (e) {
							log.warn(e)
						}
					} else {
						log.debug('No body')
					}
					break
				}

				default:
					log.warn(`No handler for eventType: ${eventType}`)
					break
			}
		} else {
			log.fatal('No connection id')
		}

		log.debug({
			connectionId
		})

		const response = {
			statusCode: 200,
			body: JSON.stringify({})
		}

		return response
	} catch (e) {
		log.crit(e)
		const response = {
			statusCode: 500,
			body: JSON.stringify({})
		}

		return response
	}
}
