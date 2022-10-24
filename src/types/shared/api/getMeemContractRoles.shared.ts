import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IGuild } from '../meem.shared'

export namespace GetMeemContractRoles {
	export interface IPathParams {
		/** The MeemContract id to fetch roles of */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/roles`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		guild: IGuild | null
		roles: any[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
