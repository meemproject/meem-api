import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId, IMeemIdAccount } from '../meem.shared'

/** Create Meem Image */
export namespace CreateOrUpdateMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemid`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		accountAddress: string
		id?: string
		account?: IMeemIdAccount
	}

	export interface IResponseBody extends IApiResponseBody {
		meemId: IMeemId
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
