import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemSplit } from '../meem.shared'

/** Mint a new Meem */
export namespace MintMeem {
	export interface IPathParams {
		/** The token id to fetch */
		tokenId: string
	}

	export const path = (options: IPathParams) => `/api/1.0/meems`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokenAddress: string
		tokenId: number
		chain: number
		accountAddress: string
		meemImageOptions: {
			flipX: boolean
			flipY: boolean
		}
		permissions: {
			owner: {
				copyPermissions: [
					{
						permission: number
						addresses: string[]
						numTokens: number
						lockedBy?: string
					}
				]
				totalChildren: number
				totalChildrenLockedBy?: string
				splits: IMeemSplit[]
			}
		}
		verifyOwnerOnTestnet?: boolean
		mintToTestnet?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		transactionHash: string
		tokenId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
