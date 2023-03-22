import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace DisconnectSlack {
	export interface IPathParams {}

	export const path = () => '/api/1.0/slack'

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The agreement slack to disconnect */
		agreementSlackId: string
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
