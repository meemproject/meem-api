import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { ICreateMeemMetadata, ITokenMetadata } from '../meem.shared'

export namespace SaveMetadata {
	export interface IPathParams {}

	export const path = () => `/images/1.0/metadata`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** JSON.stringify object of metadata conforming to ICreateMeemMetadata */
		metadata: string
	}

	export interface IResponseBody extends IApiResponseBody {
		metadata: ITokenMetadata
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
