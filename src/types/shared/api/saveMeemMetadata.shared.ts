import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import {
	Chain,
	IMeemPermission,
	IMeemSplit,
	IMeemProperties
} from '../meem.shared'

/** Mint a new Meem */
export namespace SaveMeemMetadata {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meems/saveMetadata`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Optional name of the Meem to be stored in the Meem metadata */
		name: string

		/** Optional description of the Meem to be stored in the Meem metadata */
		description: string

		/** Base64 image string to use for the minted meem image */
		base64Image: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** URL of stored metadata */
		url: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
