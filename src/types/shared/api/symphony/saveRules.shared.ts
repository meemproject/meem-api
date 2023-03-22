import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IRuleToSave } from '../../symphony.shared'

export namespace SaveRule {
	export interface IPathParams {}

	export const path = () => '/api/1.0/saveRule'

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		agreementId: string
		rule: IRuleToSave
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
