import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace SlackAuthCallback {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/slack/callback'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** The code to exchange for an access token */
		code: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
