import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeem } from '../meem.shared'

/** Get Meem */
export namespace GetMeems {
	export interface IPathParams {}

	export const path = (options: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		parentTokenAddress?: string
		parentTokenId?: number
		parentChain?: number
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		meems: any[] // TODO: replace with IMeem type
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
