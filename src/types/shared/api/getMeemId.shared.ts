import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace GetMeemId {
	interface IMeemIdData extends IMeemId {
		defaultTwitterUser?: {
			username: string
			profileImageUrl: string | null
		}
	}

	export interface IPathParams {}

	export const path = () => `/api/1.0/meemId`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** Wallet address to lookup by */
		address?: string
		/** Twitter id to lookup by */
		twitterId?: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The MeemId */
		meemId: IMeemIdData
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
