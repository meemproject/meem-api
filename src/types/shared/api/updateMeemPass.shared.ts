import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

/** Update user MeemPass */
export namespace UpdateMeemPass {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me/meemPass`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		hasAppliedTwitter: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		status: 'success'
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
