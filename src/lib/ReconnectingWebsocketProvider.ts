/* eslint-disable max-classes-per-file */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */

// Fixes issue of websocket not reconnecting
// https://github.com/ethers-io/ethers.js/issues/1053

import { providers } from 'ethers'

const EXPECTED_PONG_BACK = 15000
const KEEP_ALIVE_CHECK_INTERVAL = 7500

// Used to "trick" TypeScript into treating a Proxy as the intended proxied class
export const fakeBaseClass = <T>(): new () => Pick<T, keyof T> =>
	class {} as any

// @ts-ignore
export class ReconnectingWebSocketProvider extends fakeBaseClass<providers.WebSocketProvider>() {
	private underlyingProvider!: providers.WebSocketProvider

	// Define a handler that forwards all "get" access to the underlying provider
	private handler = {
		get(target: ReconnectingWebSocketProvider, prop: string, receiver: any) {
			return Reflect.get(target.underlyingProvider, prop, receiver)
		}
	}

	public constructor(
		private url: string,
		private network?: providers.Networkish
	) {
		super()
		this.connect()
		return new Proxy(this, this.handler)
	}

	private connect() {
		// Copy old events
		const events = this.underlyingProvider?._events ?? []

		// Instantiate new provider with same url
		this.underlyingProvider = new providers.WebSocketProvider(
			this.url,
			this.network
		)

		let pingTimeout: NodeJS.Timeout
		let keepAliveInterval: NodeJS.Timer

		this.underlyingProvider._websocket.on('open', () => {
			// Send ping messages on an interval
			keepAliveInterval = setInterval(() => {
				this.underlyingProvider._websocket.ping()

				// Terminate if a pong message is not received timely
				pingTimeout = setTimeout(
					() => this.underlyingProvider._websocket.terminate(),
					EXPECTED_PONG_BACK
				)
			}, KEEP_ALIVE_CHECK_INTERVAL)

			// Add old events to new provider
			events.forEach(event => {
				this.underlyingProvider._events.push(event)
				this.underlyingProvider._startEvent(event)
			})
		})

		// Clear timers and reconnect on close
		this.underlyingProvider._websocket.on('close', () => {
			clearInterval(keepAliveInterval)
			clearTimeout(pingTimeout)
			this.connect()
		})

		// Clear ping timer when pong is received
		this.underlyingProvider._websocket.on('pong', () => {
			clearInterval(pingTimeout)
		})
	}
}
