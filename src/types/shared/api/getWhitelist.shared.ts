import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IWhitelistItem } from '../meem.shared'

/** Get whitelisted NFT contracts */
export namespace GetWhitelist {
	export interface IPathParams {}

	export const path = () => `/api/1.0/whitelist`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		whitelist: {
			[contractAddress: string]: IWhitelistItem
		}
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
