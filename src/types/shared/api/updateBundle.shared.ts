import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateBundle {
	export interface IPathParams {
		bundleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/bundles/${options.bundleId}`

	export const method = HttpMethod.Put

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
		description: string
		contractIds: string[]
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
