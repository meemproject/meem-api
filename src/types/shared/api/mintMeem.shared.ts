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
		/** The contract address of the original NFT that is being minted as a Meem */
		tokenAddress: string

		/** The tokenId of the original NFT */
		tokenId: number

		/** The chain where the original NFT lives */
		chain: Chain

		/** The address of the original NFT owner. Also where the Meem will be minted to. */
		accountAddress: string

		properties?: Partial<IMeemProperties>

		childProperties?: Partial<IMeemProperties>

		/** Set to true to disable ownership checks. This option is only respected on testnet. */
		shouldIgnoreOwnership?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		transactionHash: string
		tokenId: number
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
