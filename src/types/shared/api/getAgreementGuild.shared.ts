import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IGuild, IAgreementRole } from '../meem.shared'

export namespace GetAgreementGuild {
	export interface IPathParams {
		/** The Agreement id of the guild to fetch */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/guild`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		guild: IGuild | null
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
