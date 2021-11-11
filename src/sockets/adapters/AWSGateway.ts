// eslint-disable-next-line import/no-extraneous-dependencies
import AWS from 'aws-sdk'
import {
	SocketAdapter,
	ISocketAdapterInitOptions,
	IEmitOptions
	// SocketAdapterOnMessage
} from '../../core/Sockets'

export type Callback = (options: IEmitOptions) => Promise<void>

export default class AWSGatewayAdapter extends SocketAdapter {
	// private onMessage?: SocketAdapterOnMessage

	// private cb?: Callback

	public async init(_options: ISocketAdapterInitOptions) {
		// this.onMessage = options.onMessage
	}

	public async emit(options: IEmitOptions) {
		const { socketId, eventName, data } = options
		await this.postToAWSGateway({
			ConnectionId: socketId,
			Data: JSON.stringify({
				eventName,
				data
			})
		})
	}

	/** Attach a listener that will receive emitted events */
	public async listen(_cb: Callback) {
		// this.cb = cb
	}

	// /** Send a message as a client */
	// public async clientSend(options: IEmitOptions) {
	// 	if (this.onMessage) {
	// 		await this.onMessage(options)
	// 	}
	// }

	public isConnected() {
		return true
	}

	private postToAWSGateway(
		data: AWS.ApiGatewayManagementApi.PostToConnectionRequest
	) {
		return new Promise(resolve => {
			const gateway = new AWS.ApiGatewayManagementApi({
				apiVersion: '2018-11-29',
				endpoint: config.AWS_WEBSOCKET_GATEWAY_URL
			})
			log.debug({ data })
			gateway.postToConnection(data, (err, gatewayResponse) => {
				if (err) {
					log.warn(err)
					resolve()
					return
				}
				resolve(gatewayResponse)
			})
		})
	}
}
