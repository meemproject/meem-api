import { EventSource } from '../api.shared'

export namespace MeemMinted {
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		tokenId: string
		transactionHash: string
	}
}
