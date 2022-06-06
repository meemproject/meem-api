import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace CreateOrUpdateMeemContractIntegration {
	export interface IPathParams {
		/** The meem contract id to fetch */
		meemContractId: string
		/** The integration id to connect or update */
		integrationId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/integrations/${options.integrationId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Is the integration enabled? */
		isEnabled: boolean
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
