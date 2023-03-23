import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

/** Redirect the user to this endpoint to authenticate w/ slack */
export namespace AuthenticateWithSlack {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/slack/auth'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** The agreement id to associate the twitter account with */
		agreementId: string

		/** The url to return the user to after authentication */
		returnUrl: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
