import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Get Config */
export namespace GetConfig {
	export interface IPathParams {}

	export const path = () => '/api/1.0/config'

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
