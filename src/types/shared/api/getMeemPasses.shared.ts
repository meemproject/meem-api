import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated,
	IApiPaginatedResponseBody
} from '../api.shared'
import { IMeemId } from '../meem.shared'

/** Get MeemPasses */
export namespace GetMeemPasses {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemPasses`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		hideWhitelisted?: boolean
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		meemPasses: any[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
