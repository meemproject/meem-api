import { IError, HttpMethod, IApiResponseBody } from '../api.shared'
import { IMeemId } from '../meem.shared'

export namespace CreateOrUpdateMeemId {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Post

	export interface IQueryParams {}

	export interface IRequestBody {
		// TODO: Add wallet address with signature to Identity. Remove from any other identity
		// e.g. Identity merge
		/** Wallet address to add or lookup by */
		// address: string
		/** Signature of wallet address */
		// signature: string

		/** Profile picture base64 string */
		profilePicBase64?: string
		/** Url to profile picture */
		// profilePicUrl?: string
		/** Display name of identity */
		displayName?: string
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
