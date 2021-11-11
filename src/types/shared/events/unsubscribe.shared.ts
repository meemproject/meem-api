import { EventSource } from '../api.shared'

export namespace Unsubscribe {
	export const eventSource = EventSource.Client

	export interface IEventPayload {
		// @ts-ignore
		type: MeemEvent.Unsubscribe
		// @ts-ignore
		events: SubscribeType[]
	}
}
