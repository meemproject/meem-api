import { MeemAPI } from '../../meem.generated'
import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateMeemContractRole {
	export interface IPathParams {
		/** The meem contract id to fetch */
		meemContractId: string
		/** The MeemContractRole id to update */
		meemContractRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/roles/${options.meemContractRoleId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Array of ids for permissions */
		permissions?: string[]
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
