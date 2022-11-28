import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace IsSlugAvailable {
	export interface IPathParams {}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/isSlugAvailable`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** New slug to check */
		slug: string

		/** The new agreement chain id */
		chainId: number
	}

	export interface IResponseBody extends IApiResponseBody {
		isSlugAvailable: boolean
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
