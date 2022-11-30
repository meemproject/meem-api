import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/** Generate nonce for client to sign and verify a user's wallet address */
export namespace GetNonce {
	export interface IPathParams {}

	export const path = () => `/api/1.0/getNonce`

	export const method = HttpMethod.Get

	export interface IQueryParams {
		/** The address that will be signing */
		address: string
	}

	export interface IRequestBody {}

	export interface IResponseBody extends IApiResponseBody {
		nonce: string
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
 * 	@api [get] /getNonce
 * 	summary: "Generate nonce for client to sign and verify a user's wallet address"
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
 * 							nonce:
 * 								description: The generated message to sign
 * 								type: string
 **/
