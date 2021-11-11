import { EventSource } from '../api.shared'

export namespace Err {
	export const eventSource = EventSource.Server

	export interface ISubscribePayload {}

	export interface IEventPayload extends Record<string, any> {}
}
