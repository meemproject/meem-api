import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Create Meem Image */
export namespace CreateMeemImage {
	export interface IPathParams {}

	export const path = () => `/images/1.0/meems/create-image`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokenAddress?: string
		tokenId?: number
		chain?: number
		base64Image?: string
		imageUrl?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		image: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
