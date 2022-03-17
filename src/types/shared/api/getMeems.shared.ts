import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated,
	IApiPaginatedResponseBody
} from '../api.shared'
import { IMetadataMeem, MeemType, SortOrder } from '../meem.shared'

/** Get Meem */
export namespace GetMeems {
	export interface IPathParams {}

	export const path = (options?: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Get

	export enum SortBy {
		MintedAt = 'mintedAt',
		TokenId = 'tokenId',
		Name = 'name',
		Meemtype = 'meemType',
		Owner = 'owner',
		Generation = 'generation',
		Parent = 'parent',
		Root = 'root',
		MintedBy = 'mintedBy',
		VerifiedBy = 'verifiedBy'
	}

	export interface IQueryParams extends IRequestPaginated {
		/** Filter by owner address */
		owner?: string

		/** Filter by MeemType */
		meemTypes?: MT[]

		/** Filter by Root Token ID */
		rootTokenIds?: string[]

		/** Filter by Parent Token ID */
		parentTokenIds?: string[]

		/** Filter by minter */
		mintedBy?: string

		/** Search metadata by query string */
		q?: string

		sortBy?: SortBy

		sortOrder?: SortOrder
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
