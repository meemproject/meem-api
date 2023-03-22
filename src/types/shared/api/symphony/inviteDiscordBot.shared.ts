import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'

export namespace InviteDiscordBot {
	export interface IPathParams {}

	export const path = () => '/api/1.0/discord/inviteBot'

	export const method = HttpMethod.Get

	export interface IQueryParams {
		agreementId: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The url to invite the bot to your discord */
		inviteUrl: string

		/** The code to activate the bot using /activateSteward command */
		code: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
