import {
	SocketAdapter,
	ISocketAdapterInitOptions,
	IEmitOptions,
	SocketAdapterOnMessage
} from '../../core/Sockets'

export type Callback = (options: IEmitOptions) => Promise<void>

export default class TestingAdapter extends SocketAdapter {
	private onMessage?: SocketAdapterOnMessage

	private cb?: Callback

	public async init(options: ISocketAdapterInitOptions) {
		this.onMessage = options.onMessage
	}

	public async emit(options: IEmitOptions) {
		if (this.cb) {
			this.cb(options)
		}
	}

	/** Attach a listener that will receive emitted events */
	public async listen(cb: Callback) {
		this.cb = cb
	}

	/** Send a message as a client */
	public async clientSend(options: IEmitOptions) {
		if (this.onMessage) {
			await this.onMessage(options)
		}
	}

	public isConnected() {
		return true
	}
}
