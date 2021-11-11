import { SocketAdapter, ISocketsConfig } from '../core/Sockets'
import { MeemAPI } from '../types/meem.generated'
import AWSGatewayAdapter from './adapters/AWSGateway'
import TestingAdapter from './adapters/Testing'
import WebsocketAdapter from './adapters/Websocket'

const adapters: SocketAdapter[] = []

if (config.TESTING) {
	adapters.push(new TestingAdapter())
}

if (config.WEBSOCKETS_ENABLED) {
	adapters.push(new WebsocketAdapter())
}

if (config.AWS_WEBSOCKET_GATEWAY_URL) {
	adapters.push(new AWSGatewayAdapter())
}

const socketsConfig: ISocketsConfig = {
	adapters,
	canSubscribe: async (options: { events: MeemAPI.IEvent[] }) => {
		const { events } = options
		log.trace('Received canSubscribe', { events })
		return true
	},
	eventHandlers: {
		test: [
			async data => {
				log.debug({ data })
			}
		],
		subscribe: [
			async ({ socketId, data }) => {
				log.debug({ socketId, data })
				await services.db.saveSubscription({
					connectionId: socketId,
					events: data?.events
				})
			}
		]
	}
}

export default socketsConfig
