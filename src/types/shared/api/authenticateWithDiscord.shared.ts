import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClippingExtended } from '../meem.shared'

export namespace AuthenticateWithDiscord {
	export interface IPathParams {}

	export const path = () => `/api/1.0/identity/discord/authenticate`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The authorization code provided by Discord OAuth response */
		authCode: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The Discord access token */
		accessToken: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
