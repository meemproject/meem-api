import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IApiPaginatedResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClub } from '../meem.shared'

/** Get Meem */
export namespace SearchClubs {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clubs/search`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		query: string
	}

	export interface IRequestBody {}
	export interface IResponseBody extends IApiPaginatedResponseBody {
		clubs: IClub[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
