import { EventSource } from '../api.shared'

export namespace Subscribe {
	export const eventSource = EventSource.Client

	export interface IEventPayload {
		// @ts-ignore
		type: MeemEvent.Subscribe
		events: {
			key: string
			data?: Record<string, any>
		}[]
	}
}
