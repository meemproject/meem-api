import { EventSource } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace MeemIdUpdated {
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload {
		meemId: IMeemId
		jwt: string
	}
}
