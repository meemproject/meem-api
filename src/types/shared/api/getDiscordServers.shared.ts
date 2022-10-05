import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IDiscordServer } from '../meem.shared'

export namespace GetDiscordServers {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/discord/servers`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		accessToken: string
	}

	export interface IRequestBody {
		/** The Discord authentication code */
		authCode: string
		/** The Discord authentication callback url */
		redirectUri: string
	}

	export interface IResponseBody extends IApiResponseBody {
		discordServers: IDiscordServer[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
