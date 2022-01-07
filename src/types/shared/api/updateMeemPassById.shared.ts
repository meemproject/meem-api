import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

/** Update user MeemPass */
export namespace UpdateMeemPassById {
	export interface IPathParams {
		/** The meem pass id to fetch */
		meemPassId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemPass/${options.meemPassId}`

	export const method = HttpMethod.Patch

	export interface IQueryParams {}

	export interface IRequestBody {
		isWhitelisted: boolean
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
