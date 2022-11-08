import { MeemAPI } from '../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace CreateOrUpdateAgreementExtension {
	export interface IPathParams {
		/** The meem contract id to fetch */
		agreementId: string
		/** The integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Is the integration enabled? */
		isEnabled?: boolean
		/** Is the integration publicly displayed on club */
		isPublic?: boolean
		/** Metadata associated with this integration */
		metadata?: MeemAPI.IAgreementExtensionMetadata
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
