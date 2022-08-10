import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

export namespace UpdateMeemContractGuildRole {
	export interface IPathParams {
		/** The ID of the contract */
		meemContractId: string
		/** The ID of the guild to update */
		guildId: string
		/** The ID of the role to update */
		roleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/meemContracts/${options.meemContractId}/guilds/${options.guildId}/roles/${options.roleId}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		discordGuildId: string
		gatedChannels: string[]
	}

	export interface IResponseBody extends IApiResponseBody {
		response: any
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
