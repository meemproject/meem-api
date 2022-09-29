import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemContractRole, IMeemId } from '../meem.shared'

export namespace GetUserMeemContractRolesAccess {
	export interface IPathParams {
		/** The MeemContract id */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/roles/access`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		hasRolesAccess: boolean
		roles: IMeemContractRole[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
