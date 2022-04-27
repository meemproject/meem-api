import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace CreateClubGuild {
	export interface IPathParams {
		/** The club token id to update */
		tokenId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/clubs/${options.tokenId}/guild`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		guildName: string
		signature: string
	}

	export interface IResponseBody extends IApiResponseBody {
		guild: any
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
