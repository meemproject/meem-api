import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace GetSlackEmojis {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/slack/emojis'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		agreementSlackId: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		emojis: {
			id: string
			name: string
			url?: string
			isAnimated?: boolean | null
		}[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
