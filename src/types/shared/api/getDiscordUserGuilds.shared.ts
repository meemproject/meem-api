import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClippingExtended } from '../meem.shared'

export namespace GetDiscordUserGuilds {
	export interface IPathParams {}

	export const path = () => `/api/1.0/identity/discord/guilds`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/* Discord access token for user making request */
		/* TODO: Store this on the identity of the user */
		accessToken: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The user's Discord guilds */
		guilds: { [key: string]: any }[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
