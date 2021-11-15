/* eslint-disable max-classes-per-file */
import { Server } from 'http'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { MeemAPI } from '../types/meem.generated'

export enum ConnectionType {
	None = 'none',
	Websocket = 'websocket'
}

export enum SocketEvent {
	Error = 'err'
}

export type SocketAdapterOnDisconnect = (options: {
	socketId: string
}) => Promise<void>

export type SocketAdapterOnMessage = (options: IEmitOptions) => Promise<void>

export interface ISocketAdapterInitOptions {
	server: Server
	onDisconnect: SocketAdapterOnDisconnect
	onMessage: SocketAdapterOnMessage
}

export interface IEmitOptions {
	socketId: string
	eventName: string
	data: Record<string, any>
}

export type EventHandler<TData = Record<string, any>> = (options: {
	socketId: string
	data?: Partial<TData>
}) => Promise<void>

export type CanSubscribeHandler = (options: {
	events: MeemAPI.IEvent[]
}) => Promise<boolean>

export interface IEventHandlers {
	[eventName: string]: EventHandler[]
}

// export interface IEvent {
// 	key: string
// 	data?: Record<string, any>
// }

export interface ISocketsConfig {
	canSubscribe: CanSubscribeHandler
	eventHandlers?: IEventHandlers
	adapters?: SocketAdapter[]
}

export abstract class SocketAdapter {
	public abstract init(options: ISocketAdapterInitOptions): Promise<void>

	public abstract emit(options: IEmitOptions): Promise<void>

	public abstract isConnected(): boolean
}

export default class Sockets {
	private adapters: SocketAdapter[] = []

	private endpoint?: string

	private server: Server

	private eventHandlers: IEventHandlers = {}

	private canSubscribe: CanSubscribeHandler

	public constructor(options: {
		server: Server
		canSubscribe: CanSubscribeHandler
		eventHandlers?: IEventHandlers
		adapters?: SocketAdapter[]
	}) {
		log.trace('Sockets initializing')
		const { server, adapters, eventHandlers, canSubscribe } = options
		this.server = server
		this.canSubscribe = canSubscribe
		if (eventHandlers) {
			this.addEventHandlers({ eventHandlers })
		}

		if (adapters) {
			adapters.forEach(adapter => this.addAdapter(adapter))
		}
	}

	public addEventHandlers(options: { eventHandlers: IEventHandlers }) {
		const { eventHandlers } = options
		Object.keys(eventHandlers).forEach(eventName => {
			if (!this.eventHandlers[eventName]) {
				this.eventHandlers[eventName] = []
			}
			this.eventHandlers[eventName] = this.eventHandlers[eventName].concat(
				eventHandlers[eventName]
			)
		})
	}

	public addAdapter(adapter: SocketAdapter) {
		log.trace(`Sockets adding adapter: ${adapter.constructor.name}`)
		adapter.init({
			server: this.server,
			onMessage: this.handleMessage.bind(this),
			onDisconnect: this.handleDisconnect.bind(this)
		})
		this.adapters.push(adapter)
	}

	public connectLambda(options: { endpoint: string }) {
		const { endpoint } = options
		this.endpoint = endpoint
	}

	public async handleMessage(options: {
		socketId: string
		eventName: string
		data?: Record<string, any>
	}) {
		const { socketId, eventName, data } = options
		log.trace(`Sockets received event: ${eventName}`, data)
		if (
			this.eventHandlers[eventName] &&
			this.eventHandlers[eventName].length > 0
		) {
			log.trace(
				`Executing ${this.eventHandlers[eventName].length} event handlers for ${eventName}`
			)
			const promises = this.eventHandlers[eventName].map(h =>
				h({ socketId, data })
			)
			const results = await Promise.allSettled(promises)
			const errors: any[] = []
			results.forEach(result => {
				if (result.status === 'rejected') {
					log.warn(result.reason)
					// Call the event error handler
					errors.push(result.reason)
				}
			})
			if (errors.length > 0) {
				// TODO: Emit errors
			}

			log.trace('Event handlers finished')
		} else {
			log.trace(`No event handlers found for: ${eventName}`)
		}
	}

	public async handleDisconnect(options: { socketId: string }) {
		const { socketId } = options

		log.trace(`Removed socket ${socketId}`)
		await services.db.removeSubscriptions({
			connectionId: socketId
		})
	}

	public async subscribe(options: {
		socketId: string
		walletAddress?: string
		events: MeemAPI.IEvent[]
	}) {
		const { socketId, walletAddress, events } = options
		const canSubscribe = await this.canSubscribe({ events })
		if (canSubscribe) {
			// Save subscription
			await services.db.saveSubscription({
				connectionId: socketId,
				walletAddress,
				events
			})
		} else {
			// Emit error
			this.emitToSocket({
				socketId,
				eventName: SocketEvent.Error,
				data: {
					code: 'NOT_AUTHORIZED'
				}
			})
		}
	}

	public async unsubscribe(options: {
		socketId: string
		events: MeemAPI.IEvent[]
	}) {
		const { socketId, events } = options

		// Remove subscription
		log.warn('TODO unsubscribe', { socketId, events })
	}

	/** Emit an event to any socket that is subscribed to it */
	public async emit(options: {
		/** The subscription key */
		subscription: string

		/** The event name to emit */
		eventName: string

		/** The event data */
		data: Record<string, any>
	}) {
		const { subscription, eventName, data } = options

		const subscriptions = await services.db.getSubscriptions({
			subscriptionKey: subscription
		})

		log.debug(subscriptions)

		const promises: Promise<any>[] = []

		subscriptions.Items?.forEach(s => {
			if (s.connectionId.S) {
				promises.push(
					this.emitToSocket({
						socketId: s.connectionId.S,
						eventName,
						data
					})
				)
			}
		})

		await Promise.allSettled(promises)
	}

	/** Emit an error message for the provided error code to any socket that is subscribed to it */
	public async emitError(
		// TODO: Add walletAddress and emit to just that
		/** The error code */
		error: {
			httpCode: number
			status: string
			reason: string
			friendlyReason: string
		}
	) {
		const subscription = MeemAPI.MeemEvent.Err
		const eventName = MeemAPI.MeemEvent.Err

		const subscriptions = await services.db.getSubscriptions({
			subscriptionKey: subscription
		})

		log.debug(subscriptions)

		const promises: Promise<any>[] = []

		subscriptions.Items?.forEach(s => {
			if (s.connectionId.S) {
				promises.push(
					this.emitToSocket({
						socketId: s.connectionId.S,
						eventName,
						data: error
					})
				)
			}
		})

		await Promise.allSettled(promises)
	}

	/** Emit to a specific socket connection */
	public async emitToSocket(options: {
		socketId: string
		eventName: string
		data: Record<string, any>
	}) {
		const { socketId } = options
		const promises = this.adapters.map(a => a.emit(options))
		// await Promise.allSettled(promises)
		try {
			await Promise.all(promises)
		} catch (e) {
			log.warn(e)
			// Remove the subscription if the emit failed
			try {
				await services.db.removeSubscriptions({
					connectionId: socketId
				})
			} catch (e2) {
				log.warn(e2)
			}
		}
	}

	public postToAWSGateway(
		data: AWS.ApiGatewayManagementApi.PostToConnectionRequest
	) {
		return new Promise(resolve => {
			const gateway = new AWS.ApiGatewayManagementApi({
				apiVersion: '2018-11-29',
				endpoint: this.endpoint
			})
			log.debug({ data })
			gateway.postToConnection(data, (err, gatewayResponse) => {
				if (err) {
					log.warn(err)
					resolve(null)
					return
				}
				resolve(gatewayResponse)
			})
		})
	}
}
