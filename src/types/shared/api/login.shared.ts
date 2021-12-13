import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace Login {
	export interface IPathParams {}

	export const path = () => `/api/1.0/login`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Login w/ wallet. Both address and signature must be provided */
		address?: string
		/** Login w/ wallet. Both address and signature must be provided */
		signature?: string

		/** Login twitter access token */
		twitterAccessToken?: string
		twitterAccessSecret?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The MeemId */
		meemId: IMeemId
		/** JWT that can be used for future authentication */
		jwt: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}