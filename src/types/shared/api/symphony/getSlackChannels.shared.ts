import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { ISlackChannel } from '../../symphony.shared'

export namespace GetSlackChannels {
	export interface IPathParams {}

	export const path = () => '/api/1.0/slack/channels'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		agreementSlackId: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		channels: ISlackChannel[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
