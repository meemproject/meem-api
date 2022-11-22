import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IAgreementRole } from '../../meem.shared'

export namespace GetAgreementRole {
	export interface IPathParams {
		/** The agreement id */
		agreementId: string
		/** The agreement role id */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		role: IAgreementRole
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
