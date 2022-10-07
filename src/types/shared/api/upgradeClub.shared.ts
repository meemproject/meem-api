import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Create Meem Image */
export namespace UpgradeClub {
	export interface IPathParams {
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/upgrade`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Specify the bundle id to upgrade to. Defaults to latest Clubs bundle */
		bundleId?: string
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