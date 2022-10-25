import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IGuild, IMeemContractRole } from '../meem.shared'

export namespace GetMeemContractGuild {
	export interface IPathParams {
		/** The MeemContract id of the guild to fetch */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/guild`

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
