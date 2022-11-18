import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace AttachIdentity {
	export interface IPathParams {}

	export const path = () => `/api/1.0/attachIdentity`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Login w/ access token provided by Auth0 magic link */
		accessToken?: string
	}

	export interface IResponseBody extends IApiResponseBody {
		/** JWT that can be used for future authentication */
		jwt: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
