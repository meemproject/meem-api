import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IDiscordRole } from '../../symphony.shared'

export namespace GetDiscordRoles {
	export interface IPathParams {}

	export const path = () => '/api/1.0/symphony/discord/roles'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		agreementDiscordId: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		roles: IDiscordRole[]
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
