import { EventSource } from '../api.shared'

export namespace MeemMinted {
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		/** The wallet address where the Meem was minted */
		toAddress: string

		/** The URI for the minted Meem */
		tokenURI: string

		/** The tokenId */
		tokenId: string

		/** The transaction hash */
		transactionHash: string
	}
}
