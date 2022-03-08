import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClipping } from '../meem.shared'

export namespace GetMeemClippings {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clippings`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by address that clipped */
		address?: string
		/** Filter by tokenId */
		tokenId?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		clippings: IClipping[]

		totalItems: number
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
