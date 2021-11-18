import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IAccessList, IWhitelistItem } from '../meem.shared'

/** Get Meem access config */
export namespace GetAccessList {
	export interface IPathParams {}

	export const path = () => `/api/1.0/access`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		access: IAccessList
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
