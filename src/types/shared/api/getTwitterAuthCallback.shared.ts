import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Get Meem */
export namespace GetTwitterAuthCallback {
	export interface IPathParams {}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemid/twitter/callback`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		oauth_token: string
		oauth_verifier: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		accessToken: string
		accessSecret: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
