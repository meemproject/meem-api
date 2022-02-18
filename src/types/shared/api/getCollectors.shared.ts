import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated,
	IApiPaginatedResponseBody
} from '../api.shared'
import { ICollectorResult, IMetadataMeem, ITransfer } from '../meem.shared'

/** Get Collectors */
export namespace GetCollectors {
	export interface IPathParams {
		/** The token id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}/collectors`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		csv: boolean
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		collectors: ICollectorResult[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
