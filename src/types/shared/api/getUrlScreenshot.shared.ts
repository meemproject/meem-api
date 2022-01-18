import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace GetUrlScreenshot {
	export interface IPathParams {}

	export const path = () => `/api/1.0/screenshotUrl`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		url: string
	}

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
