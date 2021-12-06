import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { Chain, IMeem } from '../meem.shared'

/** Get Meem tokenIds of wNFTs */
export namespace GetWrappedTokens {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/getWrappedTokens`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Array of nfts to check */
		nfts: {
			/** The chain where the original NFT lives */
			chain: Chain
			/** The original NFT contract address */
			contractAddress: string
			/** The original NFT tokenId. Bignumberish */
			tokenId: string
		}[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** The wrapped tokens */
		wrappedTokens: {
			chain: Chain
			contractAddress: string
			tokenId: string
			/** The hex string of the wrapped token id */
			wrappedTokenId: string
		}[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
