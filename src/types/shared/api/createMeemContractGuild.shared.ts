import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace CreateMeemContractGuild {
	export interface IPathParams {
		/** The ID of the contract to fetch guilds for */
		meemContractId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/guilds`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		name: string
	}

	export interface IResponseBody extends IApiResponseBody {
		guildId: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
