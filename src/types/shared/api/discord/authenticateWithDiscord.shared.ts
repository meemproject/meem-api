import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace AuthenticateWithDiscord {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/discord/authenticate`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The Discord authentication code */
		authCode: string
		/** The Discord authentication callback url */
		redirectUri: string
	}

	export interface IResponseBody extends IApiResponseBody {
		user: { [key: string]: any }
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
