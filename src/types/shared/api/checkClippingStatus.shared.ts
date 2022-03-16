import {
	IError,
	HttpMethod,
	IApiResponseBody,
	IRequestPaginated
} from '../api.shared'
import { IClippingExtended } from '../meem.shared'

export namespace CheckClippingStatus {
	export interface IPathParams {}

	export const path = () => `/api/1.0/clippings/status`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Filter by address that clipped */
		address: string
		/** The tokenIds to check. Maximum 200 */
		tokenIds: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		/** Whether the token has been clipped */
		status: {
			[tokenId: string]: boolean
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
