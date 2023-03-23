import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace DisconnectDiscord {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/discord'

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {
		/** The agreement discord to disconnect */
		agreementDiscordId: string
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
