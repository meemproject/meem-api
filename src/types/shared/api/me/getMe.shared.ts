import { IError, HttpMethod, IApiResponseBody } from '../../api.shared'
import { IMeemId } from '../../meem.shared'

export namespace GetMe {
	export interface IPathParams {}

	export const path = () => `/api/1.0/me`

	export const method = HttpMethod.Get

	export interface IQueryParams {}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		/** The authenticated user's wallet id */
		walletId: string

		/** The authenticated user's wallet address */
		address: string

		/** The authenticated user */
		user: any
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}

/** OpenAPI Definition */

/**
 * 	@api [get] /me
 * 	summary: "Generate nonce for client to sign and verify a user's wallet address"
 * 	security:
 * 		- jwtAuth: []
 * 	parameters:
 * 		- (query) address* {string} The wallet address that will sign the message
 * 	responses:
 * 		"200":
 * 			description: "Returns a generated message to sign"
 * 			content:
 * 				application/json:
 * 					schema:
 * 						type: object
 * 						properties:
 * 							walletId:
 * 								description: The authenticated user's wallet id
 * 								type: string
 * 							address:
 * 								description: The authenticated user's wallet address
 * 								type: string
 * 							user:
 * 								description: The authenticated user
 * 								type: object
 **/
