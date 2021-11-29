import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { Chain, IChainNFTsResult, INFT } from '../meem.shared'

/** Get NFTs owned by an account */
export namespace GetNFTs {
	export interface IPathParams {}

	export const path = () => `/api/1.0/nfts`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		address: string
		/** Limit results to only these chains */
		chains?: Chain[]
		offset?: number
		limit?: number
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		chains: IChainNFTsResult[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
