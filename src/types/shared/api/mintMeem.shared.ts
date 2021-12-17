import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties
} from '../meem.shared'

/** Mint a new Meem */
export namespace MintMeem {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/mint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Optional name of the Meem to be stored in the Meem metadata */
		name?: string

		/** Optional description of the Meem to be stored in the Meem metadata */
		description?: string

		/** The contract address of the original NFT that is being minted as a Meem */
		tokenAddress: string

		/** The tokenId of the original NFT */
		tokenId: number

		/** The chain where the original NFT lives */
		chain: Chain

		/** Base64 image string to use for the minted meem image */
		base64Image?: string

		/** The address of the original NFT owner. Also where the Meem will be minted to. */
		accountAddress: string

		properties?: Partial<IMeemProperties>

		childProperties?: Partial<IMeemProperties>
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
