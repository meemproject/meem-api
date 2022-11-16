import { MeemAPI } from '../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IntegrationVisibility } from '../meem.shared'

export namespace UpdateUserIdentity {
	export interface IPathParams {
		/** The integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/me/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Set the visibility type of the integration */
		visibility?: IntegrationVisibility
		/** Metadata associated with this integration */
		metadata?: { [key: string]: unknown }
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
