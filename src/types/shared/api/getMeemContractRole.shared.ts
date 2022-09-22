import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace GetMeemContractRole {
	export interface IPathParams {
		/** The MeemContract id to fetch roles of */
		meemContractId: string
		/** The MeemContract Role id to fetch roles of */
		meemContractRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/roles/${options.meemContractRoleId}`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		role: any
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
