import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IDiscordChannel } from '../../symphony.shared'

export namespace GetDiscordChannels {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/discord/channels'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		agreementDiscordId: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		channels: IDiscordChannel[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
