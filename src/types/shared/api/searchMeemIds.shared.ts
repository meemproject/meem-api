import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

/** Get Meem */
export namespace SearchMeemIds {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemids/search`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		accountAddress?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		meemIds: IMeemId[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
