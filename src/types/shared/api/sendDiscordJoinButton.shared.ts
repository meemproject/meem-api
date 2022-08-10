import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClippingExtended } from '../meem.shared'

export namespace SendDiscordJoinButton {
	export interface IPathParams {}

	export const path = () => `/api/1.0/identity/discord/sendButton`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		accessToken: string
		title: string
		description: string
		button: string
		serverId: string
		channelId: string
	}

	export interface IResponseBody extends IApiResponseBody {
		status: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
