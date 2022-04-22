import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace CreateOrUpdateClubConnection {
	export interface IPathParams {
		/** The club token id to update */
		tokenId: string
		/** The connection type to add or update */
		connectionType: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/clubs/${options.tokenId}/connections/${options.connectionType}`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Twitter account to add or lookup by */
		twitterAccessToken?: string
		/** Twitter account to add or lookup by */
		twitterAccessSecret?: string
		/** Instagram authentication code */
		instagramAuthCode?: string
		/** Instagram account to add */
		instagramUserId?: string
		/** Discord authentication code */
		discordAuthCode?: string
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
