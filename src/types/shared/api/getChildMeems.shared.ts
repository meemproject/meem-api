import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IMetadataMeem, ITransfer, MeemType } from '../meem.shared'

export namespace GetChildMeems {
	export interface IPathParams {
		/** The token id to fetch children of */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meems/${options.tokenId}/children`

	export const method = HttpMethod.Get

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by owner address */
		owner?: string

		/** Filter by MeemType */
		meemType?: MeemType

		/** Filter by minter */
		mintedBy?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		meems: IMetadataMeem[]
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
