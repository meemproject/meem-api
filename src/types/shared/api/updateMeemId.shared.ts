import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemId`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Wallet address to remove */
		addressToRemove?: string

		/** Twitter id to remove */
		twitterIdToRemove?: string
	}

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
