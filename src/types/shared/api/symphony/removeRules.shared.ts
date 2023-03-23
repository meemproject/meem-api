import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace RemoveRules {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/removeRules'

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		agreementId: string
		ruleIds: string[]
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
