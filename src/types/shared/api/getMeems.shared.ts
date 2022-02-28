import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated,
	IApiPaginatedResponseBody
} from '../api.shared'
import { IMetadataMeem, MeemType } from '../meem.shared'

/** Get Meem */
export namespace GetMeems {
	export interface IPathParams {}

	export const path = (options?: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by owner address */
		owner?: string

		/** Filter by MeemType */
		meemTypes?: MeemType[]

		/** Filter by Root Token ID */
		rootTokenIds?: string[]

		/** Filter by minter */
		mintedBy?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiPaginatedResponseBody {
		meems: IMetadataMeem[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
