/* eslint-disable max-classes-per-file */
import { Server } from 'http'
// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import { Op } from 'sequelize'
import type User from '../models/User'

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

export type SocketAdapterOnMessage = (options: {
	eventName: string
	data: Record<string, any>
}) => Promise<void>

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

export type EventHandler = (data: Record<string, any>) => Promise<void>
export type CanSubscribeHandler = (options: {
	user?: User | null
	events: IEvent[]
}) => Promise<boolean>

export interface IEventHandlers {
	[eventName: string]: EventHandler[]
}

export interface IEvent {
	key: string
	data?: Record<string, any>
}

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
		adapter.init({
			server: this.server,
			onMessage: this.handleMessage.bind(this),
			onDisconnect: this.handleDisconnect.bind(this)
		})
	}

	public connectLambda(options: { endpoint: string }) {
		const { endpoint } = options
		this.endpoint = endpoint
	}

	public async handleMessage(options: {
		eventName: string
		data: Record<string, any>
	}) {
		const { eventName, data } = options
		log.trace(`Sockets received event: ${eventName}`)
		if (
			this.eventHandlers[eventName] &&
			this.eventHandlers[eventName].length > 0
		) {
			log.trace(
				`Executing ${this.eventHandlers[eventName].length} event handlers for ${eventName}`
			)
			const promises = this.eventHandlers[eventName].map(h => h(data))
			await Promise.allSettled(promises)
		} else {
			log.trace(`No event handlers found for: ${eventName}`)
		}
	}

	public async handleDisconnect(options: { socketId: string }) {
		const { socketId } = options

		log.trace(`Removed socket ${socketId}`)
	}

	public async subscribe(options: {
		user?: User | null
		socketId: string
		events: IEvent[]
	}) {
		const { user, socketId, events } = options
		const canSubscribe = await this.canSubscribe({ user, events })
		if (canSubscribe) {
			// Save subscription
			let socket = await orm.models.Socket.findOne({
				where: {
					socketId
				},
				include: [orm.models.SocketSubscription]
			})

			if (!socket) {
				socket = orm.models.Socket.build({
					socketId,
					UserId: user?.id
				})

				await socket.save()
			}

			const subscriptionsToAdd = events.filter(event => {
				if (socket?.SocketSubscriptions) {
					const existingEvent = socket.SocketSubscriptions.find(
						s => s.key === event.key
					)
					if (existingEvent) {
						return true
					}
				}
				return false
			})

			if (subscriptionsToAdd.length > 0) {
				const socketSubscriptions = subscriptionsToAdd.map(event => ({
					key: event.key,
					SocketId: socket?.id
				}))
				await orm.models.SocketSubscription.bulkCreate(socketSubscriptions)
			}
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

	public async unsubscribe(options: { socketId: string; events: IEvent[] }) {
		const { socketId, events } = options

		// Remove subscription
		const socket = await orm.models.Socket.findOne({
			where: {
				socketId
			}
		})

		const keys = events.map(e => e.key)

		if (socket) {
			await orm.models.SocketSubscription.destroy({
				where: {
					key: {
						[Op.in]: keys
					},
					SocketId: socket.id
				}
			})
		}
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

		const where = config.TESTING
			? {}
			: {
					subscriptions: {
						[Op.contains]: [subscription]
					}
			  }

		const sockets = await orm.models.Socket.findAll({
			where
		})

		const promises = sockets.map(s =>
			this.emitToSocket({
				socketId: s.id,
				eventName,
				data
			})
		)

		await Promise.allSettled(promises)
	}

	/** Emit to a specific socket connection */
	public async emitToSocket(options: {
		socketId: string
		eventName: string
		data: Record<string, any>
	}) {
		const promises = this.adapters.map(a => a.emit(options))
		await Promise.allSettled(promises)
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
