import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties
} from '../meem.shared'

/** Mint a new (wrapped) Meem */
export namespace MintOriginalMeem {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/mintOriginal`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The address of the Meem contract to mint token */
		meemContractAddress: string

		/** The chain where the Meem contract lives */
		chain: Chain

		/** JSON (or stringified) metadata object to be used for the minted Meem */
		metadata?: string | any

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
