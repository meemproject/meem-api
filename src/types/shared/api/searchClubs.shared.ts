import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IClub } from '../meem.shared'

/** Get Meem */
export namespace SearchClubs {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clubs/search`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		accountAddress?: string
	}

	export interface IResponseBody extends IApiResponseBody {
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
