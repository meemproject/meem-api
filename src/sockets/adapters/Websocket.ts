import { v4 as uuidv4 } from 'uuid'
import ws from 'ws'
import {
	SocketAdapter,
	ISocketAdapterInitOptions,
	IEmitOptions,
	SocketAdapterOnDisconnect,
	SocketAdapterOnMessage
} from '../../core/Sockets'

export interface IIdentifiedWebsocket extends ws {
	id: string
}

export default class WebsocketAdapter extends SocketAdapter {
	private wss?: ws.Server

	private isServerConnected = false

	private onDisconnect?: SocketAdapterOnDisconnect

	private onMessage?: SocketAdapterOnMessage

	public async init(options: ISocketAdapterInitOptions) {
		this.onDisconnect = options.onDisconnect
		this.onMessage = options.onMessage

		this.wss = new ws.Server(
			{
				server: options.server
			},
			() => {
				this.isServerConnected = true
			}
		)
		this.wss.on('connection', (socket: IIdentifiedWebsocket) => {
			const socketId = uuidv4()
			socket.id = socketId

			socket.on('close', () => {
				if (this.onDisconnect) {
					this.onDisconnect({ socketId })
				}
			})
			socket.on('message', rawData => {
				try {
					const { eventName, data } = JSON.parse(rawData.toString())
					if (this.onMessage) {
						this.onMessage({ eventName, data })
					}
				} catch (e) {
					try {
						const str = rawData.toString()
						log.warn(`Invalid data received: ${str}`)
						log.warn(e)
					} catch (err) {
						log.warn(e, err)
					}
				}
			})
		})
	}

	public async emit(options: IEmitOptions) {
		const { socketId, eventName, data } = options
		this.wss?.clients.forEach(c => {
			const client = c as IIdentifiedWebsocket

			if (client.id === socketId) {
				client.send(
					JSON.stringify({
						eventName,
						data
					})
				)
			}
		})
	}

	public isConnected() {
		return this.isServerConnected
	}
}
