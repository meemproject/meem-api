import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMetadataMeem, ITransfer } from '../meem.shared'

/** Get Meem */
export namespace GetMeem {
	export interface IPathParams {
		/** The token id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		meem: IMetadataMeem
		transfers: ITransfer[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
