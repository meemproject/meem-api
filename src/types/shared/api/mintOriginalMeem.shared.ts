import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties,
	ITokenMetadataLike
} from '../meem.shared'

/** Mint a new (wrapped) Meem */
export namespace MintOriginalMeem {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/mintOriginal`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The address of the Meem contract to mint token */
		agreementAddress: string

		/** The chain id */
		chainId: number

		/** Metadata object to be used for the minted Meem */
		metadata?: ITokenMetadataLike

		/** The address where the Meem will be minted to. */
		to: string
	}

	export interface IResponseBody extends IApiResponseBody {
		// transactionHash: string
		// tokenId: number
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
