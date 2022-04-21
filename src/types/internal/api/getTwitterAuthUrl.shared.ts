import { IError, HttpMethod, IApiResponseBody } from '../../shared/api.shared'

/** Get Twitter Auth Url */
export namespace GetTwitterAuthUrl {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemid/twitter/request-url`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		url: string
		oauthToken: string
		oauthTokenSecret: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
