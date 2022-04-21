import { IError, HttpMethod, IApiResponseBody } from '../../shared/api.shared'

/** Get Twitter Access Token */
export namespace GetInstagramAccessToken {
	export interface IPathParams {}

	export const path = () => `/api/1.0/meemid/instagram/access-token`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		code: string
	}

	export interface IResponseBody extends IApiResponseBody {
		accessToken: string
		userId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
