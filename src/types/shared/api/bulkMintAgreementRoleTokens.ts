import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { ITokenMetadataLike } from '../meem.shared'

export namespace BulkMintAgreementRoleTokens {
	export interface IPathParams {
		/** The id of the agreement to fetch */
		agreementId: string
		/** The id of the agreement role to fetch */
		agreementRoleId: string
	}

	export const path = (options: IPathParams) =>
		`/api/1.0/agreements/${options.agreementId}/roles/${options.agreementRoleId}/bulkMint`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		tokens: {
			/** Metadata object to be used for the minted Meem */
			metadata?: ITokenMetadataLike

			/** The address where the Meem will be minted to. */
			to: string
		}[]
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
