import { SocketAdapter, IEvent, ISocketsConfig } from '../core/Sockets'
import type User from '../models/User'
import WebsocketAdapter from './adapters/Websocket'

const adapters: SocketAdapter[] = [new WebsocketAdapter()]

const socketsConfig: ISocketsConfig = {
	adapters,
	canSubscribe: async (options: { user?: User | null; events: IEvent[] }) => {
		const { user, events } = options
		log.trace('Received canSubscribe', { user, events })
		return true
	},
	eventHandlers: {
		test: [
			async data => {
				log.debug({ data })
			}
		]
	}
}

export default socketsConfig
