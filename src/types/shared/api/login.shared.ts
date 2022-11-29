import { IError, HttpMethod, IApiResponseBody } from '../api.shared'

/**
 * 	@api [post] /login
 * 	description: "Log in a user."
 * 	requestBody:
 * 		content:
 * 			application/json:
 * 				schema:
 * 					$ref: '#/components/schemas/LoginRequestBody'
 * 	responses:
 * 		"200":
 * 			description: "Returns a jwt token for the logged-in user."
 * 			content:
 * 				application/json:
 * 					schema:
 * 						$ref: '#/components/schemas/LoginResponseBody'
 **/

/** Log in a user. */
export namespace Login {
	export interface IPathParams {}

	export const path = () => `/api/1.0/login`

	export const method = HttpMethod.Post

	export interface IQueryParams {}
	export interface IRequestBody {
		/**
		 *  @schema LoginRequestBody
		 *  properties:
		 *  	accessToken:
		 *  		description: Login w/ access token provided by Auth0 magic link
		 *  		type: integer
		 *  		format: int64
		 *  	address:
		 *  		type: string
		 *  	signature:
		 *  		type: string
		 *  	shouldConnectUser:
		 *  		type: boolean
		 */

		/** Login w/ access token provided by Auth0 magic link */
		accessToken?: string

		/** Login w/ wallet. Both address and signature must be provided */
		address?: string

		/** Login w/ wallet. Both address and signature must be provided */
		signature?: string

		/** Whether to connect the login method with the currently authenticated user */
		shouldConnectUser?: boolean
	}

	export interface IResponseBody extends IApiResponseBody {
		/**
		 * 	@schema LoginResponseBody
		 * 	properties:
		 * 		jwt:
		 * 			type: string
		 */

		/** JWT that can be used for future authentication */
		jwt: string
	}

	export interface IDefinition {
		pathParams: IPathParams
		queryParams: IQueryParams
		requestBody: IRequestBody
		responseBody: IResponseBody
	}

	export type Response = IResponseBody | IError
}
