import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IAgreementRole, IMeemId } from '../meem.shared'

export namespace GetUserAgreementRolesAccess {
	export interface IPathParams {
		/** The Agreement id */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/access`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		hasRolesAccess: boolean
		roles: IAgreementRole[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
