import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemMetadataLike } from '../../meem.shared'

/** Allows invitation via email and/or wallet addresses. In the case of wallet address, this will function the same as bulkMint */
export namespace SendAgreementInvites {
	export interface IPathParams {
		/** The id of the agreement */
		agreementId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/invite`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		/** Array of email and/or wallet addresses */
		to: string[]
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
