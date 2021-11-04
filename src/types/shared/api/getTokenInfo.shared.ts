import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { NetworkName } from '../meem.shared'

/** Get Info about Token */
export namespace GetTokenInfo {
	export interface IPathParams {}

	export const path = () => `/api/1.0/tokenInfo`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		address: string
		tokenId: number
		networkName: NetworkName
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		owner: string
		tokenURI: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
