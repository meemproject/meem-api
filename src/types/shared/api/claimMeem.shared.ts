import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties
} from '../meem.shared'

/** Claim an existing Meem */
export namespace ClaimMeem {
	export interface IPathParams {
		/** The meem pass id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/claim/${options.tokenId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {}

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
