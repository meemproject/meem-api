import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IAgreementRole } from '../../meem.shared'

/** Checks if the current user is an Agreement admin either by holding the Admin token or having the admin role on the contract */
export namespace CheckIsAgreementAdmin {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/isAdmin`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		isAdmin: boolean
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
