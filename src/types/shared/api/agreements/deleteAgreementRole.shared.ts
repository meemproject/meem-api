import { MeemAPI } from '../../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace DeleteAgreementRole {
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string
		/** The AgreementRole id to update */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}`

	export const method = HttpMethod.Delete

	export interface IQueryParams {}

	export interface IRequestBody {}

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
